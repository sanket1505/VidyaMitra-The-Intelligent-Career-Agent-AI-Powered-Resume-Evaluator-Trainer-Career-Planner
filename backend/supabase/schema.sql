-- VidyaMitra Supabase schema
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  first_name text,
  last_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  best_resume_score integer not null default 0,
  average_quiz_score integer not null default 0,
  modules_completed integer not null default 0,
  target_role text default 'Technology',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_text text,
  score integer not null default 0,
  feedback jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_applied_for text,
  readiness_score integer not null default 0,
  feedback jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_progress_user_id on public.user_progress(user_id);
create index if not exists idx_resumes_user_id on public.resumes(user_id);
create index if not exists idx_interviews_user_id on public.interviews(user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_progress_updated_at on public.user_progress;
create trigger trg_user_progress_updated_at
before update on public.user_progress
for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.user_progress enable row level security;
alter table public.resumes enable row level security;
alter table public.interviews enable row level security;

-- Users can read/update only their own rows.
drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
for select using (auth.uid() = id);

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
for update using (auth.uid() = id);

drop policy if exists progress_select_own on public.user_progress;
create policy progress_select_own on public.user_progress
for select using (auth.uid() = user_id);

drop policy if exists progress_insert_own on public.user_progress;
create policy progress_insert_own on public.user_progress
for insert with check (auth.uid() = user_id);

drop policy if exists progress_update_own on public.user_progress;
create policy progress_update_own on public.user_progress
for update using (auth.uid() = user_id);

drop policy if exists resumes_select_own on public.resumes;
create policy resumes_select_own on public.resumes
for select using (auth.uid() = user_id);

drop policy if exists resumes_insert_own on public.resumes;
create policy resumes_insert_own on public.resumes
for insert with check (auth.uid() = user_id);

drop policy if exists interviews_select_own on public.interviews;
create policy interviews_select_own on public.interviews
for select using (auth.uid() = user_id);

drop policy if exists interviews_insert_own on public.interviews;
create policy interviews_insert_own on public.interviews
for insert with check (auth.uid() = user_id);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text,
  score integer not null default 0,
  total_questions integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text,
  current_milestone text,
  total_modules integer not null default 0,
  completed_modules integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_quizzes_user_id on public.quizzes(user_id);
create index if not exists idx_training_plans_user_id on public.training_plans(user_id);

alter table public.quizzes enable row level security;
alter table public.training_plans enable row level security;

drop policy if exists quizzes_select_own on public.quizzes;
create policy quizzes_select_own on public.quizzes
for select using (auth.uid() = user_id);

drop policy if exists quizzes_insert_own on public.quizzes;
create policy quizzes_insert_own on public.quizzes
for insert with check (auth.uid() = user_id);

drop policy if exists training_plans_select_own on public.training_plans;
create policy training_plans_select_own on public.training_plans
for select using (auth.uid() = user_id);

drop policy if exists training_plans_insert_own on public.training_plans;
create policy training_plans_insert_own on public.training_plans
for insert with check (auth.uid() = user_id);

drop policy if exists training_plans_update_own on public.training_plans;
create policy training_plans_update_own on public.training_plans
for update using (auth.uid() = user_id);


drop policy if exists quizzes_delete_own on public.quizzes;
create policy quizzes_delete_own on public.quizzes
for delete using (auth.uid() = user_id);

drop policy if exists training_plans_delete_own on public.training_plans;
create policy training_plans_delete_own on public.training_plans
for delete using (auth.uid() = user_id);

-- Backward compatibility for legacy deployments still using learning_plans.
do $$
begin
  if to_regclass('public.learning_plans') is not null then
    execute 'alter table public.learning_plans enable row level security';

    execute 'drop policy if exists learning_plans_select_own on public.learning_plans';
    execute 'create policy learning_plans_select_own on public.learning_plans for select using (auth.uid() = user_id)';

    execute 'drop policy if exists learning_plans_insert_own on public.learning_plans';
    execute 'create policy learning_plans_insert_own on public.learning_plans for insert with check (auth.uid() = user_id)';

    execute 'drop policy if exists learning_plans_update_own on public.learning_plans';
    execute 'create policy learning_plans_update_own on public.learning_plans for update using (auth.uid() = user_id)';

    execute 'drop policy if exists learning_plans_delete_own on public.learning_plans';
    execute 'create policy learning_plans_delete_own on public.learning_plans for delete using (auth.uid() = user_id)';
  end if;
end
$$;
