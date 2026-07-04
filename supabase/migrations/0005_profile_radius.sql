-- Combo · Migration 0005 · Default radius on the profile
--
-- Beta feedback: the radius should also be a user-level setting. It acts as
-- the default for new cards (still adjustable per card, PRD §5.3) and is
-- editable in onboarding and profile settings.
alter table public.profiles
  add column radius_km int not null default 50 check (radius_km between 5 and 200);
