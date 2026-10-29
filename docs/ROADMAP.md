# Roadmap

Goal: turn the single-page inventory app into a multi-tenant SaaS. Each shop (organization) sees only its own data, enforced by Postgres RLS. Phases are small, one feature each, and done in order. Finish a phase completely before starting the next.

## Decisions

| Topic | Decision |
|---|---|
| Organizations | One org per user. Registering, then "Create shop", makes you its **owner**. |
| Staff joining | Owner generates a single-use **invite code** (expires in 7 days); staff register, then enter the code. |
| Roles | **owner**: everything. **staff**: view everything, record stock movements, export CSV. Only owners create/edit/delete products, categories, suppliers, and manage members. |
| Stock value | New `cost_price` column; stock value = `cost_price × stock_quantity`. Existing `price` is the selling price. |
| Product relations | One optional category and one optional supplier per product (`category_id`, `supplier_id`, nullable). |
| Stock status | `out` if stock = 0, `low` if stock ≤ `low_stock_level` (per product, default 10), otherwise `in`. Stored as a generated column so the database can filter on it. |
| Existing data | Dev data is wiped once (Phase 5); tables are recreated with `org_id`. |
| Styling | Tailwind CSS. |
| Lists | Search, filters and pagination run in the database (Supabase `.range()` + `count: 'exact'`), not in the browser. This carries over to the NestJS API later. |
| Movement history | Movements are never edited or deleted (audit log). Corrections use an `adjustment`. |
| Product images | Added to scope later: **one image per product**, stored in a **public** Supabase Storage bucket (Phase 10b). |
| Sample data | Practice data lives in `frontend/supabase/seed.sql`, never in `schema.sql`. |

Out of scope: orders, finance, customers, marketing, discounts, sales channels, incoming/purchase orders.

## Definition of done (every phase)

- `npm run build` and `npm run lint` pass in `frontend/`.
- All SQL for the phase is in `frontend/supabase/schema.sql`, the whole file re-runs without errors, and every new table has RLS enabled with policies.
- Supabase calls only in `frontend/src/services/` (including `supabase.auth`).
- The phase's own checks below pass in the browser.

---

## Phase 1 — Tailwind CSS

**Goal:** Tailwind is set up so the new UI can be built with utility classes.

- **DB:** none.
- **UI:** Install Tailwind for Vite. Remove the leftover Vite template CSS (`App.css`, most of `index.css`). Restyle the current products page with Tailwind instead of inline `style={{}}`.

**Verify:** The products page looks the same or better, and there are no inline `style` props left in `src/`.

## Phase 2 — Router and sidebar layout

**Goal:** A multi-page app shell.

- **DB:** none.
- **UI:** Add React Router. Create a layout with a sidebar grouped by workflow (Overview: Dashboard · Inventory: Products, Categories, Suppliers · Stock: Stock history · Settings at the bottom) and an `<Outlet />` for page content. On small screens the sidebar opens from a menu button. Move the current products page to `/products`. Other routes show a "Coming in Phase X" placeholder; unknown URLs show a 404 page. `/` redirects to `/dashboard`.

**Verify:** Every sidebar link changes the URL and page, the active link is highlighted, and refreshing the browser on `/products` still works.

## Phase 3 — Login and register (Supabase Auth) ✅

**Goal:** Only signed-in users can use the app.

- **DB:** Change the `dev:` policies on `products`/`stock_movements` from `using (true)` to `to authenticated`. *Done for `categories` and the `product-images` upload/update/delete policies too. `stock_movements` had no RLS in `schema.sql`; it now has RLS with select and insert policies only. Viewing images stays public.* For local development, turn off "Confirm email" in Supabase Auth settings, or keep it on and confirm via the email link.
- **UI:** `/login` and `/register` pages and a logout button in the sidebar. Add `services/auth.ts` and an auth context or hook that exposes the current session. A protected-route wrapper redirects signed-out users to `/login`.

**Verify:** When signed out, visiting `/products` redirects to `/login`. Register → login → see products → logout → redirected to login. The session survives a page refresh.

## Phase 4 — Organizations and onboarding ✅

**Goal:** Every signed-in user belongs to exactly one shop.

- **DB:**
  - `organizations (id, name, created_at)`.
  - `memberships (user_id unique → auth.users, org_id, role 'owner'|'staff', email, created_at)`. *Built with `user_id` as the primary key (same effect as unique) and `on delete cascade`; `role` is the enum `org_role`.* `unique(user_id)` enforces one org per user. `email` is copied from the JWT so other members can show it, because the client cannot read `auth.users`.
  - Helper functions `current_org_id()` and `is_owner()` (`security definer`, `stable`) that read `memberships` for `auth.uid()`. All later RLS policies use these, so no policy queries `memberships` directly and policies don't recurse.
  - RPC `create_organization(name)` creates the org plus an owner membership in one transaction.
  - RLS: users can read their own org and the memberships in their org. Rows are only inserted via the RPC.
- **UI:** After login, a user with no membership is sent to `/onboarding` with a "Create your shop" form. The shop name appears in the sidebar.

**Verify:** A new user is forced through onboarding exactly once, and calling the RPC a second time fails. In the SQL editor, `memberships` has one owner row for that user.

## Phase 5 — Tenant-scoped products and movements (data reset) ✅

*Done. `schema.sql` was rewritten in its final, ordered, idempotent form (the whole file can be re-run). Same-shop rules use composite foreign keys (`(category_id, org_id)`, `(product_id, org_id)`). Image paths now start with `org_id` and storage policies limit each shop to its own folder (the Phase 10b follow-up). The opening-stock field was removed from the create form. `seed.sql` fills the oldest owner's shop (or one chosen by email).*

**Goal:** Products and movements belong to an organization, and shops can't see each other's data.

- **DB:**
  - Run a one-time reset (drop the old `products`, `stock_movements`, `movement_type`, `categories`) in the SQL editor. **Do not put the drop statements in `schema.sql`**, because re-running the file would wipe data.
  - Recreate the tables in `schema.sql` with `org_id not null default current_org_id()` and `unique (org_id, sku)` (SKU is unique per shop, not globally). Add the index `products (org_id, name)` for pagination (Phase 12 was done early). Recreate `categories` (Phase 10 was done early) with `org_id` and a unique index on `(org_id, lower(name))` instead of `lower(name)`.
  - Add `stock_movements.created_by default auth.uid()`.
  - Add the stock trigger to `schema.sql`: on insert into `stock_movements`, apply the signed quantity to `products.stock_quantity`. The existing `check (stock_quantity >= 0)` rejects overselling.
  - Column privileges: `authenticated` can't insert or update `products.stock_quantity`. Only the trigger (`security definer`) changes it. *(Update side already exists: `schema.sql` grants UPDATE only on `name, sku, price, category_id, image_path`. Every new editable product column must be added to that grant.)*
  - RLS: every policy is `org_id = current_org_id()`. Movements have select and insert policies only.
- **UI:** The product form no longer has a stock field when creating either (editing already hides it, done in Phase 10). Initial stock is recorded as an `in` movement from the stock panel. ~~Fix the edit form so it is pre-filled from `initial`~~ (done in Phase 10).

**Verify:** Create two users with two shops. Each sees only their own products and movements, and the same SKU can exist in both shops. A direct `update products set stock_quantity = …` from the client is rejected. A stock `out` larger than the stock on hand fails with a readable error.

## Phase 6 — Invite codes and members ✅

*Done. Codes are 8 characters without look-alikes (shown as `XXXX-XXXX`), generated from `gen_random_uuid()` bytes. `join_organization` locks the invite row (`for update`) and gives one error message for wrong, used and expired codes. Removing staff is a `memberships` delete policy (owner, same shop, `role = 'staff'`) instead of an RPC. A removed user is sent to onboarding on their next page load. Staff see the members list but not the owner controls (a plain role check; Phase 7 adds `useRole()` and RLS).*

**Goal:** Owners can bring staff into their shop.

- **DB:**
  - `org_invites (code, org_id, created_by, expires_at, used_by, used_at)`.
  - RPC `create_invite()` (owners only) returns a random code.
  - RPC `join_organization(code)` checks that the code is unused and unexpired, then creates a `staff` membership and marks the code used.
  - RPC or policy so owners can remove a staff membership. The owner can't remove themselves.
- **UI:** Onboarding gets a second option, "Join with invite code". A Settings → Members page lists members (email, role), shows a "Generate invite code" button, and lets the owner remove staff.

**Verify:** The owner generates a code, a second user joins with it, and that user sees the owner's products. A used or expired code is rejected. After removal, the staff user is sent back to onboarding.

## Phase 7 — Role enforcement (owner / staff)

**Goal:** Staff can work with stock but can't change the catalog or members.

- **DB:** Split the `products` and `categories` insert, update and delete policies to require `is_owner()`. The `stock_movements` insert policy stays open to all members. Invite and member functions check `is_owner()`.
- **UI:** A `useRole()` hook. Staff don't see Add, Edit, Delete or member-management controls; Settings → Members is hidden for staff.

**Verify:** As staff, the buttons are hidden, **and** calling the service functions directly (e.g. from the browser console) is rejected by RLS. As staff, recording a stock movement still works.

## Phase 8 — Cost price, low-stock level, and status pills

**Goal:** Each product has a stock status.

- **DB:** Add `products.cost_price numeric(12,2) not null default 0 check (>= 0)` and `low_stock_level integer not null default 10 check (>= 0)`. Add `status` as a generated stored column: `case when stock_quantity = 0 then 'out' when stock_quantity <= low_stock_level then 'low' else 'in' end`.
- **UI:** Product form fields for cost price and low-stock level. The products table shows a colored status pill (In stock / Low stock / Out of stock).

**Verify:** Moving stock across the threshold with movements changes the pill (e.g. level 10: stock 11 → `in`, 10 → `low`, 0 → `out`).

## Phase 9 — Dashboard summary

**Goal:** See the state of the shop at a glance.

- **DB:** Add a function `dashboard_summary()` (`security invoker`, so RLS still applies) that returns total stock value (`sum(cost_price * stock_quantity)`), total products, and counts of `in`/`low`/`out`.
- **UI:** `/dashboard` shows stat cards (stock value, product count) and one horizontal bar split into in/low/out segments, sized by count, with a legend.

**Verify:** The numbers match a manual `select` in the SQL editor for that org. A second shop's dashboard shows only its own numbers. A shop with no products shows zeros without errors.

## Phase 10 — Categories ✅ (done early, after Phase 12)

**Goal:** Group products.

*Done early without organizations: `categories` has no `org_id` yet and uses `dev:` "anyone" policies, with a unique index on `lower(name)`. Phase 5 and Phase 7 finish it (see there). The edit-form pre-fill fix from Phase 5 was also done here.*

- **DB:** `categories (id, org_id, name, created_at)`, `unique(org_id, name)`, with RLS (all members read, owners write). Add `products.category_id` referencing `categories`, `on delete set null`.
- **UI:** `/categories` page with list, add, rename and delete (owners). A category select in the product form, and a category column in the products table.

**Verify:** Deleting a category leaves its products uncategorized. Staff can view but not edit categories, including when calling the service directly.

## Phase 10b — Product image (added later) ✅

**Goal:** Each product can have one photo.

- **DB:** `products.image_path text` (nullable). A public Storage bucket `product-images` (2 MB limit, JPEG/PNG/WebP only) with policies on `storage.objects` for that bucket. Phase 5 changes the path to start with `org_id` and limits writes to the shop's own folder; Phase 7 limits writes to owners.
- **UI:** Image picker with preview in the product form (upload, replace, remove). Photos are resized in the browser (max 800×800, WebP/JPEG) before upload, and every upload gets a new random file name (`<product_id>/<uuid>.webp`) so the CDN never serves an old cached picture. Small thumbnail in the products table, with a placeholder icon when there's no image. Deleting a product also deletes its image file.

**Verify:** Upload, replace and remove work, and the old file is gone from Storage after replace/remove/delete. A 5 MB file or a PDF is rejected with a clear message. Products without images show the placeholder.

## Phase 11 — Suppliers

**Goal:** Know where each product comes from.

- **DB:** `suppliers (id, org_id, name, contact_name, email, phone, created_at)`, with RLS like categories. Add `products.supplier_id` referencing `suppliers`, `on delete set null`.
- **UI:** `/suppliers` page with CRUD (owners). A supplier select in the product form, and a supplier column in the products table.

**Verify:** Same checks as Phase 10, for suppliers.

## Phase 12 — Products pagination ✅ (done early, after Phase 2)

**Goal:** The products table handles hundreds of rows.

- **DB:** Index on `products (org_id, name)`. *Added in Phase 5.*
- **UI:** Server-side pagination: 10 rows per page using `.range()` and `count: 'exact'`. Show "Showing 11–20 of 22" with Previous/Next buttons. Keep the page number in the URL (`?page=2`); invalid or too-high pages redirect to a valid one.

**Verify:** Seed about 20+ products. Each page is correct, refresh keeps the page, and the Network tab shows only 10 rows fetched.

## Phase 13 — Products search

**Goal:** Find a product by name or SKU.

- **DB:** none (an index can come later if needed).
- **UI:** A search box with debounce (~300 ms) that filters with `ilike` on name or SKU. Escape `,` `(` `)` in the input before building the `.or()` filter. Store the search in the URL (`?q=`), and reset to page 1 when it changes.

**Verify:** Partial and case-insensitive matches work on both fields. Input like `a,b(` doesn't break the query.

## Phase 14 — Status and category filters (category half ✅ done early as 14a)

*Done early (14a): category filter on Products (`?category=<id>` or `?category=none`), combined with pagination, and links from each category on the Categories page, including an "Uncategorized" row. Still to do here: the status filter (needs Phase 8) and combining with search (Phase 13).*

**Goal:** Narrow the table down.

- **DB:** none (uses the `status` column from Phase 8).
- **UI:** A status filter (All / In / Low / Out) and a category filter (All / each category / Uncategorized). They combine with search and live in the URL.

**Verify:** Every combination of search, status and category returns the right rows, and the pagination total matches the filtered count.

## Phase 15 — CSV export

**Goal:** Download the products list.

- **DB:** none.
- **UI:** An "Export CSV" button exports **all rows matching the current filters**, not just the current page. Fetch in chunks of 1000 (Supabase's default row limit). Columns: name, SKU, category, supplier, cost price, price, stock, low-stock level, status. Quote values correctly so commas and quotes in names work.

**Verify:** With filters applied, the CSV row count equals the table total. The file opens correctly in Excel or Google Sheets, including a product named `Cola, "Large"`.

## Phase 16 — Stock history page

**Goal:** Audit every stock change in the shop.

- **DB:** Index on `stock_movements (org_id, created_at desc)`.
- **UI:** `/history` lists all movements, newest first: date, product, type, signed quantity, note, and who recorded it (email from `memberships`). Filter by product, type and date range. Paginated like Phase 12.

**Verify:** Every movement recorded in earlier phases appears with the right sign and user. Filters and pagination combine correctly. Staff can view the page.

## Later — NestJS backend

Plan this in detail when Phase 16 is done; split it into its own small phases then. The direction:

- A `backend/` NestJS app that verifies the Supabase JWT and talks to Postgres.
- Frontend `services/` functions switch from supabase-js to `fetch` against the API one module at a time. Because all Supabase calls already live in `services/`, components don't change.
- RLS stays on as a second line of defense.
