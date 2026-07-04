-- Combo · Migration 0002 · Row Level Security + Storage (PRD §4.3, §4.4)
--
-- Helper functions are SECURITY DEFINER so policy subqueries don't recurse
-- through RLS of the referenced tables (cards ↔ matches would otherwise loop).

-- ---------------------------------------------------------------- helpers
create or replace function public.owns_card(p_card_id uuid, p_user_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from cards where id = p_card_id and owner_id = p_user_id
  );
$$;

-- Are the two users partners in at least one match (any card pair)?
create or replace function public.is_match_partner(p_user_id uuid, p_other_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from matches m
    join cards ca on ca.id = m.card_a_id
    join cards cb on cb.id = m.card_b_id
    where (ca.owner_id = p_user_id and cb.owner_id = p_other_id)
       or (ca.owner_id = p_other_id and cb.owner_id = p_user_id)
  );
$$;

-- Does p_card_id participate in a match with any card owned by p_user_id?
create or replace function public.card_shares_match_with_user(p_card_id uuid, p_user_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from matches m
    join cards mine on (mine.id = m.card_a_id or mine.id = m.card_b_id)
    where (m.card_a_id = p_card_id or m.card_b_id = p_card_id)
      and mine.id <> p_card_id
      and mine.owner_id = p_user_id
  );
$$;

create or replace function public.is_match_participant(p_match_id uuid, p_user_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from matches m
    join cards c on c.id = m.card_a_id or c.id = m.card_b_id
    where m.id = p_match_id and c.owner_id = p_user_id
  );
$$;

create or replace function public.is_active_match_participant(p_match_id uuid, p_user_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from matches m
    join cards c on c.id = m.card_a_id or c.id = m.card_b_id
    where m.id = p_match_id and m.status = 'active' and c.owner_id = p_user_id
  );
$$;

revoke execute on function public.owns_card(uuid, uuid) from anon, public;
revoke execute on function public.is_match_partner(uuid, uuid) from anon, public;
revoke execute on function public.card_shares_match_with_user(uuid, uuid) from anon, public;
revoke execute on function public.is_match_participant(uuid, uuid) from anon, public;
revoke execute on function public.is_active_match_participant(uuid, uuid) from anon, public;

-- ---------------------------------------------------------------- profiles
alter table public.profiles enable row level security;

-- Read: self + match partners. Deck candidates flow exclusively through the
-- get_deck RPC (PRD §4.3 fallback), so no broader select is needed.
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_match_partner(auth.uid(), id));

create policy profiles_insert on public.profiles for insert
  with check (id = auth.uid());

create policy profiles_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- no delete policy: account deletion cascades from auth.users via RPC

-- ---------------------------------------------------------------- cards
alter table public.cards enable row level security;

create policy cards_select on public.cards for select
  using (owner_id = auth.uid() or public.card_shares_match_with_user(id, auth.uid()));

create policy cards_insert on public.cards for insert
  with check (owner_id = auth.uid());

create policy cards_update on public.cards for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- no delete policy: "deleting" a card sets status = 'deleted' (PRD §3.4)

-- ---------------------------------------------------------------- swipes
alter table public.swipes enable row level security;

create policy swipes_select on public.swipes for select
  using (public.owns_card(swiper_card_id, auth.uid()));

create policy swipes_insert on public.swipes for insert
  with check (
    public.owns_card(swiper_card_id, auth.uid())
    and not public.owns_card(target_card_id, auth.uid())
  );

-- ---------------------------------------------------------------- matches
alter table public.matches enable row level security;

create policy matches_select on public.matches for select
  using (
    public.owns_card(card_a_id, auth.uid())
    or public.owns_card(card_b_id, auth.uid())
  );

-- no insert/update from clients: matches are created by the swipe trigger,
-- archived by triggers/RPCs (all security definer)

-- ---------------------------------------------------------------- messages
alter table public.messages enable row level security;

create policy messages_select on public.messages for select
  using (public.is_match_participant(match_id, auth.uid()));

-- write only into active matches (archived chats are read-only, PRD §3.4)
create policy messages_insert on public.messages for insert
  with check (
    sender_id = auth.uid()
    and public.is_active_match_participant(match_id, auth.uid())
  );

-- no update/delete from clients; read receipts go through mark_match_read RPC

-- ---------------------------------------------------------------- blocks
alter table public.blocks enable row level security;

create policy blocks_select on public.blocks for select
  using (blocker_id = auth.uid());

create policy blocks_insert on public.blocks for insert
  with check (blocker_id = auth.uid());

-- ---------------------------------------------------------------- reports
alter table public.reports enable row level security;

create policy reports_select on public.reports for select
  using (reporter_id = auth.uid());

create policy reports_insert on public.reports for insert
  with check (reporter_id = auth.uid());

-- ---------------------------------------------------------------- storage
-- Public-read bucket for doodles; writes restricted to own folder
-- drawings/{user_id}/{uuid}.png · max 500 KB · PNG only (PRD §4.4)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('drawings', 'drawings', true, 512000, array['image/png'])
on conflict (id) do nothing;

create policy drawings_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'drawings' and (storage.foldername(name))[1] = auth.uid()::text);

create policy drawings_owner_update on storage.objects for update to authenticated
  using (bucket_id = 'drawings' and (storage.foldername(name))[1] = auth.uid()::text);

create policy drawings_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'drawings' and (storage.foldername(name))[1] = auth.uid()::text);

-- needed so the owner can list their folder (e.g. cleanup on account deletion)
create policy drawings_owner_select on storage.objects for select to authenticated
  using (bucket_id = 'drawings' and (storage.foldername(name))[1] = auth.uid()::text);
