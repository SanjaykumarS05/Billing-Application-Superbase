# GST Billing Web Application

React + Vite billing application with Supabase browser storage.

## Commands

```bash
npm start
npm run build
npm run preview
```

Copy `.env.example` to `.env` and fill `VITE_SUPABASE_URL` plus `VITE_SUPABASE_ANON_KEY` to store data in Supabase.

## Vercel Deployment

The repo includes `vercel.json`, so Vercel can deploy with these settings automatically:

```text
Install Command: npm ci
Build Command: npm run build
Output Directory: web-dist
Framework Preset: Vite
Node.js: 20.19 or newer
```

Add these environment variables in Vercel Project Settings:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SUPABASE_TABLE_NAME=billing_states
```

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
