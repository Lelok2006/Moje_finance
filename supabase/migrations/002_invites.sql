-- ── Povabila v gospodinjstvo ─────────────────────────────────
create table if not exists household_invites (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  token        text not null unique default encode(gen_random_bytes(24), 'base64url'),
  email        text,                          -- neobvezno: samo za določeno osebo
  used_by      uuid references auth.users(id) on delete set null,
  used_at      timestamptz,
  expires_at   timestamptz not null default now() + interval '7 days',
  created_at   timestamptz default now()
);

-- Javno branje po tokenu (invite stran je javna)
alter table household_invites enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'household_invites' and policyname = 'read_by_token') then
    create policy "read_by_token" on household_invites for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'household_invites' and policyname = 'admin_manage') then
    create policy "admin_manage" on household_invites for all using (household_id = get_household_id());
  end if;
end $$;
