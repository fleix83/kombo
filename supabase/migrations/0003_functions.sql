-- Combo · Migration 0003 · Matching, Deck, Chat & Safety functions
-- (PRD §4.1, §4.2, §5.7, §5.8)

-- ---------------------------------------------------------------- match trigger
-- Race-safe match creation (PRD §4.1): an advisory xact lock on the canonical
-- card pair serializes concurrent reciprocal likes. Whichever transaction
-- commits second re-reads swipes after the first commit and creates the match.
-- on conflict do nothing is the second line of defense.
create or replace function public.handle_swipe_match()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_a uuid;
  v_b uuid;
begin
  if new.direction <> 'like' then
    return new;
  end if;

  v_a := least(new.swiper_card_id, new.target_card_id);
  v_b := greatest(new.swiper_card_id, new.target_card_id);

  perform pg_advisory_xact_lock(hashtextextended(v_a::text || ':' || v_b::text, 0));

  if exists (
    select 1 from swipes s
    where s.swiper_card_id = new.target_card_id
      and s.target_card_id = new.swiper_card_id
      and s.direction = 'like'
  ) then
    insert into matches (card_a_id, card_b_id)
    values (v_a, v_b)
    on conflict (card_a_id, card_b_id) do nothing;
  end if;

  return new;
end $$;

create trigger trg_swipe_match after insert on public.swipes
  for each row execute function public.handle_swipe_match();

-- ---------------------------------------------------------------- card deletion
-- "Deleting" a card = status 'deleted' → archive its matches (PRD §3.4).
-- Pausing keeps matches fully usable.
create or replace function public.handle_card_deleted()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'deleted' and old.status <> 'deleted' then
    update matches set status = 'archived'
    where card_a_id = new.id or card_b_id = new.id;
  end if;
  return new;
end $$;

create trigger trg_card_deleted after update on public.cards
  for each row execute function public.handle_card_deleted();

-- ---------------------------------------------------------------- get_deck
-- Deck query (PRD §4.2). All five conditions:
--   1. active, not own
--   2. matching matrix incl. project toggles IN BOTH DIRECTIONS
--   3. Haversine distance <= least(both radius_km)  [mutual-radius rule,
--      decision log in README; switch to a.radius_km only if beta feedback
--      demands it]
--   4. not already swiped by the active card
--   5. no block in either direction
-- Ordered by created_at desc with a small random jitter (~3 days).
create or replace function public.get_deck(p_card_id uuid, p_limit int default 20)
returns table (
  card_id uuid,
  card_type public.card_type,
  title text,
  description text,
  city text,
  distance_km int,
  drawing_url text,
  owner_id uuid,
  owner_name text,
  owner_age int,
  owner_drawing_url text
)
language sql stable security definer set search_path = public as $$
  with me as (
    select c.*
    from cards c
    where c.id = p_card_id
      and c.owner_id = auth.uid()
      and c.status = 'active'
  )
  select
    b.id,
    b.type,
    b.title,
    b.description,
    b.city,
    greatest(5, (round(d.km / 5.0) * 5))::int,
    b.drawing_url,
    p.id,
    p.display_name,
    date_part('year', age(p.birth_date))::int,
    p.drawing_url
  from me a
  join cards b
    on b.status = 'active'
   and b.owner_id <> a.owner_id
  join profiles p on p.id = b.owner_id
  cross join lateral (
    select 6371 * acos(
      least(1.0,
        cos(radians(a.lat)) * cos(radians(b.lat)) * cos(radians(b.lng) - radians(a.lng))
        + sin(radians(a.lat)) * sin(radians(b.lat))
      )
    ) as km
  ) d
  where
    (
      (a.type = 'project' and b.type = 'collab_offer' and a.show_collaborators)
      or (a.type = 'project' and b.type = 'mentor_offer' and a.show_mentors)
      or (a.type = 'collab_offer' and b.type = 'project' and b.show_collaborators)
      or (a.type = 'mentor_offer' and b.type = 'project' and b.show_mentors)
    )
    and d.km <= least(a.radius_km, b.radius_km)
    and not exists (
      select 1 from swipes s
      where s.swiper_card_id = a.id and s.target_card_id = b.id
    )
    and not exists (
      select 1 from blocks bl
      where (bl.blocker_id = a.owner_id and bl.blocked_id = b.owner_id)
         or (bl.blocker_id = b.owner_id and bl.blocked_id = a.owner_id)
    )
  order by (extract(epoch from b.created_at) + random() * 259200) desc
  limit p_limit;
$$;

-- ---------------------------------------------------------------- record_swipe
-- Inserts the swipe (trigger creates the match if reciprocal) and returns the
-- match id, or null. Single round trip for the UI.
create or replace function public.record_swipe(
  p_swiper_card_id uuid,
  p_target_card_id uuid,
  p_direction public.swipe_direction
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_match_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not exists (select 1 from cards where id = p_swiper_card_id and owner_id = auth.uid()) then
    raise exception 'swiper card not owned by caller';
  end if;
  if exists (select 1 from cards where id = p_target_card_id and owner_id = auth.uid()) then
    raise exception 'cannot swipe own card';
  end if;

  insert into swipes (swiper_card_id, target_card_id, direction)
  values (p_swiper_card_id, p_target_card_id, p_direction)
  on conflict (swiper_card_id, target_card_id) do nothing;

  select m.id into v_match_id
  from matches m
  where m.card_a_id = least(p_swiper_card_id, p_target_card_id)
    and m.card_b_id = greatest(p_swiper_card_id, p_target_card_id);

  return v_match_id;
end $$;

-- ---------------------------------------------------------------- matches overview
-- One row per match of the caller (across all their cards), with counterpart
-- card + owner, last message and unread count. Sorted by latest activity.
create or replace function public.get_matches_overview()
returns table (
  match_id uuid,
  match_status public.match_status,
  match_created_at timestamptz,
  my_card_id uuid,
  my_card_title text,
  other_card_id uuid,
  other_card_title text,
  other_card_type public.card_type,
  other_card_drawing_url text,
  other_owner_id uuid,
  other_owner_name text,
  other_owner_drawing_url text,
  last_message_content text,
  last_message_at timestamptz,
  last_message_sender_id uuid,
  unread_count int
)
language sql stable security definer set search_path = public as $$
  select
    m.id,
    m.status,
    m.created_at,
    mine.id,
    mine.title,
    other.id,
    other.title,
    other.type,
    other.drawing_url,
    p.id,
    p.display_name,
    p.drawing_url,
    lm.content,
    lm.created_at,
    lm.sender_id,
    coalesce(un.cnt, 0)::int
  from matches m
  join cards mine
    on mine.id in (m.card_a_id, m.card_b_id)
   and mine.owner_id = auth.uid()
  join cards other
    on other.id in (m.card_a_id, m.card_b_id)
   and other.id <> mine.id
  join profiles p on p.id = other.owner_id
  left join lateral (
    select msg.content, msg.created_at, msg.sender_id
    from messages msg
    where msg.match_id = m.id
    order by msg.created_at desc
    limit 1
  ) lm on true
  left join lateral (
    select count(*) as cnt
    from messages msg
    where msg.match_id = m.id
      and msg.sender_id <> auth.uid()
      and msg.read_at is null
  ) un on true
  order by coalesce(lm.created_at, m.created_at) desc;
$$;

-- ---------------------------------------------------------------- read receipts
-- Sets read_at on all unread counterpart messages of a match (PRD §5.6).
-- RPC instead of an update policy so clients can never touch message content.
create or replace function public.mark_match_read(p_match_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_match_participant(p_match_id, auth.uid()) then
    raise exception 'not a participant of this match';
  end if;
  update messages
  set read_at = now()
  where match_id = p_match_id
    and sender_id <> auth.uid()
    and read_at is null;
end $$;

-- ---------------------------------------------------------------- block
-- Blocks a user and archives all shared matches (PRD §5.7). The deck query
-- filters blocks in both directions, so cards disappear immediately.
create or replace function public.block_user(p_blocked_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_blocked_id = auth.uid() then
    raise exception 'cannot block yourself';
  end if;

  insert into blocks (blocker_id, blocked_id)
  values (auth.uid(), p_blocked_id)
  on conflict do nothing;

  update matches m
  set status = 'archived'
  from cards ca, cards cb
  where ca.id = m.card_a_id
    and cb.id = m.card_b_id
    and (
      (ca.owner_id = auth.uid() and cb.owner_id = p_blocked_id)
      or (ca.owner_id = p_blocked_id and cb.owner_id = auth.uid())
    );
end $$;

-- ---------------------------------------------------------------- account deletion
-- GDPR self-service deletion (PRD §2, §5.8). Deleting the auth.users row
-- cascades through profiles → cards → swipes/matches/messages/blocks/reports.
-- Storage objects are removed by the client BEFORE calling this (storage API
-- delete removes the actual files; SQL deletes would orphan them).
create or replace function public.delete_account()
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end $$;

-- ---------------------------------------------------------------- grants
revoke execute on function public.get_deck(uuid, int) from anon, public;
revoke execute on function public.record_swipe(uuid, uuid, public.swipe_direction) from anon, public;
revoke execute on function public.get_matches_overview() from anon, public;
revoke execute on function public.mark_match_read(uuid) from anon, public;
revoke execute on function public.block_user(uuid) from anon, public;
revoke execute on function public.delete_account() from anon, public;

grant execute on function public.get_deck(uuid, int) to authenticated;
grant execute on function public.record_swipe(uuid, uuid, public.swipe_direction) to authenticated;
grant execute on function public.get_matches_overview() to authenticated;
grant execute on function public.mark_match_read(uuid) to authenticated;
grant execute on function public.block_user(uuid) to authenticated;
grant execute on function public.delete_account() to authenticated;
