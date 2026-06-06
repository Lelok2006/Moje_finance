-- ── Event and reminder model expansion ───────────────────────

alter table events
  drop constraint if exists events_type_check;

alter table events
  add constraint events_type_check
  check (type in (
    'doctor',
    'anniversary',
    'birthday',
    'medication',
    'payment_due',
    'obligation',
    'holiday',
    'school',
    'other'
  ));

alter table events
  add column if not exists description text,
  add column if not exists person_name text,
  add column if not exists reminder_enabled boolean default false,
  add column if not exists reminder_frequency text default 'none'
    check (reminder_frequency in ('none','daily','monthly','yearly','custom')),
  add column if not exists reminder_pattern text,
  add column if not exists source text default 'manual'
    check (source in ('manual','document','finance','medication'));

create index if not exists events_household_date_idx
  on events (household_id, date);

create index if not exists events_member_date_idx
  on events (member_id, date)
  where member_id is not null;
