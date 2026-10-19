begin;

create or replace function private.sync_batch_population_after_daily_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  birds_removed integer := new.deaths + new.birds_sent;
  found_batch_code text;
begin
  if new.batch_id is null or birds_removed = 0 then
    return new;
  end if;

  update public.batches
  set current_birds = current_birds - birds_removed,
      status = case when current_birds = birds_removed then 'completed' else status end,
      completed_on = case when current_birds = birds_removed then new.recorded_on else completed_on end
  where id = new.batch_id
    and farm_id = new.farm_id
    and status = 'active'
    and current_birds >= birds_removed
  returning batch_code into found_batch_code;

  if not found then
    raise exception 'The selected batch no longer has enough birds; refresh and try again' using errcode = '23514';
  end if;

  if (select current_birds from public.batches where id = new.batch_id) = 0 then
    update public.farms
    set active_batch_code = null,
        updated_at = now()
    where id = new.farm_id and active_batch_code = found_batch_code;
  end if;

  return new;
end;
$$;

revoke all on function private.sync_batch_population_after_daily_log() from public, anon, authenticated;

create trigger daily_logs_sync_batch_population
after insert on public.daily_logs
for each row execute function private.sync_batch_population_after_daily_log();

revoke insert, update, delete on table public.daily_logs from authenticated;

commit;