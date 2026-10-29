-- Inventory SaaS database schema.
-- Idempotent: the whole file can be run again in the Supabase SQL Editor at any time.
-- One-time data resets (drop table ...) are never kept in this file.
-- Sample data lives in seed.sql.
--
-- Order matters: shops first, because the other tables use current_org_id() as a default.
--   1. Shops (organizations, memberships, helper functions)
--   2. Categories
--   3. Products
--   4. Stock movements + the trigger that applies them to products.stock_quantity
--   5. Column privileges (what the app may write)
--   6. Row level security policies
--   7. Product images (storage bucket)
--   8. Invite codes and members (staff join a shop with a code; owners remove staff)


-- =====================================================================
-- 1. Shops: organizations and memberships. Every user belongs to at most one shop.
-- =====================================================================

do $$ begin
  create type org_role as enum ('owner', 'staff');
exception when duplicate_object then null;
end $$;

create table if not exists organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists memberships (
  user_id    uuid primary key references auth.users(id) on delete cascade, -- primary key = one shop per user
  org_id     uuid not null references organizations(id) on delete cascade,
  role       org_role not null,
  email      text not null, -- copied from the login token, because the app cannot read auth.users
  created_at timestamptz not null default now()
);
create index if not exists memberships_org_id_idx on memberships (org_id);

-- Helpers for RLS policies. "security definer" runs them as the table owner, so they can read
-- memberships without going through memberships' own policies (no policy recursion).
create or replace function current_org_id() returns uuid
language sql stable security definer set search_path = ''
as $$
  select org_id from public.memberships where user_id = auth.uid()
$$;

create or replace function is_owner() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.memberships where user_id = auth.uid() and role = 'owner')
$$;

-- Create a shop and make the caller its owner, in one transaction.
-- Called from the app as supabase.rpc('create_organization', { org_name }).
create or replace function create_organization(org_name text) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  new_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'You must be logged in.';
  end if;
  if exists (select 1 from public.memberships where user_id = auth.uid()) then
    raise exception 'You already belong to a shop.';
  end if;
  if length(trim(coalesce(org_name, ''))) = 0 then
    raise exception 'Shop name is required.';
  end if;

  insert into public.organizations (name) values (trim(org_name)) returning id into new_org_id;
  -- If two calls race, the second fails here on the primary key and its organization is rolled back too
  insert into public.memberships (user_id, org_id, role, email)
  values (auth.uid(), new_org_id, 'owner', coalesce(auth.jwt() ->> 'email', ''));
  return new_org_id;
end
$$;

-- Only signed-in users may call these (Supabase grants new functions to anon by default)
revoke execute on function current_org_id()          from public, anon;
revoke execute on function is_owner()                from public, anon;
revoke execute on function create_organization(text) from public, anon;
grant  execute on function current_org_id()          to authenticated;
grant  execute on function is_owner()                to authenticated;
grant  execute on function create_organization(text) to authenticated;


-- =====================================================================
-- 2. Categories (one optional category per product)
-- =====================================================================

create table if not exists categories (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null default current_org_id() references organizations(id) on delete cascade,
  name       text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  unique (id, org_id) -- lets products check "category is in the same shop" (see products)
);
create unique index if not exists categories_org_name_key on categories (org_id, lower(name)); -- "Snacks" = "snacks", per shop


-- =====================================================================
-- 3. Products
-- =====================================================================

create table if not exists products (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null default current_org_id() references organizations(id) on delete cascade,
  name           text not null check (length(trim(name)) > 0),
  sku            text not null check (length(trim(sku)) > 0),
  price          numeric(12, 2) not null default 0 check (price >= 0), -- selling price
  stock_quantity integer not null default 0 check (stock_quantity >= 0), -- only changed by the stock trigger
  category_id    uuid,
  image_path     text, -- file path in the "product-images" storage bucket
  created_at     timestamptz not null default now(),
  unique (org_id, sku), -- SKU is unique per shop; two shops may use the same SKU
  unique (id, org_id),  -- lets stock_movements check "product is in the same shop"
  -- Composite key: the category must belong to the same shop as the product.
  -- Deleting a category only clears category_id (org_id stays).
  foreign key (category_id, org_id) references categories (id, org_id) on delete set null (category_id)
);
create index if not exists products_org_name_idx    on products (org_id, name); -- list + pagination, ordered by name
create index if not exists products_category_id_idx on products (category_id);


-- =====================================================================
-- 4. Stock movements. Never updated or deleted (audit log); corrections use an adjustment.
-- =====================================================================

do $$ begin
  create type movement_type as enum ('in', 'out', 'adjustment');
exception when duplicate_object then null;
end $$;

create table if not exists stock_movements (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null default current_org_id() references organizations(id) on delete cascade,
  product_id uuid not null,
  type       movement_type not null,
  quantity   integer not null check (quantity <> 0), -- in/out: positive; adjustment: + or -
  note       text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null, -- who recorded it
  created_at timestamptz not null default now(),
  check (type = 'adjustment' or quantity > 0),
  foreign key (product_id, org_id) references products (id, org_id) on delete cascade -- same shop
);
create index if not exists stock_movements_product_idx on stock_movements (product_id, created_at desc);

-- Apply every new movement to products.stock_quantity.
-- "security definer": the app itself may not write stock_quantity (see column privileges), only this trigger.
-- Selling more than is in stock breaks check (stock_quantity >= 0), so the movement is rejected too.
create or replace function apply_stock_movement() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.products
  set stock_quantity = stock_quantity + case when new.type = 'out' then -new.quantity else new.quantity end
  where id = new.product_id;
  return new;
end
$$;

drop trigger if exists stock_movements_apply on stock_movements;
create trigger stock_movements_apply
  after insert on stock_movements
  for each row execute function apply_stock_movement();


-- =====================================================================
-- 5. Column privileges: which columns the app may write.
-- org_id, created_by, ids and dates come from defaults; stock_quantity only from the trigger.
-- Every new column that the app writes must be added here.
-- =====================================================================

revoke insert, update on categories      from anon, authenticated;
revoke insert, update on products        from anon, authenticated;
revoke insert, update on stock_movements from anon, authenticated;

grant insert (name), update (name) on categories to authenticated;
grant insert (name, sku, price, category_id, image_path),
      update (name, sku, price, category_id, image_path) on products to authenticated;
grant insert (product_id, type, quantity, note) on stock_movements to authenticated; -- no update: audit log


-- =====================================================================
-- 6. Row level security: every member sees and changes only their own shop's rows.
-- Phase 7 limits insert/update/delete on products and categories to owners.
-- =====================================================================

alter table organizations   enable row level security;
alter table memberships     enable row level security;
alter table categories      enable row level security;
alter table products        enable row level security;
alter table stock_movements enable row level security;

-- Shops and members: read only here. Rows are created by create_organization / join_organization;
-- owners removing staff is in section 8.
drop policy if exists "members: read own shop" on organizations;
create policy "members: read own shop" on organizations
  for select to authenticated using (id = current_org_id());

drop policy if exists "members: read memberships in own shop" on memberships;
create policy "members: read memberships in own shop" on memberships
  for select to authenticated using (org_id = current_org_id());

drop policy if exists "members: read categories"   on categories;
drop policy if exists "members: add categories"    on categories;
drop policy if exists "members: update categories" on categories;
drop policy if exists "members: delete categories" on categories;
create policy "members: read categories"   on categories for select to authenticated using (org_id = current_org_id());
create policy "members: add categories"    on categories for insert to authenticated with check (org_id = current_org_id());
create policy "members: update categories" on categories for update to authenticated
  using (org_id = current_org_id()) with check (org_id = current_org_id());
create policy "members: delete categories" on categories for delete to authenticated using (org_id = current_org_id());

drop policy if exists "members: read products"   on products;
drop policy if exists "members: add products"    on products;
drop policy if exists "members: update products" on products;
drop policy if exists "members: delete products" on products;
create policy "members: read products"   on products for select to authenticated using (org_id = current_org_id());
create policy "members: add products"    on products for insert to authenticated with check (org_id = current_org_id());
create policy "members: update products" on products for update to authenticated
  using (org_id = current_org_id()) with check (org_id = current_org_id());
create policy "members: delete products" on products for delete to authenticated using (org_id = current_org_id());

-- Movements: read and add only
drop policy if exists "members: read movements" on stock_movements;
drop policy if exists "members: add movements"  on stock_movements;
create policy "members: read movements" on stock_movements for select to authenticated using (org_id = current_org_id());
create policy "members: add movements"  on stock_movements for insert to authenticated with check (org_id = current_org_id());


-- =====================================================================
-- 7. Product images: public bucket, one folder per shop: "<org_id>/<product_id>/<random>.webp".
-- Anyone with the URL can view a picture (public bucket, no policy needed for that).
-- A member can only list, upload and delete files in their own shop's folder. Phase 7: owners only.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Older policies from Phase 10b and Phase 3
drop policy if exists "dev: anyone can read product images"   on storage.objects;
drop policy if exists "dev: anyone can upload product images" on storage.objects;
drop policy if exists "dev: anyone can update product images" on storage.objects;
drop policy if exists "dev: anyone can delete product images" on storage.objects;
drop policy if exists "signed in: upload product images" on storage.objects;
drop policy if exists "signed in: update product images" on storage.objects;
drop policy if exists "signed in: delete product images" on storage.objects;

drop policy if exists "members: read own product images"   on storage.objects;
drop policy if exists "members: upload own product images" on storage.objects;
drop policy if exists "members: update own product images" on storage.objects;
drop policy if exists "members: delete own product images" on storage.objects;
create policy "members: read own product images" on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = current_org_id()::text);
create policy "members: upload own product images" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = current_org_id()::text);
create policy "members: update own product images" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = current_org_id()::text)
  with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = current_org_id()::text);
create policy "members: delete own product images" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = current_org_id()::text);


-- =====================================================================
-- 8. Invite codes and members.
-- The owner generates a single-use code (valid 7 days); a new user enters it on onboarding and joins as staff.
-- Invites are only written by the two functions below, never directly by the app.
-- =====================================================================

create table if not exists org_invites (
  code       text primary key, -- 8 characters, e.g. K7QM3XPA (the app shows it as K7QM-3XPA)
  org_id     uuid not null references organizations(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  used_by    uuid references auth.users(id) on delete set null,
  used_at    timestamptz -- null = not used yet
);
create index if not exists org_invites_org_id_idx on org_invites (org_id);

-- Owner only: make a new invite code for their shop and return it.
create or replace function create_invite() returns text
language plpgsql security definer set search_path = ''
as $$
declare
  -- 32 characters without look-alikes (no 0/O, 1/I)
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  random_bytes bytea := uuid_send(gen_random_uuid()); -- 16 secure random bytes
  new_code text := '';
  i int;
begin
  if not public.is_owner() then
    raise exception 'Only the shop owner can create invite codes.';
  end if;

  -- Bytes 6 and 8 of a uuid are partly fixed (version/variant), so use the others.
  -- 256 is a multiple of 32, so every character is equally likely.
  foreach i in array array[0, 1, 2, 3, 4, 5, 10, 11] loop
    new_code := new_code || substr(alphabet, get_byte(random_bytes, i) % 32 + 1, 1);
  end loop;

  insert into public.org_invites (code, org_id, created_by)
  values (new_code, public.current_org_id(), auth.uid());
  return new_code;
end
$$;

-- Join a shop as staff with an invite code. Everything happens in one transaction.
-- Called from the app as supabase.rpc('join_organization', { invite_code }).
create or replace function join_organization(invite_code text) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  invite public.org_invites;
begin
  if auth.uid() is null then
    raise exception 'You must be logged in.';
  end if;
  if exists (select 1 from public.memberships where user_id = auth.uid()) then
    raise exception 'You already belong to a shop.';
  end if;

  -- "K7QM-3xpa" and "k7qm3xpa" both become "K7QM3XPA".
  -- "for update" locks the invite, so two people can't use the same code at the same time.
  select * into invite
  from public.org_invites
  where code = upper(regexp_replace(coalesce(invite_code, ''), '[^A-Za-z0-9]', '', 'g'))
  for update;

  -- One message for every case, so guessing codes reveals nothing
  if not found or invite.used_at is not null or invite.expires_at < now() then
    raise exception 'This invite code is not valid. It may be wrong, already used, or expired.';
  end if;

  insert into public.memberships (user_id, org_id, role, email)
  values (auth.uid(), invite.org_id, 'staff', coalesce(auth.jwt() ->> 'email', ''));
  update public.org_invites set used_by = auth.uid(), used_at = now() where code = invite.code;
  return invite.org_id;
end
$$;

revoke execute on function create_invite()             from public, anon;
revoke execute on function join_organization(text)     from public, anon;
grant  execute on function create_invite()             to authenticated;
grant  execute on function join_organization(text)     to authenticated;

-- The app may only read invites; the functions above write them
revoke insert, update, delete on org_invites from anon, authenticated;

alter table org_invites enable row level security;

drop policy if exists "owners: read own shop invites" on org_invites;
create policy "owners: read own shop invites" on org_invites
  for select to authenticated using (org_id = current_org_id() and is_owner());

-- Owners remove staff from their shop. Owners themselves can't be removed (role = 'staff' only).
drop policy if exists "owners: remove staff" on memberships;
create policy "owners: remove staff" on memberships
  for delete to authenticated using (org_id = current_org_id() and is_owner() and role = 'staff');
