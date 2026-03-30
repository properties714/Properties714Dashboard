-- ============================================================
-- Properties 714 Dashboard — Supabase Schema
-- Run this in: Supabase → SQL Editor → Run
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (linked to Supabase Auth users)
-- ============================================================
create table if not exists profiles (
  id          uuid references auth.users on delete cascade primary key,
  full_name   text not null,
  email       text,
  role        text not null default 'acquisitionist'
                check (role in ('owner', 'acquisitionist')),
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Auto-create profile when a user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'acquisitionist')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- ACQUISITIONS_LEADS (main table)
-- ============================================================
create table if not exists acquisitions_leads (
  id                uuid default uuid_generate_v4() primary key,

  -- Ownership (RLS key)
  user_id           uuid references auth.users not null,
  assigned_to       text,  -- display name of the acquisitionist

  -- Contact
  name              text not null,
  phone             text,
  email             text,
  source            text,

  -- Property
  property_address  text not null,
  city              text,
  state             text default 'GA',
  zip               text,
  property_type     text default 'SFR',
  condition         text,
  occupancy         text,

  -- Deal type: wholesale | fix_flip | buy_hold
  deal_type         text default 'wholesale'
                    check (deal_type in ('wholesale', 'fix_flip', 'buy_hold')),

  -- Financials — All deal types
  asking_price      numeric,
  arv               numeric,
  repairs           numeric,
  mao               numeric,
  estimated_profit  numeric,
  roi               numeric,

  -- Financials — Wholesaling
  assignment_fee    numeric,
  cash_buyer        text,
  closing_date      date,

  -- Financials — Fix & Flip extras
  holding_costs     numeric,
  purchase_price    numeric,

  -- Financials — Buy & Hold extras
  monthly_rent      numeric,
  noi               numeric,
  cap_rate          numeric,
  cash_on_cash      numeric,

  -- Scoring & Status
  deal_score        integer default 0,
  motivation_score  integer default 5 check (motivation_score between 1 and 10),
  urgency_level     text default 'Medium',
  risk_level        text default 'Medium',
  status            text default 'New Lead',
  substatus         text,
  suggested_action  text,

  -- Flags
  hot_deal          boolean default false,
  overdue           boolean default false,
  no_contact        boolean default false,

  -- Tracking
  last_contact      date,
  next_followup     date,
  attempts          integer default 0,
  days_in_pipeline  integer default 0,

  -- Timestamps
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ============================================================
-- LEAD NOTES
-- ============================================================
create table if not exists lead_notes (
  id         uuid default uuid_generate_v4() primary key,
  lead_id    uuid references acquisitions_leads on delete cascade not null,
  user_id    uuid references auth.users not null,
  author     text,
  content    text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- LEAD ACTIVITY
-- ============================================================
create table if not exists lead_activity (
  id          uuid default uuid_generate_v4() primary key,
  lead_id     uuid references acquisitions_leads on delete cascade not null,
  user_id     uuid references auth.users not null,
  type        text not null,  -- call | sms | email | visit | note | status_change
  description text,
  created_at  timestamptz default now()
);

-- ============================================================
-- DEALS (Phase 2 — Closing Tracker)
-- ============================================================
create table if not exists deals (
  id               uuid default uuid_generate_v4() primary key,
  lead_id          uuid references acquisitions_leads,
  user_id          uuid references auth.users not null,

  property_address text not null,
  deal_type        text default 'wholesale',
  status           text default 'Under Contract',

  purchase_price   numeric,
  assignment_fee   numeric,
  arv              numeric,
  repairs          numeric,
  profit           numeric,

  earnest_money    numeric,
  inspection_ends  date,
  closing_date     date,

  buyer_name       text,
  buyer_phone      text,
  attorney_name    text,
  attorney_phone   text,
  notes            text,

  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ============================================================
-- CRM CONTACTS (Phase 2)
-- ============================================================
create table if not exists crm_contacts (
  id            uuid default uuid_generate_v4() primary key,
  user_id       uuid references auth.users not null,

  name          text not null,
  phone         text,
  email         text,
  source        text,
  motivation    text,
  status        text default 'Active',

  next_followup date,
  last_contact  date,
  notes         text,

  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists acq_leads_updated_at on acquisitions_leads;
create trigger acq_leads_updated_at
  before update on acquisitions_leads
  for each row execute procedure set_updated_at();

drop trigger if exists deals_updated_at on deals;
create trigger deals_updated_at
  before update on deals
  for each row execute procedure set_updated_at();

drop trigger if exists crm_updated_at on crm_contacts;
create trigger crm_updated_at
  before update on crm_contacts
  for each row execute procedure set_updated_at();

-- ============================================================
-- HELPER: get current user role (used in RLS)
-- ============================================================
create or replace function get_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid()
$$ language sql stable security definer;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- PROFILES
alter table profiles enable row level security;

drop policy if exists "Users see own profile"       on profiles;
drop policy if exists "Owner sees all profiles"      on profiles;
drop policy if exists "Users update own profile"     on profiles;

create policy "Users see own profile"
  on profiles for select
  using (id = auth.uid());

create policy "Owner sees all profiles"
  on profiles for select
  using (get_user_role() = 'owner');

create policy "Users update own profile"
  on profiles for update
  using (id = auth.uid());

-- ACQUISITIONS_LEADS
alter table acquisitions_leads enable row level security;

drop policy if exists "See own or all leads"         on acquisitions_leads;
drop policy if exists "Insert own leads"             on acquisitions_leads;
drop policy if exists "Update own or all leads"      on acquisitions_leads;
drop policy if exists "Delete own or all leads"      on acquisitions_leads;

create policy "See own or all leads"
  on acquisitions_leads for select
  using (user_id = auth.uid() or get_user_role() = 'owner');

create policy "Insert own leads"
  on acquisitions_leads for insert
  with check (user_id = auth.uid());

create policy "Update own or all leads"
  on acquisitions_leads for update
  using (user_id = auth.uid() or get_user_role() = 'owner');

create policy "Delete own or all leads"
  on acquisitions_leads for delete
  using (user_id = auth.uid() or get_user_role() = 'owner');

-- LEAD NOTES
alter table lead_notes enable row level security;

drop policy if exists "See notes on accessible leads" on lead_notes;
drop policy if exists "Insert notes"                  on lead_notes;

create policy "See notes on accessible leads"
  on lead_notes for select
  using (
    exists (
      select 1 from acquisitions_leads l
      where l.id = lead_notes.lead_id
        and (l.user_id = auth.uid() or get_user_role() = 'owner')
    )
  );

create policy "Insert notes"
  on lead_notes for insert
  with check (user_id = auth.uid());

-- LEAD ACTIVITY
alter table lead_activity enable row level security;

drop policy if exists "See activity on accessible leads" on lead_activity;
drop policy if exists "Insert activity"                  on lead_activity;

create policy "See activity on accessible leads"
  on lead_activity for select
  using (
    exists (
      select 1 from acquisitions_leads l
      where l.id = lead_activity.lead_id
        and (l.user_id = auth.uid() or get_user_role() = 'owner')
    )
  );

create policy "Insert activity"
  on lead_activity for insert
  with check (user_id = auth.uid());

-- DEALS
alter table deals enable row level security;

drop policy if exists "See own or all deals"    on deals;
drop policy if exists "Insert own deals"        on deals;
drop policy if exists "Update own or all deals" on deals;

create policy "See own or all deals"
  on deals for select
  using (user_id = auth.uid() or get_user_role() = 'owner');

create policy "Insert own deals"
  on deals for insert
  with check (user_id = auth.uid());

create policy "Update own or all deals"
  on deals for update
  using (user_id = auth.uid() or get_user_role() = 'owner');

-- CRM CONTACTS
alter table crm_contacts enable row level security;

drop policy if exists "See own or all contacts"    on crm_contacts;
drop policy if exists "Insert own contacts"        on crm_contacts;
drop policy if exists "Update own or all contacts" on crm_contacts;

create policy "See own or all contacts"
  on crm_contacts for select
  using (user_id = auth.uid() or get_user_role() = 'owner');

create policy "Insert own contacts"
  on crm_contacts for insert
  with check (user_id = auth.uid());

create policy "Update own or all contacts"
  on crm_contacts for update
  using (user_id = auth.uid() or get_user_role() = 'owner');

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_acq_leads_user_id    on acquisitions_leads(user_id);
create index if not exists idx_acq_leads_status     on acquisitions_leads(status);
create index if not exists idx_acq_leads_score      on acquisitions_leads(deal_score desc);
create index if not exists idx_acq_leads_hot        on acquisitions_leads(hot_deal) where hot_deal = true;
create index if not exists idx_acq_leads_overdue    on acquisitions_leads(overdue) where overdue = true;
create index if not exists idx_lead_notes_lead      on lead_notes(lead_id);
create index if not exists idx_lead_activity_lead   on lead_activity(lead_id);
create index if not exists idx_lead_activity_date   on lead_activity(created_at desc);
create index if not exists idx_deals_user           on deals(user_id);
create index if not exists idx_crm_user             on crm_contacts(user_id);
