create table products (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  sku        text not null unique,
  price      numeric(12, 2) not null default 0 check (price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  created_at timestamptz not null default now()
);