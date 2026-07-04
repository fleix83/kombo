# PRD: Combo

**A swipe-based matching platform for creative side projects.**

Version 2.0 · Language: English · Target reader: Claude Code (implementation agent)
Region: DACH (Germany, Austria, Switzerland) · Initial scale: 50 to 500 users

---

## 1. Product Summary

Combo connects people who want to realize creative leisure projects. It borrows the interaction model of a dating app (cards, swiping, mutual matching, 1:1 chat) but matches **project cards**, not romantic partners.

Three roles exist:

| Role | Card meaning | Motivation |
|---|---|---|
| **Initiator** | "I have a project and I am looking for people" | Wants to realize an idea (short film, band, event, art installation, non-profit initiative) |
| **Collaborator** | "I want to join a project" | Has time and passion, no own project idea |
| **Mentor** ("Pate") | "I will accompany a project as an advisor" | Experienced, interested, but no time for active work. Provides accountability and motivation |

Core loop: create a card → swipe through counterpart cards within a geographic radius → mutual like creates a match → chat opens → collaboration starts off-platform.

**Deliberate product decisions (do not "improve" these):**

- No photo or video uploads. Cards are text plus one hand-drawn doodle. This keeps the product light, playful, and low-barrier.
- No category filters in discovery. Users should be surprised by projects outside their bubble. The only discovery filters are geographic radius and counterpart role.
- No search for people. Discovery happens exclusively through swiping.
- Free for all users. No paywall, no premium tier in MVP. Monetization (commercial/talent-scouting profiles) is a later phase and only needs to be architecturally non-blocking.

**Non-goals for MVP:** native apps, push notifications, SMS verification, media uploads, group chats, project management features, payment, admin web UI (Supabase dashboard is sufficient), category taxonomy.

---

## 2. Users, Age, and Legal Constraints

- **Minimum age: 16.** Enforced via mandatory date-of-birth field at signup. Under-16 signups are rejected.
- Age 16 aligns with the GDPR digital consent age in Germany (Art. 8 GDPR, implemented at 16 in DE; Austria uses 14; Switzerland's revDSG has no fixed threshold), so 16 as the floor is legally the safe choice across DACH.
- Because 16 to 17 year olds can match and chat with adults, the following safety measures are **MVP requirements, not nice-to-haves**:
  - Age is always displayed on every card.
  - Location is displayed only as city/town name, never as coordinates or map position.
  - Block and report functions exist from day one (see §5.7).
- **GDPR requirements (MVP):** Supabase project must be hosted in an EU region (eu-central-1 / Frankfurt). Account deletion must be self-service and must cascade-delete all user data (cards, swipes, matches, messages, drawings in storage). Privacy policy and terms pages must exist (static pages; legal text is provided by the product owner, use placeholders). Collect only the data listed in the schema below, nothing more.

---

## 3. Roles, Cards, and the Matching Matrix

### 3.1 Terminology

The central entity is a **card**, not a "project". This resolves an ambiguity: an initiator's card describes a project; a collaborator's or mentor's card describes an *offer to join*. All three are cards of different types:

- `project` (created by an initiator)
- `collab_offer` (created by a collaborator)
- `mentor_offer` (created by a mentor)

A user can own **multiple cards simultaneously**, of any mix of types (e.g., one own project plus one collab offer).

### 3.2 Matching matrix

Matching is always **project ↔ offer**. Two seekers can never match, and two projects can never match.

| Swiping as ↓ / sees → | `project` | `collab_offer` | `mentor_offer` |
|---|---|---|---|
| `project` | ❌ never | ✅ (default on, user-toggleable) | ✅ (default on, user-toggleable) |
| `collab_offer` | ✅ always | ❌ | ❌ |
| `mentor_offer` | ✅ always | ❌ | ❌ |

- The visibility toggle exists **only on project cards** (an initiator may want only collaborators, only mentors, or both). Offer cards have exactly one valid counterpart type, so they have no toggle.
- `project` vs `project` is a hard exclusion. Never show it, regardless of settings.

### 3.3 Active card (swipe perspective)

Since users can own several cards, all swiping happens **from the perspective of exactly one card**:

- The user selects one of their active cards as the **active card** before entering the swipe deck.
- The active card can be switched at any time (a card switcher is visible on the deck screen).
- Swipes, likes, and matches are recorded **card-to-card**, not user-to-user. The same two users can therefore have multiple independent matches through different card pairs; each match has its own chat.
- A user never sees their own cards in the deck, and never sees cards of users they have blocked or who have blocked them.

### 3.4 Match rules

- A **swipe** is a directed decision of the active card on a target card: `like` or `pass`.
- A **match** is created automatically the moment reciprocal likes exist between two cards (card A liked card B, and card B's owner, swiping as card B, liked card A).
- On match creation, both users get an in-app match notification (a "It's a match" overlay for the user who completed it; a badge for the other) and the chat becomes available.
- Passed cards do not reappear in the deck. Liked-but-unmatched cards also do not reappear. (No "rewind" feature in MVP.)
- Deactivating or deleting a card removes it from all decks immediately. Existing matches and chats of that card **remain accessible** (read and write), so conversations are not killed when a project fills up. Deleting the card entirely archives its matches (chat becomes read-only) — implement archiving as a `status` on the match, not by deleting rows.

---

## 4. Data Model (PostgreSQL / Supabase)

Use Supabase Auth for identity (`auth.users`). All app tables live in `public` with Row Level Security enabled on every table. Timestamps are `timestamptz` with `default now()`. IDs are `uuid default gen_random_uuid()`.

```sql
-- Profile: 1:1 with auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  birth_date date not null,          -- age >= 16 enforced at signup + check constraint
  bio text check (char_length(bio) <= 500),
  city text not null,                -- display value, e.g. "Zürich"
  lat double precision not null,     -- geocoded from city OR browser geolocation
  lng double precision not null,
  drawing_url text,                  -- PNG in Supabase Storage, nullable
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint min_age check (birth_date <= (current_date - interval '16 years'))
);

create type card_type as enum ('project', 'collab_offer', 'mentor_offer');
create type card_status as enum ('active', 'paused', 'deleted');

create table cards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  type card_type not null,
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
  status card_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type swipe_direction as enum ('like', 'pass');

create table swipes (
  id uuid primary key default gen_random_uuid(),
  swiper_card_id uuid not null references cards(id) on delete cascade,
  target_card_id uuid not null references cards(id) on delete cascade,
  direction swipe_direction not null,
  created_at timestamptz not null default now(),
  unique (swiper_card_id, target_card_id)
);

create type match_status as enum ('active', 'archived');

-- A match IS the chat. No separate chat table.
create table matches (
  id uuid primary key default gen_random_uuid(),
  card_a_id uuid not null references cards(id) on delete cascade,
  card_b_id uuid not null references cards(id) on delete cascade,
  status match_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (card_a_id, card_b_id),
  check (card_a_id < card_b_id)      -- canonical ordering prevents duplicates
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create type report_status as enum ('open', 'resolved');

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  reported_user_id uuid references profiles(id) on delete set null,
  reported_card_id uuid references cards(id) on delete set null,
  reason text not null check (char_length(reason) <= 1000),
  status report_status not null default 'open',
  created_at timestamptz not null default now()
);
```

### 4.1 Match creation

Create matches in a **database trigger** on `swipes` insert (or a `security definer` RPC that inserts the swipe and checks reciprocity in one transaction). Do not implement match detection client-side; it must be race-safe.

### 4.2 Deck query (server-side RPC)

Implement `get_deck(active_card_id uuid, limit int)` as a Postgres function (`security definer`, validating that the caller owns `active_card_id`). It returns candidate cards that satisfy **all** of:

1. `status = 'active'` and not owned by the caller.
2. Type compatibility per the matching matrix in §3.2, including the project card's `show_collaborators` / `show_mentors` toggles **in both directions** (a project that disabled mentors must also not appear in mentors' decks).
3. Haversine distance between the two cards ≤ **the smaller of the two cards' `radius_km`** (mutual radius respect; simpler alternative if this proves confusing: respect only the swiper's radius; pick one and document it in code).
4. No existing swipe from `active_card_id` on the candidate.
5. No block relationship in either direction between the two owners.

Order results by `created_at desc` with a small random factor. Plain Haversine in SQL is sufficient at this scale; **do not add PostGIS**.

```sql
-- Haversine, km
6371 * acos(
  least(1.0,
    cos(radians(a.lat)) * cos(radians(b.lat)) * cos(radians(b.lng) - radians(a.lng))
    + sin(radians(a.lat)) * sin(radians(b.lat))
  )
)
```

### 4.3 Row Level Security (summary of intent)

- `profiles`: users read profiles only of card owners they can legitimately see (deck candidates, match partners); users update only their own row. If per-row deck filtering in RLS gets complex, expose deck data exclusively through the `get_deck` RPC and keep direct `select` on `profiles` restricted to self and match partners.
- `cards`: owner has full CRUD on own cards; others read only via `get_deck` RPC and via matches.
- `swipes`: insert only where `swiper_card_id` belongs to the caller; no reads needed by clients except own swipes.
- `matches` / `messages`: visible and writable only to the two participants; `messages.sender_id` must equal caller; no message edits or deletes in MVP.
- `blocks` / `reports`: insert and read own rows only.

### 4.4 Storage

One public-read Supabase Storage bucket `drawings`. Path convention: `drawings/{user_id}/{uuid}.png`. Write access restricted to the owning user via storage policies. Max file size 500 KB.

---

## 5. Feature Specification by Screen

### 5.1 Auth

- Email + password signup and login via Supabase Auth. **Email verification required** before onboarding.
- Password reset flow (Supabase built-in).
- Signup collects: email, password, date of birth. Reject under 16 with a clear message.
- **Phone/SMS verification is explicitly deferred** (see §8), but design the profile schema and settings UI so a `phone` + `phone_verified` pair can be added later without migration pain (adding two nullable columns is acceptable; no need to pre-create them).

### 5.2 Onboarding (first login after verification)

1. Display name, city (text input with geocoding; see §6.4), optional bio.
2. **Drawing step:** a canvas where the user draws their profile doodle with finger or mouse. Tools: pen with 3 stroke widths, ~8 preset colors, eraser, undo, clear, and rotate of the whole drawing. Export as transparent PNG (max ~800×800) and upload to storage. Skippable; a neutral placeholder doodle is shown if skipped.
3. Prompt to create the first card (can be skipped).

### 5.3 My Cards

- List of own cards with type badge, status, and match count.
- Create/edit card: type selection (with one-line explanations of the three roles), title, description, city (prefilled from profile), radius slider (5 to 200 km, default 50), drawing canvas (same component as onboarding), and, for project cards only, the two visibility toggles.
- Pause/reactivate and delete (with confirmation; delete archives its matches per §3.4).

### 5.4 Swipe Deck

- Top bar: active-card switcher (dropdown or horizontal chips showing the user's active cards).
- Card stack showing counterpart cards. Card layout (one mobile screen, no scrolling): drawing as header, type badge, title, description (truncated with "more" expanding in place), owner's display name, **age**, and **city**, distance in km (rounded to 5 km granularity to avoid precise localization).
- Swipe right / left with drag gesture plus explicit Like / Pass buttons (accessibility).
- Match overlay when a swipe completes a match, with a "Say hello" button that deep-links into the chat.
- Empty state when the deck is exhausted: friendly message suggesting a larger radius or toggling counterpart types.

### 5.5 Matches

- List of matches for **all** of the user's cards, grouped or labeled by own card, sorted by latest message. Shows counterpart drawing, name, card title, last message preview, unread badge.

### 5.6 Chat

- Standard 1:1 text chat per match. Realtime via Supabase Realtime subscription on `messages`.
- Text only, max 2000 chars per message. Timestamps. Read state (`read_at` set when the recipient opens the chat). No typing indicators, no online presence in MVP.
- Header shows the counterpart card (tap opens the full card view) and an overflow menu with **Block user** and **Report**.

### 5.7 Safety

- **Block:** hides all of that user's cards from all decks in both directions and archives all shared matches. Immediate, no confirmation from the other side, other side is not notified.
- **Report:** short reason text, targets a user and/or a card, lands in the `reports` table. MVP moderation happens through the Supabase dashboard; no admin UI is built.

### 5.8 Settings

- Edit profile (name, city, bio, redraw doodle).
- Change email/password (Supabase flows).
- Links to privacy policy and terms (static pages, placeholder text).
- **Delete account:** double confirmation, then full cascade deletion including storage objects.

---

## 6. Architecture and Tech Stack

### 6.1 Guiding principle: portability to iOS/Android

The single most important architectural requirement: **everything except rendering must be reusable in a future React Native app.** Enforce this with a hard directory boundary:

```
src/
  core/          # platform-neutral. NO imports of react-dom, window, document,
                 # CSS, or any browser API. Pure TypeScript + supabase-js.
    types/       # DB row types, DTOs, enums (mirror the SQL schema)
    api/         # all Supabase calls: auth, profiles, cards, deck, swipes,
                 # matches, messages, blocks, reports, storage upload
    logic/       # pure functions: age calc, distance formatting,
                 # matching-matrix helpers, validation (zod schemas)
    store/       # Zustand stores (Zustand is platform-neutral)
  ui/            # web-only React components, hooks that touch the DOM,
                 # routing, canvas drawing component
  pages/         # route-level composition
```

Rules for Claude Code:

- `core/` must compile without `"dom"` in `tsconfig` lib for that directory (or at minimum: an ESLint rule forbidding `window`/`document` and `react-dom` imports inside `core/`).
- Components in `ui/` contain no Supabase calls; they call `core/api` or stores.
- The future native app replaces `ui/` + `pages/` with React Native screens and reuses `core/` unchanged. The Supabase backend is shared as-is.
- Known exception: the drawing canvas is inherently platform-specific and will be reimplemented for native (e.g., with react-native-skia). Isolate it as one component with a narrow interface: `onExport(pngBlob)`.

*Documented alternative (not chosen):* Expo + react-native-web would give one codebase for web, iOS, and Android from day one, but adds complexity to the web MVP (styling constraints, canvas support, heavier tooling). Given a non-developer product owner and a web-first launch, the core/ui split above is the lower-risk path. Revisit Expo only if native ships within ~6 months of web.

### 6.2 Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Mobile-first responsive; the app is designed for phone-width viewports, desktop gets a centered ~420px column |
| Styling | Tailwind CSS | |
| State | Zustand | Platform-neutral, lives in `core/store` |
| Routing | React Router | Web-only, lives in `ui`/`pages` |
| Swipe gesture | framer-motion (custom swipe) or react-tinder-card | framer-motion preferred: maintained, and the gesture code stays small |
| Drawing | HTML canvas + `perfect-freehand` for stroke quality | Export via `canvas.toBlob('image/png')` |
| Validation | zod (shared schemas in `core`) | |
| Backend | Supabase: Postgres, Auth, Realtime, Storage, RPC functions | EU region (Frankfurt). All authorization via RLS + security-definer RPCs. **No custom server.** |
| Geocoding | See §6.4 | |
| Hosting | Vercel or Netlify (static) | |
| Repo/CI | GitHub, GitHub Actions (typecheck, lint, build) | |
| Env | `.env.local` for Supabase URL + anon key; never commit keys | |

### 6.3 Realtime

Subscribe to `messages` inserts filtered by the user's match IDs for live chat, and to `matches` inserts for the match notification badge. Keep subscription logic in `core/api/realtime.ts` behind a callback interface so it ports to native unchanged.

### 6.4 Location

- Primary input: city text field. Geocode city → lat/lng at save time using a free geocoding API (e.g., OpenStreetMap Nominatim, respecting its usage policy: ~1 req/s, proper User-Agent, results cached in the DB). At 500 users this is comfortably within limits. If Nominatim's policy is a concern, a lightweight alternative is a bundled DACH city/postal-code lookup table; decide at implementation time and note the choice in the README.
- Optional convenience: "Use my location" button using the browser Geolocation API, then reverse-geocode to a city name for display. Store only city-level precision: **round stored lat/lng to 2 decimal places (~1 km)**; never store raw GPS coordinates.

---

## 7. Build Order (Milestones for Claude Code)

Each milestone should end in a deployable, testable state.

1. **M1 Foundation:** Vite + React + TS + Tailwind scaffold with `core`/`ui` boundary and lint rule; Supabase project schema migration (all tables, enums, RLS, `get_deck` RPC stub, match trigger); auth (signup with DoB gate, email verification, login, reset).
2. **M2 Profile & Cards:** onboarding flow, drawing canvas component with PNG export + storage upload, card CRUD with radius slider and visibility toggles.
3. **M3 Matching:** full `get_deck` RPC, swipe deck UI with gestures and buttons, swipe recording, race-safe match creation, match overlay.
4. **M4 Chat:** matches list, realtime chat, read states.
5. **M5 Safety & GDPR:** block, report, account deletion cascade (including storage), privacy/terms placeholder pages, empty states, error handling pass.
6. **M6 Beta hardening:** seed script with ~30 plausible demo cards across DACH cities for testing, basic e2e smoke tests (Playwright) for the core loop, deploy to production URL.

---

## 8. Deferred / Phase 2+ (do not build now, do not block later)

- **SMS/phone verification:** add `phone text`, `phone_verified boolean` to `profiles`; Supabase Phone Auth with an SMS provider (e.g., Twilio). Costs money per SMS, hence deferred.
- Native iOS/Android apps (React Native reusing `core/`), push notifications.
- Trust signals (verified badge, optional trust score).
- Commercial/talent-scouting profiles as the monetization path: model as a `profile_kind` enum later; regular users stay free.
- Category tags (only if user feedback demands it; conflicts with the surprise principle).
- Admin web UI, richer moderation tooling.
- i18n: MVP UI language is **German**; keep all UI strings in a single `de.ts` dictionary from the start so adding languages later is trivial.

---

## 9. Success Metrics (Beta)

- Activation: % of signups that publish at least one card within 48 h.
- Liquidity: median deck size on first open (target > 10 cards; seed content matters at 50 users).
- Match rate: matches per 100 likes.
- Conversation rate: % of matches with ≥ 3 messages from each side.
- Retention: week-2 return rate.
- Zero unresolved safety reports older than 72 h.

---

## 10. Open Questions (tracked, not blocking)

1. Exact legal texts (privacy policy, terms, Impressum) — product owner to supply; use placeholder pages.
2. Mutual-radius vs swiper-radius rule in `get_deck` (§4.2 point 3) — pick swiper-radius if mutual proves confusing in beta.
3. Whether drawing vector data should also be stored (would allow re-editing instead of redrawing) — MVP stores PNG only.
4. Brand identity, color palette, logo — until provided, use a playful, hand-drawn-feeling neutral theme.
