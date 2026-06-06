-- ── Test reset for the current household ─────────────────────
-- Deletes only data owned by the authenticated user's household.

create or replace function reset_household_test_data(
  p_reset_members boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid := get_household_id();
begin
  if v_household_id is null then
    raise exception 'Gospodinjstvo ni najdeno.';
  end if;

  delete from events
  where household_id = v_household_id;

  delete from transactions
  where household_id = v_household_id;

  update documents
  set linked_transaction_id = null
  where household_id = v_household_id;

  delete from documents
  where household_id = v_household_id;

  delete from budget_items
  where household_id = v_household_id;

  if p_reset_members then
    delete from members
    where household_id = v_household_id
      and coalesce(is_admin, false) = false;
  end if;
end;
$$;

grant execute on function reset_household_test_data(boolean) to authenticated;
