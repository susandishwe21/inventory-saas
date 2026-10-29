-- Practice data for development. NOT part of the schema.
-- Run it in the Supabase SQL Editor when you want sample data (after schema.sql).
-- Safe to run more than once: existing SKUs and category names are skipped.
-- Phase 5 resets the tables and adds org_id, so this file will need updating then.

-- 20 sample products, each with an "Opening stock" movement
with seed(name, sku, price, qty) as (
  values
    ('Cola 330ml can',                'BEV-101', 0.80, 120),
    ('Lemon soda 330ml can',          'BEV-102', 0.80,  85),
    ('Mineral water 1L',              'BEV-103', 0.50, 200),
    ('Orange juice 1L',               'BEV-104', 2.50,   8),
    ('Green tea 500ml',               'BEV-105', 1.20,   0),
    ('Instant coffee 3-in-1 (30 pk)', 'BEV-106', 4.50,  35),
    ('Potato chips original 150g',    'SNK-201', 1.80,  60),
    ('Chocolate bar 50g',             'SNK-202', 1.00,   5),
    ('Salted peanuts 200g',           'SNK-203', 1.50,  40),
    ('Butter cookies tin 400g',       'SNK-204', 6.90,   0),
    ('Instant noodles chicken',       'SNK-205', 0.45, 300),
    ('Dishwashing liquid 500ml',      'HOM-301', 2.20,  25),
    ('Laundry detergent 2kg',         'HOM-302', 7.50,   3),
    ('Toilet paper (10 rolls)',       'HOM-303', 4.80,  18),
    ('Trash bags (30 pcs)',           'HOM-304', 2.90,   0),
    ('Toothpaste 120g',               'PER-401', 1.90,  45),
    ('Shampoo 400ml',                 'PER-402', 4.20,  12),
    ('Bath soap (3-pack)',            'PER-403', 2.40,   9),
    ('Ballpoint pen blue (10 pcs)',   'STA-501', 2.00,  50),
    ('A4 copy paper (500 sheets)',    'STA-502', 5.50,   7)
),
new_products as (
  insert into products (name, sku, price)
  select name, sku, price from seed
  on conflict (sku) do nothing          -- skip if this SKU already exists
  returning id, sku
)
insert into stock_movements (product_id, type, quantity, note)
select p.id, 'in', s.qty, 'Opening stock'
from new_products p
join seed s using (sku)
where s.qty > 0;

-- 5 sample categories, and put the sample products into them by SKU prefix
insert into categories (name)
values ('Beverages'), ('Snacks'), ('Household'), ('Personal care'), ('Stationery')
on conflict do nothing;

update products p
set category_id = c.id
from categories c
where p.category_id is null
  and c.name = case split_part(p.sku, '-', 1)
    when 'BEV' then 'Beverages'
    when 'SNK' then 'Snacks'
    when 'HOM' then 'Household'
    when 'PER' then 'Personal care'
    when 'STA' then 'Stationery'
  end
  and p.sku ~ '^(BEV|SNK|HOM|PER|STA)-[0-9]{3}$';  -- only the sample SKUs
