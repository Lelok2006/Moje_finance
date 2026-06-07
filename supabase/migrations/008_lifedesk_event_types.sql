-- ── LifeDesk event types for home administration ─────────────

alter table events
  drop constraint if exists events_type_check;

update events
set type = 'vacation'
where type = 'holiday';

alter table events
  add constraint events_type_check
  check (type in (
    'doctor',
    'anniversary',
    'birthday',
    'medication',
    'payment_due',
    'obligation',
    'vacation',
    'sick_leave',
    'school_holiday',
    'public_holiday',
    'school',
    'other'
  ));
