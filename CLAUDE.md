# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Inventory management SaaS: React + TypeScript (Vite) in `frontend/`, Supabase Postgres as the backend (browser uses the anon key directly, no custom server).

## Commands

Run from `frontend/`:

```bash
npm run dev     # Vite dev server
npm run build   # tsc -b type-check + vite build (unused locals/params fail the build)
npm run lint    # oxlint
```

No test framework yet. Supabase credentials go in `frontend/.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Rules

- **Supabase calls only in `frontend/src/services/`.** Components and pages never import `supabase` from `src/lib/supabase.ts`; they call service functions, which throw `Error`s with user-facing messages.
- **`products.stock_quantity` is never written directly.** Stock changes only by inserting into `stock_movements` (`in`/`out` positive, `adjustment` signed); the database applies them to `stock_quantity`. Don't add `stock_quantity` to product insert/update payloads.
- **All SQL goes in `frontend/supabase/schema.sql`.** It must be idempotent so the whole file can be re-run safely in the Supabase SQL editor: `create table if not exists`, `create or replace function`, `drop trigger if exists` / `drop policy if exists` before `create`, enums in a `do $$ ... exception when duplicate_object` block. Every table gets `enable row level security` plus explicit policies. Use `--` comments (not `//`). Practice/sample data goes in `frontend/supabase/seed.sql`, never in `schema.sql`.

Row types in `frontend/src/types.ts` are hand-written; keep them in sync with `schema.sql`.

Work follows `docs/ROADMAP.md`, one phase at a time; its "Decisions" table records agreed design choices.
