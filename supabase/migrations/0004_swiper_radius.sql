-- Combo · Migration 0004 · Deck radius rule: mutual → swiper-only
--
-- PRD §4.2.3 / §10.2: the mutual-radius rule ("smaller of the two cards'
-- radius_km") proved confusing in beta — decks looked empty even though
-- cards were nearby. As sanctioned by the PRD, the deck now respects only
-- the swiper's own radius: you see everything within YOUR radius.
-- (Decision log: README, 2026-07-04.)
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
    and d.km <= a.radius_km   -- swiper-radius rule (was: least(a.radius_km, b.radius_km))
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
