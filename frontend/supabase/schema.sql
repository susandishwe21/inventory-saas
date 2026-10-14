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