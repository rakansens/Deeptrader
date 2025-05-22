-- migrate:up
create extension if not exists "uuid-ossp";
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  created_at timestamptz default now()
); 