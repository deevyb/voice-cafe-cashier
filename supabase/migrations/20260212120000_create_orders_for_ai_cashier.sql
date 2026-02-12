create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  items jsonb not null default '[]'::jsonb,
  status text not null default 'placed' check (status in ('placed', 'in_progress', 'completed', 'canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);

alter table public.orders enable row level security;

drop policy if exists "public_can_read_orders" on public.orders;
create policy "public_can_read_orders"
  on public.orders
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public_can_insert_orders" on public.orders;
create policy "public_can_insert_orders"
  on public.orders
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "public_can_update_orders" on public.orders;
create policy "public_can_update_orders"
  on public.orders
  for update
  to anon, authenticated
  using (true)
  with check (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end
$$;
