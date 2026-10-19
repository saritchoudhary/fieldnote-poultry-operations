begin;

drop policy if exists "Farm managers record attendance" on public.attendance;
create policy "Farm managers record attendance"
on public.attendance for insert to authenticated
with check (
  (select private.can_write_farm(farm_id))
  and recorded_by = (select auth.uid())
  and exists (
    select 1
    from public.farm_memberships as fm
    where fm.farm_id = attendance.farm_id
      and fm.user_id = attendance.worker_id
  )
);

drop policy if exists "Farm managers update attendance" on public.attendance;
create policy "Farm managers update attendance"
on public.attendance for update to authenticated
using ((select private.can_write_farm(farm_id)))
with check (
  (select private.can_write_farm(farm_id))
  and exists (
    select 1
    from public.farm_memberships as fm
    where fm.farm_id = attendance.farm_id
      and fm.user_id = attendance.worker_id
  )
);

commit;