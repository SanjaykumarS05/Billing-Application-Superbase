create table if not exists public.billing_states (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.billing_states disable row level security;

grant select, insert, update, delete on public.billing_states to anon, authenticated;

notify pgrst, 'reload schema';
