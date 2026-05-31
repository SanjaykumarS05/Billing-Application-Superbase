create table if not exists public.billing_states (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.billing_states disable row level security;
<<<<<<< HEAD

grant select, insert, update, delete on public.billing_states to anon, authenticated;

notify pgrst, 'reload schema';
=======
>>>>>>> 482d668a932406907c4d329f0e3c8e89a5380a3f
