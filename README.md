# GST Billing Web Application

React + Vite billing application with Supabase browser storage.

## Commands

```bash
npm start
npm run build
npm run preview
```

Copy `.env.example` to `.env` and fill `VITE_SUPABASE_URL` plus `VITE_SUPABASE_ANON_KEY` to store data in Supabase. With `VITE_ALLOW_LOCAL_STORAGE_FALLBACK=true`, the app can still run locally without Supabase credentials.

## Supabase Table

Run this SQL in the Supabase SQL editor:

```sql
create table if not exists public.billing_states (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.billing_states disable row level security;

grant select, insert, update, delete on public.billing_states to anon, authenticated;

notify pgrst, 'reload schema';
```

The app stores users, customers, products, invoices, product sales data, counters, and settings inside this Supabase table as JSON state. When the remote row is empty, the app copies any browser local data into Supabase on first login.
