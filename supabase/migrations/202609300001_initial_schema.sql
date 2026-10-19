begin;

create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  login_id text not null unique check (length(trim(login_id)) between 3 and 64),
  display_name text not null,
  role text not null check (role in ('admin', 'boss', 'leader', 'team')),
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected', 'disabled')),
  created_at timestamptz not null default now()
);

create table public.farms (
  id uuid primary key default gen_random_uuid(),
  farm_code text not null unique,
  name text not null,
  chicken_type text not null,
  capacity integer not null check (capacity > 0),
  current_birds integer not null default 0 check (current_birds >= 0 and current_birds <= capacity),
  feed_stock_kg numeric(12, 2) not null default 0 check (feed_stock_kg >= 0),
  active_batch_code text,
  health_status text not null default 'good' check (health_status in ('good', 'watch', 'alert')),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.farm_memberships (
  farm_id uuid not null references public.farms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  assigned_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  primary key (farm_id, user_id)
);

create table public.batches (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete restrict,
  batch_code text not null,
  chicken_type text not null,
  status text not null default 'active' check (status in ('active', 'completed')),
  placed_on date not null,
  initial_birds integer not null check (initial_birds > 0),
  current_birds integer not null check (current_birds >= 0),
  emergency_type_override boolean not null default false,
  emergency_reason text,
  completed_on date,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (farm_id, batch_code),
  check (current_birds <= initial_birds),
  check (not emergency_type_override or nullif(trim(emergency_reason), '') is not null)
);

create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete restrict,
  batch_id uuid references public.batches (id) on delete set null,
  recorded_on date not null default current_date,
  deaths integer not null default 0 check (deaths >= 0),
  birds_sent integer not null default 0 check (birds_sent >= 0),
  sale_income numeric(14, 2) not null default 0 check (sale_income >= 0),
  feed_received_kg numeric(12, 2) not null default 0 check (feed_received_kg >= 0),
  feed_received_bags numeric(10, 2) not null default 0 check (feed_received_bags >= 0),
  feed_bag_weight_kg numeric(8, 2) not null default 50 check (feed_bag_weight_kg > 0),
  feed_used_kg numeric(12, 2) not null default 0 check (feed_used_kg >= 0),
  average_weight_kg numeric(8, 3) check (average_weight_kg is null or average_weight_kg > 0),
  disease_or_symptoms text,
  medicine_given text,
  other_expense numeric(14, 2) not null default 0 check (other_expense >= 0),
  expense_note text,
  notes text,
  custom_values jsonb not null default '{}'::jsonb check (jsonb_typeof(custom_values) = 'object'),
  emergency_type_override boolean not null default false,
  emergency_reason text,
  recorded_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  check (not emergency_type_override or nullif(trim(emergency_reason), '') is not null)
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete restrict,
  worker_id uuid not null references public.profiles (id) on delete restrict,
  work_date date not null default current_date,
  status text not null check (status in ('present', 'absent', 'leave')),
  wage_rate numeric(12, 2) not null default 0 check (wage_rate >= 0),
  amount_paid numeric(12, 2) not null default 0 check (amount_paid >= 0),
  note text,
  recorded_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (farm_id, worker_id, work_date)
);

create table public.cashbook_entries (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('farm', 'home')),
  farm_id uuid references public.farms (id) on delete restrict,
  person_id uuid references public.profiles (id) on delete set null,
  entry_type text not null check (entry_type in ('income', 'expense')),
  category text not null,
  description text not null,
  amount numeric(14, 2) not null check (amount > 0),
  entry_date date not null default current_date,
  note text,
  recorded_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  check ((scope = 'home' and farm_id is null) or (scope = 'farm' and farm_id is not null))
);

create index farm_memberships_user_id_idx on public.farm_memberships (user_id);
create index batches_farm_status_idx on public.batches (farm_id, status);
create index daily_logs_farm_date_idx on public.daily_logs (farm_id, recorded_on desc);
create index daily_logs_batch_date_idx on public.daily_logs (batch_id, recorded_on desc);
create index attendance_worker_date_idx on public.attendance (worker_id, work_date desc);
create index attendance_farm_date_idx on public.attendance (farm_id, work_date desc);
create index cashbook_date_idx on public.cashbook_entries (entry_date desc);
create index cashbook_farm_date_idx on public.cashbook_entries (farm_id, entry_date desc) where farm_id is not null;

create function private.current_app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles as p
  where p.id = (select auth.uid())
    and p.approval_status = 'approved'
$$;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select private.current_app_role()) = 'admin', false)
$$;

create function private.has_farm_access(target_farm_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select private.current_app_role()) in ('admin', 'boss')
    or exists (
      select 1
      from public.farm_memberships as fm
      where fm.farm_id = target_farm_id
        and fm.user_id = (select auth.uid())
    ),
    false
  )
$$;

create function private.can_write_farm(target_farm_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select private.current_app_role()) in ('admin', 'boss')
    or (
      (select private.current_app_role()) = 'leader'
      and exists (
        select 1
        from public.farm_memberships as fm
        where fm.farm_id = target_farm_id
          and fm.user_id = (select auth.uid())
      )
    ),
    false
  )
$$;

create function private.can_use_cashbook()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select private.current_app_role()) in ('admin', 'boss', 'leader'), false)
$$;

create function private.can_view_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    target_user_id = (select auth.uid())
    or (select private.current_app_role()) in ('admin', 'boss')
    or (
      (select private.current_app_role()) = 'leader'
      and exists (
        select 1
        from public.farm_memberships as own_membership
        join public.farm_memberships as team_membership
          on team_membership.farm_id = own_membership.farm_id
        where own_membership.user_id = (select auth.uid())
          and team_membership.user_id = target_user_id
      )
    ),
    false
  )
$$;

revoke execute on all functions in schema private from public;
grant execute on function private.current_app_role() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.has_farm_access(uuid) to authenticated;
grant execute on function private.can_write_farm(uuid) to authenticated;
grant execute on function private.can_use_cashbook() to authenticated;
grant execute on function private.can_view_profile(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.farms enable row level security;
alter table public.farm_memberships enable row level security;
alter table public.batches enable row level security;
alter table public.daily_logs enable row level security;
alter table public.attendance enable row level security;
alter table public.cashbook_entries enable row level security;

revoke all on table public.profiles, public.farms, public.farm_memberships, public.batches,
  public.daily_logs, public.attendance, public.cashbook_entries from anon, authenticated;
grant select, insert, update, delete on table public.profiles, public.farms, public.farm_memberships,
  public.batches, public.daily_logs, public.attendance, public.cashbook_entries to authenticated;

create policy "Users can read their own profile"
on public.profiles for select to authenticated
using ((select private.can_view_profile(id)));

create policy "Admins can create profiles"
on public.profiles for insert to authenticated
with check ((select private.is_admin()));

create policy "Admins can update profiles"
on public.profiles for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Admins can delete profiles"
on public.profiles for delete to authenticated
using ((select private.is_admin()));

create policy "Approved users can read permitted farms"
on public.farms for select to authenticated
using ((select private.has_farm_access(id)));

create policy "Admins manage farm setup"
on public.farms for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Users can read their farm assignments"
on public.farm_memberships for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()) or (select private.current_app_role()) = 'boss');

create policy "Admins and bosses manage farm assignments"
on public.farm_memberships for all to authenticated
using ((select private.current_app_role()) in ('admin', 'boss'))
with check ((select private.current_app_role()) in ('admin', 'boss'));

create policy "Farm members read batches"
on public.batches for select to authenticated
using ((select private.has_farm_access(farm_id)));

create policy "Farm managers write batches"
on public.batches for insert to authenticated
with check ((select private.can_write_farm(farm_id)) and created_by = (select auth.uid()));

create policy "Farm managers update batches"
on public.batches for update to authenticated
using ((select private.can_write_farm(farm_id)))
with check ((select private.can_write_farm(farm_id)));

create policy "Farm managers delete batches"
on public.batches for delete to authenticated
using ((select private.can_write_farm(farm_id)));

create policy "Farm members read daily logs"
on public.daily_logs for select to authenticated
using ((select private.has_farm_access(farm_id)));

create policy "Farm managers create daily logs"
on public.daily_logs for insert to authenticated
with check ((select private.can_write_farm(farm_id)) and recorded_by = (select auth.uid()));

create policy "Farm managers update daily logs"
on public.daily_logs for update to authenticated
using ((select private.can_write_farm(farm_id)))
with check ((select private.can_write_farm(farm_id)));

create policy "Farm managers delete daily logs"
on public.daily_logs for delete to authenticated
using ((select private.can_write_farm(farm_id)));

create policy "People can read permitted attendance"
on public.attendance for select to authenticated
using (
  worker_id = (select auth.uid())
  or (select private.can_write_farm(farm_id))
);

create policy "Farm managers record attendance"
on public.attendance for insert to authenticated
with check ((select private.can_write_farm(farm_id)) and recorded_by = (select auth.uid()));

create policy "Farm managers update attendance"
on public.attendance for update to authenticated
using ((select private.can_write_farm(farm_id)))
with check ((select private.can_write_farm(farm_id)));

create policy "Farm managers delete attendance"
on public.attendance for delete to authenticated
using ((select private.can_write_farm(farm_id)));

create policy "Admin boss and leaders read cashbook"
on public.cashbook_entries for select to authenticated
using ((select private.can_use_cashbook()));

create policy "Admin boss and leaders add cashbook entries"
on public.cashbook_entries for insert to authenticated
with check ((select private.can_use_cashbook()) and recorded_by = (select auth.uid()));

create policy "Admin boss and leaders update cashbook entries"
on public.cashbook_entries for update to authenticated
using ((select private.can_use_cashbook()))
with check ((select private.can_use_cashbook()));

create policy "Admin boss and leaders delete cashbook entries"
on public.cashbook_entries for delete to authenticated
using ((select private.can_use_cashbook()));

commit;
