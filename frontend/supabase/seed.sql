-- Practice data for development. NOT part of the schema.
-- Run it in the Supabase SQL Editor (after schema.sql) to fill ONE shop with sample data.
-- Safe to run more than once: existing SKUs and category names in that shop are skipped.

-- 1. Which shop gets the data: the first shop ever created (oldest owner).
-- To fill a different shop, replace the select with: select org_id from memberships where email = 'their@email.com'
drop table if exists seed_shop;
create temp table seed_shop as
select org_id from memberships where role = 'owner' order by created_at limit 1;

do $$ begin
  if (select count(*) from seed_shop) <> 1 then
    raise exception 'No shop found. Log in to the app and create your shop first.';
  end if;
end $$;

-- 2. Five sample categories
insert into categories (org_id, name)
select org_id, name
from seed_shop
cross join unnest(array['Beverages', 'Snacks', 'Household', 'Personal care', 'Stationery']) as name
on conflict do nothing; -- skip names that already exist in this shop

-- 3. Twenty sample products, each with an "Opening stock" movement.
-- The SQL Editor runs as the database owner, so org_id must be given here (current_org_id() is empty).
with seed(name, sku, price, qty, category) as (
  values
    ('Cola 330ml can',                'BEV-101', 0.80, 120, 'Beverages'),
    ('Lemon soda 330ml can',          'BEV-102', 0.80,  85, 'Beverages'),
    ('Mineral water 1L',              'BEV-103', 0.50, 200, 'Beverages'),
    ('Orange juice 1L',               'BEV-104', 2.50,   8, 'Beverages'),
    ('Green tea 500ml',               'BEV-105', 1.20,   0, 'Beverages'),
    ('Instant coffee 3-in-1 (30 pk)', 'BEV-106', 4.50,  35, 'Beverages'),
    ('Potato chips original 150g',    'SNK-201', 1.80,  60, 'Snacks'),
    ('Chocolate bar 50g',             'SNK-202', 1.00,   5, 'Snacks'),
    ('Salted peanuts 200g',           'SNK-203', 1.50,  40, 'Snacks'),
    ('Butter cookies tin 400g',       'SNK-204', 6.90,   0, 'Snacks'),
    ('Instant noodles chicken',       'SNK-205', 0.45, 300, 'Snacks'),
    ('Dishwashing liquid 500ml',      'HOM-301', 2.20,  25, 'Household'),
    ('Laundry detergent 2kg',         'HOM-302', 7.50,   3, 'Household'),
    ('Toilet paper (10 rolls)',       'HOM-303', 4.80,  18, 'Household'),
    ('Trash bags (30 pcs)',           'HOM-304', 2.90,   0, 'Household'),
    ('Toothpaste 120g',               'PER-401', 1.90,  45, 'Personal care'),
    ('Shampoo 400ml',                 'PER-402', 4.20,  12, 'Personal care'),
    ('Bath soap (3-pack)',            'PER-403', 2.40,   9, 'Personal care'),
    ('Ballpoint pen blue (10 pcs)',   'STA-501', 2.00,  50, 'Stationery'),
    ('A4 copy paper (500 sheets)',    'STA-502', 5.50,   7, 'Stationery')
),
new_products as (
  insert into products (org_id, name, sku, price, category_id)
  select shop.org_id, s.name, s.sku, s.price, c.id
  from seed s
  cross join seed_shop shop
  left join categories c on c.org_id = shop.org_id and c.name = s.category
  on conflict (org_id, sku) do nothing -- skip SKUs that already exist in this shop
  returning id, org_id, sku
)
-- The stock trigger turns these movements into products.stock_quantity
insert into stock_movements (org_id, product_id, type, quantity, note)
select p.org_id, p.id, 'in', s.qty, 'Opening stock'
from new_products p
join seed s using (sku)
where s.qty > 0;

-- Show which shop got the data (last, so the SQL Editor displays it).
-- seed_shop is a temp table: it disappears when the session ends, and the next run drops it first.
select o.name as shop, count(p.id) as products
from seed_shop s
join organizations o on o.id = s.org_id
left join products p on p.org_id = o.id
group by o.name;
