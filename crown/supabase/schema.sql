-- CROWN App — Supabase Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- ─── Enable UUID extension ─────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Watches table ───────────────────────────────────────────────────
create table if not exists public.watches (
  id           text primary key default gen_random_uuid()::text,
  user_id      uuid references auth.users(id) on delete cascade not null,
  brand_id     text not null,
  model        text not null,
  year         integer,
  price        text,
  image_url    text,
  owner_name   text not null,
  card_number  integer not null,
  created_at   timestamptz default now() not null
);

-- Row Level Security
alter table public.watches enable row level security;

-- Users can only read/write their own watches
create policy "Users can manage own watches"
  on public.watches
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Index for fast user lookups ─────────────────────────────────────
create index if not exists watches_user_id_idx
  on public.watches(user_id, created_at desc);

-- ─── Anon key permissions (for client-side Supabase) ─────────────────
-- The anon key is safe because RLS enforces ownership