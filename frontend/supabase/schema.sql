//Create products table
create table products (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  sku        text not null unique,
  price      numeric(12, 2) not null default 0 check (price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  created_at timestamptz not null default now()
);

// Enable row level security
alter table products enable row level security;

create policy "dev: anyone can read products"
  on products for select
  using (true);

create policy "dev: anyone can add products"
  on products for insert
  with check (true);

create policy "dev: anyone can update products"
  on products for update
  using (true) with check (true);

create policy "dev: anyone can delete products"
  on products for delete
  using (true);

create type movement_type as enum ('in', 'out', 'adjustment');

create table stock_movements (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  type       movement_type not null,
  quantity   integer not null check (quantity <> 0),
  note       text,
  created_at timestamptz not null default now(),
  check (type = 'adjustment' or quantity > 0)
);

-- Categories table
-- Phase 10: categories (org_id comes in Phase 5, owner-only policies in Phase 7)
create table if not exists categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);
create unique index if not exists categories_name_key on categories (lower(name)); -- "Snacks" = "snacks"

alter table categories enable row level security;
drop policy if exists "dev: anyone can read categories"   on categories;
drop policy if exists "dev: anyone can add categories"    on categories;
drop policy if exists "dev: anyone can update categories" on categories;
drop policy if exists "dev: anyone can delete categories" on categories;
create policy "dev: anyone can read categories"   on categories for select using (true);
create policy "dev: anyone can add categories"    on categories for insert with check (true);
create policy "dev: anyone can update categories" on categories for update using (true) with check (true);
create policy "dev: anyone can delete categories" on categories for delete using (true);

alter table products add column if not exists category_id uuid references categories(id) on delete set null;
create index if not exists products_category_id_idx on products (category_id);

-- Phase 10b: one image per product (public bucket). Phase 5: path starts with org_id; Phase 7: owners only.
alter table products add column if not exists image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "dev: anyone can read product images"   on storage.objects;
drop policy if exists "dev: anyone can upload product images" on storage.objects;
drop policy if exists "dev: anyone can update product images" on storage.objects;
drop policy if exists "dev: anyone can delete product images" on storage.objects;
create policy "dev: anyone can read product images"   on storage.objects for select using (bucket_id = 'product-images');
create policy "dev: anyone can upload product images" on storage.objects for insert with check (bucket_id = 'product-images');
create policy "dev: anyone can update product images" on storage.objects for update using (bucket_id = 'product-images');
create policy "dev: anyone can delete product images" on storage.objects for delete using (bucket_id = 'product-images');

-- Which product columns the app may UPDATE (column privileges).
-- stock_quantity is left out on purpose: stock only changes through stock_movements.
-- Every new product column that the app edits must be added here.
revoke update on products from anon, authenticated;
grant update (name, sku, price, category_id, image_path) on products to anon, authenticated;

-- Phase 3: only signed-in users (role "authenticated") can use the data.
-- The anon key alone now reads and writes nothing. Phase 5 replaces these with org_id = current_org_id().
alter table products        enable row level security;
alter table categories      enable row level security;
alter table stock_movements enable row level security;

drop policy if exists "dev: anyone can read products"   on products;
drop policy if exists "dev: anyone can add products"    on products;
drop policy if exists "dev: anyone can update products" on products;
drop policy if exists "dev: anyone can delete products" on products;
drop policy if exists "signed in: read products"   on products;
drop policy if exists "signed in: add products"    on products;
drop policy if exists "signed in: update products" on products;
drop policy if exists "signed in: delete products" on products;
create policy "signed in: read products"   on products for select to authenticated using (true);
create policy "signed in: add products"    on products for insert to authenticated with check (true);
create policy "signed in: update products" on products for update to authenticated using (true) with check (true);
create policy "signed in: delete products" on products for delete to authenticated using (true);

drop policy if exists "dev: anyone can read categories"   on categories;
drop policy if exists "dev: anyone can add categories"    on categories;
drop policy if exists "dev: anyone can update categories" on categories;
drop policy if exists "dev: anyone can delete categories" on categories;
drop policy if exists "signed in: read categories"   on categories;
drop policy if exists "signed in: add categories"    on categories;
drop policy if exists "signed in: update categories" on categories;
drop policy if exists "signed in: delete categories" on categories;
create policy "signed in: read categories"   on categories for select to authenticated using (true);
create policy "signed in: add categories"    on categories for insert to authenticated with check (true);
create policy "signed in: update categories" on categories for update to authenticated using (true) with check (true);
create policy "signed in: delete categories" on categories for delete to authenticated using (true);

-- Movements are an audit log: read and add only, never update or delete
-- (the two "dev:" movement policies were created in the SQL editor earlier, never in this file)
drop policy if exists "dev: anyone can read movements" on stock_movements;
drop policy if exists "dev: anyone can add movements"  on stock_movements;
drop policy if exists "signed in: read movements" on stock_movements;
drop policy if exists "signed in: add movements"  on stock_movements;
create policy "signed in: read movements" on stock_movements for select to authenticated using (true);
create policy "signed in: add movements"  on stock_movements for insert to authenticated with check (true);

-- Product images: anyone may view (public bucket), only signed-in users may upload, replace or delete
drop policy if exists "dev: anyone can upload product images" on storage.objects;
drop policy if exists "dev: anyone can update product images" on storage.objects;
drop policy if exists "dev: anyone can delete product images" on storage.objects;
drop policy if exists "signed in: upload product images" on storage.objects;
drop policy if exists "signed in: update product images" on storage.objects;
drop policy if exists "signed in: delete product images" on storage.objects;
create policy "signed in: upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images');
create policy "signed in: update product images" on storage.objects for update to authenticated using (bucket_id = 'product-images');
create policy "signed in: delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images');
