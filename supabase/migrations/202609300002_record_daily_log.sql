begin;

alter table public.profiles
  add column must_change_password boolean not null default false;

drop policy if exists "Users can read their farm assignments" on public.farm_memberships;
create policy "Users can read their farm assignments"
on public.farm_memberships for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.current_app_role()) in ('admin', 'boss')
  or ((select private.current_app_role()) = 'leader' and (select private.has_farm_access(farm_id)))
);

create or replace function public.record_daily_log(
  p_farm_id uuid,
  p_batch_id uuid,
  p_recorded_on date,
  p_deaths integer,
  p_birds_sent integer,
  p_sale_income numeric,
  p_feed_received_kg numeric,
  p_feed_received_bags numeric,
  p_feed_bag_weight_kg numeric,
  p_feed_used_kg numeric,
  p_average_weight_kg numeric,
  p_disease_or_symptoms text,
  p_medicine_given text,
  p_other_expense numeric,
  p_expense_note text,
  p_notes text,
  p_custom_values jsonb,
  p_emergency_type_override boolean,
  p_emergency_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_log_id uuid;
  feed_delta numeric;
  entry_description text;
begin
  if auth.uid() is null or not coalesce((select private.can_write_farm(p_farm_id)), false) then
    raise exception 'You do not have permission to record this farm log' using errcode = '42501';
  end if;

  if p_batch_id is not null and not exists (
    select 1 from public.batches b where b.id = p_batch_id and b.farm_id = p_farm_id
  ) then
    raise exception 'The selected batch does not belong to this farm' using errcode = '23514';
  end if;

  feed_delta := p_feed_received_kg + p_feed_received_bags * p_feed_bag_weight_kg - p_feed_used_kg;

  update public.farms
  set current_birds = current_birds - p_deaths - p_birds_sent,
      feed_stock_kg = feed_stock_kg + feed_delta,
      updated_at = now()
  where id = p_farm_id
    and current_birds >= p_deaths + p_birds_sent
    and feed_stock_kg + feed_delta >= 0;

  if not found then
    raise exception 'Bird count or available feed changed; refresh the farm and try again' using errcode = '23514';
  end if;

  insert into public.daily_logs (
    farm_id, batch_id, recorded_on, deaths, birds_sent, sale_income,
    feed_received_kg, feed_received_bags, feed_bag_weight_kg, feed_used_kg,
    average_weight_kg, disease_or_symptoms, medicine_given, other_expense,
    expense_note, notes, custom_values, emergency_type_override,
    emergency_reason, recorded_by
  ) values (
    p_farm_id, p_batch_id, p_recorded_on, p_deaths, p_birds_sent, p_sale_income,
    p_feed_received_kg, p_feed_received_bags, p_feed_bag_weight_kg, p_feed_used_kg,
    p_average_weight_kg, nullif(trim(p_disease_or_symptoms), ''), nullif(trim(p_medicine_given), ''), p_other_expense,
    nullif(trim(p_expense_note), ''), nullif(trim(p_notes), ''), coalesce(p_custom_values, '{}'::jsonb), p_emergency_type_override,
    nullif(trim(p_emergency_reason), ''), auth.uid()
  ) returning id into inserted_log_id;

  if p_sale_income > 0 then
    insert into public.cashbook_entries (scope, farm_id, entry_type, category, description, amount, entry_date, recorded_by)
    values ('farm', p_farm_id, 'income', 'Sales', 'Bird sale', p_sale_income, p_recorded_on, auth.uid());
  end if;

  if p_other_expense > 0 then
    entry_description := coalesce(nullif(trim(p_expense_note), ''), 'Daily farm expense');
    insert into public.cashbook_entries (scope, farm_id, entry_type, category, description, amount, entry_date, note, recorded_by)
    values ('farm', p_farm_id, 'expense', 'Other farm expense', entry_description, p_other_expense, p_recorded_on, nullif(trim(p_expense_note), ''), auth.uid());
  end if;

  return inserted_log_id;
end;
$$;

revoke all on function public.record_daily_log(uuid, uuid, date, integer, integer, numeric, numeric, numeric, numeric, numeric, numeric, text, text, numeric, text, text, jsonb, boolean, text) from public, anon;
grant execute on function public.record_daily_log(uuid, uuid, date, integer, integer, numeric, numeric, numeric, numeric, numeric, numeric, text, text, numeric, text, text, jsonb, boolean, text) to authenticated;

create or replace function public.complete_password_change()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  update public.profiles
  set must_change_password = false
  where id = auth.uid();

  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.complete_password_change() from public, anon;
grant execute on function public.complete_password_change() to authenticated;

commit;