begin;

alter table public.cashbook_entries
  add column source_daily_log_id uuid references public.daily_logs (id) on delete cascade;

with candidates as (
  select cb.id as entry_id, dl.id as log_id,
    count(*) over (partition by dl.id, cb.category) as log_match_count,
    count(*) over (partition by cb.id) as entry_match_count
  from public.cashbook_entries cb
  join public.daily_logs dl
    on dl.farm_id = cb.farm_id
    and dl.recorded_on = cb.entry_date
    and dl.recorded_by = cb.recorded_by
  where cb.source_daily_log_id is null
    and (
      (cb.category = 'Sales' and cb.entry_type = 'income'
        and cb.description = 'Bird sale' and cb.amount = dl.sale_income and dl.sale_income > 0)
      or
      (cb.category = 'Other farm expense' and cb.entry_type = 'expense'
        and cb.description = coalesce(nullif(trim(dl.expense_note), ''), 'Daily farm expense')
        and cb.amount = dl.other_expense and dl.other_expense > 0)
    )
)
update public.cashbook_entries cb
set source_daily_log_id = candidates.log_id
from candidates
where cb.id = candidates.entry_id
  and candidates.log_match_count = 1
  and candidates.entry_match_count = 1;

create unique index cashbook_daily_log_category_uidx
  on public.cashbook_entries (source_daily_log_id, category)
  where source_daily_log_id is not null;

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
    insert into public.cashbook_entries (
      scope, farm_id, entry_type, category, description, amount, entry_date, recorded_by, source_daily_log_id
    ) values ('farm', p_farm_id, 'income', 'Sales', 'Bird sale', p_sale_income, p_recorded_on, auth.uid(), inserted_log_id);
  end if;

  if p_other_expense > 0 then
    entry_description := coalesce(nullif(trim(p_expense_note), ''), 'Daily farm expense');
    insert into public.cashbook_entries (
      scope, farm_id, entry_type, category, description, amount, entry_date, note, recorded_by, source_daily_log_id
    ) values (
      'farm', p_farm_id, 'expense', 'Other farm expense', entry_description,
      p_other_expense, p_recorded_on, nullif(trim(p_expense_note), ''), auth.uid(), inserted_log_id
    );
  end if;

  return inserted_log_id;
end;
$$;

create function public.update_daily_log(
  p_log_id uuid,
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
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_log public.daily_logs%rowtype;
  old_feed_delta numeric;
  new_feed_delta numeric;
  old_birds_removed integer;
  new_birds_removed integer;
  entry_description text;
begin
  select * into old_log
  from public.daily_logs
  where id = p_log_id
  for update;

  if not found then
    raise exception 'Daily log not found' using errcode = 'P0002';
  end if;
  if auth.uid() is null or not coalesce((select private.can_write_farm(old_log.farm_id)), false) then
    raise exception 'You do not have permission to edit this farm log' using errcode = '42501';
  end if;
  if p_deaths < 0 or p_birds_sent < 0 or p_sale_income < 0 or p_feed_received_kg < 0
    or p_feed_received_bags < 0 or p_feed_bag_weight_kg <= 0 or p_feed_used_kg < 0
    or p_other_expense < 0 or (p_average_weight_kg is not null and p_average_weight_kg <= 0)
    or (p_emergency_type_override and nullif(trim(p_emergency_reason), '') is null) then
    raise exception 'Daily log values are invalid' using errcode = '23514';
  end if;

  old_feed_delta := old_log.feed_received_kg + old_log.feed_received_bags * old_log.feed_bag_weight_kg - old_log.feed_used_kg;
  new_feed_delta := p_feed_received_kg + p_feed_received_bags * p_feed_bag_weight_kg - p_feed_used_kg;
  old_birds_removed := old_log.deaths + old_log.birds_sent;
  new_birds_removed := p_deaths + p_birds_sent;

  update public.farms
  set current_birds = current_birds + old_birds_removed - new_birds_removed,
      feed_stock_kg = feed_stock_kg + old_feed_delta - new_feed_delta,
      updated_at = now()
  where id = old_log.farm_id
    and current_birds + old_birds_removed - new_birds_removed between 0 and capacity
    and feed_stock_kg + old_feed_delta - new_feed_delta >= 0;
  if not found then
    raise exception 'The edited log would exceed the farm bird capacity or use unavailable feed' using errcode = '23514';
  end if;

  if old_log.batch_id is not null then
    update public.batches
    set current_birds = current_birds + old_birds_removed - new_birds_removed,
        status = case when current_birds + old_birds_removed - new_birds_removed = 0 then 'completed' else 'active' end,
        completed_on = case
          when current_birds + old_birds_removed - new_birds_removed = 0 then coalesce(completed_on, p_recorded_on)
          else null
        end
    where id = old_log.batch_id
      and farm_id = old_log.farm_id
      and current_birds + old_birds_removed - new_birds_removed between 0 and initial_birds;
    if not found then
      raise exception 'The edited log would put its batch outside the valid bird count' using errcode = '23514';
    end if;
    update public.farms
    set active_batch_code = (
      select batch_code from public.batches
      where id = old_log.batch_id and current_birds > 0
    )
    where id = old_log.farm_id
      and (select current_birds from public.batches where id = old_log.batch_id) = 0
      and active_batch_code = (select batch_code from public.batches where id = old_log.batch_id);
    update public.farms
    set active_batch_code = (select batch_code from public.batches where id = old_log.batch_id)
    where id = old_log.farm_id
      and active_batch_code is null
      and (select current_birds from public.batches where id = old_log.batch_id) > 0;
  end if;

  update public.daily_logs
  set recorded_on = p_recorded_on,
      deaths = p_deaths,
      birds_sent = p_birds_sent,
      sale_income = p_sale_income,
      feed_received_kg = p_feed_received_kg,
      feed_received_bags = p_feed_received_bags,
      feed_bag_weight_kg = p_feed_bag_weight_kg,
      feed_used_kg = p_feed_used_kg,
      average_weight_kg = p_average_weight_kg,
      disease_or_symptoms = nullif(trim(p_disease_or_symptoms), ''),
      medicine_given = nullif(trim(p_medicine_given), ''),
      other_expense = p_other_expense,
      expense_note = nullif(trim(p_expense_note), ''),
      notes = nullif(trim(p_notes), ''),
      custom_values = coalesce(p_custom_values, '{}'::jsonb),
      emergency_type_override = p_emergency_type_override,
      emergency_reason = nullif(trim(p_emergency_reason), '')
  where id = p_log_id;

  if p_sale_income > 0 then
    insert into public.cashbook_entries (
      scope, farm_id, entry_type, category, description, amount, entry_date, recorded_by, source_daily_log_id
    ) values ('farm', old_log.farm_id, 'income', 'Sales', 'Bird sale', p_sale_income, p_recorded_on, auth.uid(), p_log_id)
    on conflict (source_daily_log_id, category) where source_daily_log_id is not null
    do update set amount = excluded.amount, entry_date = excluded.entry_date;
    update public.cashbook_entries
    set entry_type = 'income', description = 'Bird sale'
    where source_daily_log_id = p_log_id and category = 'Sales';
  else
    delete from public.cashbook_entries where source_daily_log_id = p_log_id and category = 'Sales';
  end if;

  if p_other_expense > 0 then
    entry_description := coalesce(nullif(trim(p_expense_note), ''), 'Daily farm expense');
    insert into public.cashbook_entries (
      scope, farm_id, entry_type, category, description, amount, entry_date, note, recorded_by, source_daily_log_id
    ) values (
      'farm', old_log.farm_id, 'expense', 'Other farm expense', entry_description,
      p_other_expense, p_recorded_on, nullif(trim(p_expense_note), ''), auth.uid(), p_log_id
    )
    on conflict (source_daily_log_id, category) where source_daily_log_id is not null
    do update set amount = excluded.amount, entry_date = excluded.entry_date,
      description = excluded.description, note = excluded.note;
  else
    delete from public.cashbook_entries where source_daily_log_id = p_log_id and category = 'Other farm expense';
  end if;
end;
$$;

create function public.delete_daily_log(p_log_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_log public.daily_logs%rowtype;
  feed_delta numeric;
  birds_removed integer;
begin
  select * into old_log
  from public.daily_logs
  where id = p_log_id
  for update;

  if not found then
    raise exception 'Daily log not found' using errcode = 'P0002';
  end if;
  if auth.uid() is null or not coalesce((select private.can_write_farm(old_log.farm_id)), false) then
    raise exception 'You do not have permission to delete this farm log' using errcode = '42501';
  end if;

  feed_delta := old_log.feed_received_kg + old_log.feed_received_bags * old_log.feed_bag_weight_kg - old_log.feed_used_kg;
  birds_removed := old_log.deaths + old_log.birds_sent;

  update public.farms
  set current_birds = current_birds + birds_removed,
      feed_stock_kg = feed_stock_kg - feed_delta,
      updated_at = now()
  where id = old_log.farm_id
    and current_birds + birds_removed <= capacity
    and feed_stock_kg - feed_delta >= 0;
  if not found then
    raise exception 'This log cannot be deleted because restoring its flock or feed would exceed current farm limits' using errcode = '23514';
  end if;

  if old_log.batch_id is not null and birds_removed > 0 then
    update public.batches
    set current_birds = current_birds + birds_removed,
        status = 'active',
        completed_on = null
    where id = old_log.batch_id
      and farm_id = old_log.farm_id
      and current_birds + birds_removed <= initial_birds;
    if not found then
      raise exception 'This log cannot be deleted because restoring its birds would exceed the batch population' using errcode = '23514';
    end if;
    update public.farms
    set active_batch_code = (select batch_code from public.batches where id = old_log.batch_id)
    where id = old_log.farm_id
      and active_batch_code is null;
  end if;

  delete from public.daily_logs where id = p_log_id;
end;
$$;

revoke all on function public.update_daily_log(uuid, date, integer, integer, numeric, numeric, numeric, numeric, numeric, numeric, text, text, numeric, text, text, jsonb, boolean, text) from public, anon;
revoke all on function public.delete_daily_log(uuid) from public, anon;
grant execute on function public.update_daily_log(uuid, date, integer, integer, numeric, numeric, numeric, numeric, numeric, numeric, text, text, numeric, text, text, jsonb, boolean, text) to authenticated;
grant execute on function public.delete_daily_log(uuid) to authenticated;

commit;
