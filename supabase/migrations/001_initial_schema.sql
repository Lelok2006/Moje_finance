-- ============================================================
-- Moje finance — začetna shema
-- Zaženi v Supabase: SQL Editor → New query → Run
-- ============================================================

-- ── Razširitve ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Gospodinjstvo ─────────────────────────────────────────────
create table households (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  currency     text not null default 'EUR',
  country      text not null default 'Slovenija',
  tax_scale    text not null default 'SLO 2026',
  created_at   timestamptz default now()
);

-- ── Profil uporabnika (auth.users ↔ household) ───────────────
create table user_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  created_at   timestamptz default now()
);

-- ── Člani gospodinjstva ───────────────────────────────────────
create table members (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name         text not null,
  initials     text not null,
  type         text not null check (type in ('adult','child','pet')),
  birth_date   date,
  color        text,
  is_admin     boolean default false,
  created_at   timestamptz default now()
);

-- ── Šifranti kategorij (skupni za vse) ───────────────────────
create table categories (
  code         text primary key,
  name         text not null,
  type         text not null check (type in ('income','fixed','variable','savings')),
  parent_code  text references categories(code),
  icon         text
);

-- ── Transakcije ───────────────────────────────────────────────
create table transactions (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references households(id) on delete cascade,
  date           date not null,
  description    text not null,
  amount         numeric(10,2) not null check (amount > 0),
  type           text not null check (type in ('income','expense')),
  category_code  text references categories(code),
  member_id      uuid references members(id) on delete set null,
  document_id    uuid, -- FK dodan spodaj (circular dep)
  notes          text,
  created_at     timestamptz default now()
);

-- ── Proračunske postavke ──────────────────────────────────────
create table budget_items (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references households(id) on delete cascade,
  category_code  text not null references categories(code),
  monthly_limit  numeric(10,2) not null check (monthly_limit > 0),
  unique (household_id, category_code)
);

-- ── Dokumenti ────────────────────────────────────────────────
create table documents (
  id                       uuid primary key default gen_random_uuid(),
  household_id             uuid not null references households(id) on delete cascade,
  name                     text not null,
  uploaded_at              timestamptz default now(),
  document_date            date,
  type                     text not null check (type in ('invoice','contract','policy','payslip','tax','other')),
  status                   text not null default 'pending_ocr'
                             check (status in ('pending_ocr','pending_confirm','booked','archived')),
  file_path                text,           -- Supabase Storage pot
  ocr_amount               numeric(10,2),
  ocr_suggested_category   text references categories(code),
  ocr_raw_text             text,           -- surovi izpis Claude OCR agenta
  linked_transaction_id    uuid references transactions(id) on delete set null,
  expiry_date              date
);

-- Dokončaj krožni FK transactions → documents
alter table transactions
  add constraint fk_transaction_document
  foreign key (document_id) references documents(id) on delete set null;

-- ── Dogodki / opomniki ────────────────────────────────────────
create table events (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  title        text not null,
  date         date not null,
  type         text not null check (type in ('birthday','holiday','deadline','school','other')),
  member_id    uuid references members(id) on delete set null,
  notes        text,
  created_at   timestamptz default now()
);

-- ── Nastavitve obvestil ───────────────────────────────────────
create table notification_settings (
  household_id      uuid primary key references households(id) on delete cascade,
  budget_alert      boolean default true,
  birthday_alert    boolean default true,
  deadline_alert    boolean default true,
  overdue_alert     boolean default true,
  monthly_report    boolean default false
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table households           enable row level security;
alter table user_profiles        enable row level security;
alter table members              enable row level security;
alter table transactions         enable row level security;
alter table budget_items         enable row level security;
alter table documents            enable row level security;
alter table events               enable row level security;
alter table notification_settings enable row level security;
-- categories so skupne (brez RLS)

-- Helper funkcija: vrne household_id prijavljenega uporabnika
create or replace function get_household_id()
returns uuid
language sql security definer stable
as $$
  select household_id from user_profiles where id = auth.uid() limit 1;
$$;

-- Politike — vsak modul dostopa samo do svojega gospodinjstva
create policy "own_household" on households
  for all using (id = get_household_id());

create policy "own_profile" on user_profiles
  for all using (id = auth.uid());

create policy "own_members" on members
  for all using (household_id = get_household_id());

create policy "own_transactions" on transactions
  for all using (household_id = get_household_id());

create policy "own_budget" on budget_items
  for all using (household_id = get_household_id());

create policy "own_documents" on documents
  for all using (household_id = get_household_id());

create policy "own_events" on events
  for all using (household_id = get_household_id());

create policy "own_notifications" on notification_settings
  for all using (household_id = get_household_id());

-- ============================================================
-- Seed: kategorije (skupne za vse uporabnike)
-- ============================================================

insert into categories (code, name, type, parent_code, icon) values
-- Prihodki
('1000','Prihodki','income',null,null),
('1010','Redna plača','income','1000','briefcase'),
('1020','Božičnica / regres','income','1000','gift'),
('1030','Honorar / pogodbeno','income','1000','file-text'),
('1040','Najemnina (prejeta)','income','1000','home'),
('1050','Socialni transferji','income','1000','heart'),
('1060','Drugo','income','1000',null),
-- Stalni odhodki
('2000','Stanovanje','fixed',null,null),
('2010','Najemnina / hipoteka','fixed','2000','home'),
('2020','Elektrika','fixed','2000','zap'),
('2030','Ogrevanje','fixed','2000','flame'),
('2040','Voda','fixed','2000','droplets'),
('2050','Internet / telefon','fixed','2000','wifi'),
('2060','Zavarovanje','fixed','2000','shield'),
('2100','Transport','fixed',null,null),
('2110','Gorivo','fixed','2100','fuel'),
('2120','Javni prevoz','fixed','2100','bus'),
('2130','Leasing / obrok avta','fixed','2100','car'),
-- Variabilni odhodki
('3000','Prehrana','variable',null,null),
('3010','Trgovina','variable','3000','shopping-cart'),
('3020','Restavracije','variable','3000','utensils'),
('3100','Zdravje','variable',null,null),
('3110','Zdravnik / zobozdravnik','variable','3100','stethoscope'),
('3120','Lekarna','variable','3100','pill'),
('3200','Izobraževanje','variable',null,null),
('3300','Obleka in obutev','variable',null,null),
('3400','Zabava / prosti čas','variable',null,null),
('3500','Potovanja','variable',null,null),
('3600','Dom (popravila)','variable',null,null),
('3700','Otroci','variable',null,'baby'),
('3800','Hišni ljubljenčki','variable',null,null),
('3900','Ostalo','variable',null,null),
-- Prihranki
('4000','Prihranki','savings',null,null),
('4010','Hranilna vloga','savings','4000',null),
('4020','Naložbeni sklad','savings','4000',null),
('4030','Pokojninsko (3. steber)','savings','4000',null);
