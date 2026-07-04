-- Combo · Migration 0001 · Schema (PRD §4)
-- Tables, enums, constraints, indexes, updated_at triggers, realtime publication.

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  birth_date date not null,          -- age >= 16 enforced at signup + check constraint
  bio text check (char_length(bio) <= 500),
  city text not null,                -- display value, e.g. "Zürich"
  lat double precision not null,     -- geocoded from city, rounded to 2 decimals (~1 km)
  lng double precision not null,
  drawing_url text,                  -- PNG in Supabase Storage, nullable
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint min_age check (birth_date <= (current_date - interval '16 years'))
);

-- ---------------------------------------------------------------- cards
create type public.card_type as enum ('project', 'collab_offer', 'mentor_offer');
create type public.card_status as enum ('active', 'paused', 'deleted');

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  type public.card_type not null,
  title text not null check (char_length(title) between 3 and 80),
  description text not null check (char_length(description) between 20 and 1000),
  city text not null,                -- defaults to owner's city, editable per card
  lat double precision not null,
  lng double precision not null,
  radius_km int not null default 50 check (radius_km between 5 and 200),
  drawing_url text,
  -- visibility toggles: only meaningful for type = 'project'
  show_collaborators boolean not null default true,
  show_mentors boolean not null default true,
  status public.card_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cards_owner_idx on public.cards (owner_id);
create index cards_status_type_idx on public.cards (status, type);

-- ---------------------------------------------------------------- swipes
create type public.swipe_direction as enum ('like', 'pass');

create table public.swipes (
  id uuid primary key default gen_random_uuid(),
  swiper_card_id uuid not null references public.cards(id) on delete cascade,
  target_card_id uuid not null references public.cards(id) on delete cascade,
  direction public.swipe_direction not null,
  created_at timestamptz not null default now(),
  unique (swiper_card_id, target_card_id),
  check (swiper_card_id <> target_card_id)
);

-- reciprocity lookup in the match trigger
create index swipes_reverse_idx on public.swipes (target_card_id, swiper_card_id);

-- ---------------------------------------------------------------- matches
create type public.match_status as enum ('active', 'archived');

-- A match IS the chat. No separate chat table.
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  card_a_id uuid not null references public.cards(id) on delete cascade,
  card_b_id uuid not null references public.cards(id) on delete cascade,
  status public.match_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (card_a_id, card_b_id),
  check (card_a_id < card_b_id)      -- canonical ordering prevents duplicates
);

create index matches_card_a_idx on public.matches (card_a_id);
create index matches_card_b_idx on public.matches (card_b_id);

-- ---------------------------------------------------------------- messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index messages_match_idx on public.messages (match_id, created_at);

-- ---------------------------------------------------------------- blocks
create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index blocks_blocked_idx on public.blocks (blocked_id);

-- ---------------------------------------------------------------- reports
create type public.report_status as enum ('open', 'resolved');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  reported_card_id uuid references public.cards(id) on delete set null,
  reason text not null check (char_length(reason) <= 1000),
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  check (reported_user_id is not null or reported_card_id is not null)
);

-- ---------------------------------------------------------------- updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_cards_updated_at before update on public.cards
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- realtime
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.matches;
