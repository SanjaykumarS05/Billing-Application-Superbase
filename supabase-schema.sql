create table if not exists public.billing_states (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.billing_states
  add column if not exists id text,
  add column if not exists data jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

alter table public.billing_states
  drop constraint if exists billing_states_pkey;

alter table public.billing_states
  add constraint billing_states_pkey primary key (id);

alter table public.billing_states enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'billing_states'
      and policyname = 'billing_states_select'
  ) then
    create policy billing_states_select
      on public.billing_states
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'billing_states'
      and policyname = 'billing_states_insert'
  ) then
    create policy billing_states_insert
      on public.billing_states
      for insert
      to anon, authenticated
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'billing_states'
      and policyname = 'billing_states_update'
  ) then
    create policy billing_states_update
      on public.billing_states
      for update
      to anon, authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'billing_states'
      and policyname = 'billing_states_delete'
  ) then
    create policy billing_states_delete
      on public.billing_states
      for delete
      to anon, authenticated
      using (true);
  end if;
end $$;

grant select, insert, update, delete on public.billing_states to anon, authenticated;

insert into public.billing_states (id, data, updated_at)
values (
  'default',
  '{
    "users": [
      {
        "id": 1,
        "username": "admin",
        "passwordHash": "4b0db5d01053316ec853bb505381e60edc3676183a2d61f0483e525ac630a9d5",
        "fullName": "Administrator",
        "email": "admin@example.com",
        "role": "admin",
        "active": true,
        "createdAt": ""
      }
    ],
    "customers": [],
    "products": [],
    "bills": [],
    "settings": {
      "profileName": "",
      "profileEmail": "company@example.com",
      "profileGstin": "",
      "profilePhone": "",
      "profileState": "",
      "profileStateCode": "",
      "profileAddress": "",
      "profileBankName": "",
      "profileAccountNo": "",
      "profileBranchName": "",
      "profileIfsc": "",
      "profileDeclaration": "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.",
      "profileSignatory": "Authorised Signatory",
      "defaultTaxRate": 12,
      "invoicePrefix": "GST",
      "invoiceStartValue": 1,
      "compositionValidDays": 30,
      "backupLastAt": ""
    },
    "counters": {
      "users": 1,
      "customers": 0,
      "products": 0,
      "bills": 0
    }
  }'::jsonb,
  now()
)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
