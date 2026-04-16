-- Migration v3: Messages / Internal Chat system
-- Run in Supabase → SQL Editor

-- ============================================================
-- MESSAGES TABLE (matches messages/index.html UI)
-- ============================================================
create table if not exists messages (
  id            uuid default uuid_generate_v4() primary key,
  from_user_id  uuid references auth.users not null,
  from_name     text,
  from_email    text,
  to_email      text not null,
  to_name       text,
  subject       text default '(Sin asunto)',
  body          text not null,
  folder        text not null default 'sent' check (folder in ('inbox','sent')),
  read          boolean default false,
  lead_id       uuid references acquisitions_leads(id) on delete set null,
  sent_at       timestamptz default now()
);

create index if not exists messages_from_idx  on messages (from_user_id, sent_at desc);
create index if not exists messages_folder_idx on messages (from_user_id, folder, sent_at desc);

-- ============================================================
-- RLS
-- ============================================================
alter table messages enable row level security;

-- Users see their own messages (sent or inbox)
create policy "messages_select" on messages
  for select using (auth.uid() = from_user_id);

-- Users insert as themselves
create policy "messages_insert" on messages
  for insert with check (auth.uid() = from_user_id);

-- Users can mark their own messages as read
create policy "messages_update" on messages
  for update using (auth.uid() = from_user_id);

-- Users can delete their own messages
create policy "messages_delete" on messages
  for delete using (auth.uid() = from_user_id);

-- ============================================================
-- NOTIFICATIONS TABLE (in-app alerts)
-- ============================================================
create table if not exists notifications (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references auth.users not null,
  type       text not null default 'system',
  title      text not null,
  body       text,
  link       text,
  is_read    boolean default false,
  created_at timestamptz default now()
);

create index if not exists notifications_user_idx
  on notifications (user_id, is_read, created_at desc);

alter table notifications enable row level security;

create policy "notifications_own" on notifications
  for all using (auth.uid() = user_id);
