-- ── Payment state for invoices and financial calendar items ──

alter table documents
  add column if not exists payment_status text not null default 'unknown'
    check (payment_status in ('unknown','pending','paid','canceled')),
  add column if not exists due_date date,
  add column if not exists paid_at date;

create index if not exists documents_household_due_date_idx
  on documents (household_id, due_date)
  where due_date is not null;

create index if not exists documents_household_payment_status_idx
  on documents (household_id, payment_status);
