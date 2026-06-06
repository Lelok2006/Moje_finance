-- ── Atomic setup for first household ─────────────────────────
-- Creates a household, links the authenticated user to it, and creates the
-- first admin member. Called from /setup via rpc("setup_household", ...).

insert into categories (code, name, type, parent_code, icon)
values ('3410', 'Naročnine', 'variable', '3400', 'tv')
on conflict (code) do update set
  name = excluded.name,
  type = excluded.type,
  parent_code = excluded.parent_code,
  icon = excluded.icon;

create or replace function setup_household(
  p_household_name text,
  p_member_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_household_id uuid;
  v_initials text;
begin
  if v_user_id is null then
    raise exception 'Ni prijavljenega uporabnika.';
  end if;

  if length(trim(coalesce(p_household_name, ''))) < 2 then
    raise exception 'Ime gospodinjstva je prekratko.';
  end if;

  if length(trim(coalesce(p_member_name, ''))) < 2 then
    raise exception 'Ime člana je prekratko.';
  end if;

  if exists (select 1 from user_profiles where id = v_user_id) then
    raise exception 'Uporabnik že ima nastavljeno gospodinjstvo.';
  end if;

  insert into households (name, currency, country, tax_scale)
  values (trim(p_household_name), 'EUR', 'Slovenija', 'SLO 2026')
  returning id into v_household_id;

  insert into user_profiles (id, household_id)
  values (v_user_id, v_household_id);

  select upper(left(string_agg(left(part, 1), ''), 2))
  into v_initials
  from regexp_split_to_table(trim(p_member_name), '\s+') as part;

  insert into members (
    household_id,
    name,
    initials,
    type,
    color,
    is_admin
  )
  values (
    v_household_id,
    trim(p_member_name),
    coalesce(nullif(v_initials, ''), 'UP'),
    'adult',
    'bg-brand-50 text-brand-600',
    true
  );

  insert into notification_settings (household_id)
  values (v_household_id)
  on conflict (household_id) do nothing;

  return v_household_id;
end;
$$;

grant execute on function setup_household(text, text) to authenticated;
