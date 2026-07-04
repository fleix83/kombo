# Combo — Implementation Plan

Based on `PRD.md` v2.0 · Created 2026-07-04
Target: web MVP (mobile-first React SPA) on Supabase, deployable after every milestone.

---

## 0. Current State & Environment

- Empty project directory (`PRD.md`, `.mcp.json`, agent skills only). No git repo yet.
- Supabase project **Kombo** exists: ref `lcjckdaycmpnbbuxvkyk`, Postgres 17, status healthy.
- Toolchain: Node 22.12, npm 10.9, git 2.50 — all sufficient.

### ⚠️ Flag: Supabase region

The PRD (§2, §6.2) requires an **EU region (eu-central-1 / Frankfurt)** for GDPR. The existing
Kombo project is in **eu-central-2 (Zurich, Switzerland)**. Switzerland holds an EU adequacy
decision, so this is likely defensible — but it deviates from the PRD's explicit requirement.

**Decision needed from product owner:** keep Zurich, or recreate the project in `eu-central-1`
before M1 ships. Everything in this plan is region-agnostic (migrations are plain SQL), so
switching later is possible but means re-running migrations and re-inviting beta users.

---

## 1. Key Technical Decisions (resolving PRD open points)

| Topic | Decision | Rationale |
|---|---|---|
| Deck radius rule (§4.2.3) | **Mutual radius** (smaller of both cards' `radius_km`) | PRD's primary preference; documented in the RPC; switch to swiper-only is a one-line change if beta feedback demands it |
| Geocoding (§6.4) | **Nominatim** with debounced lookup, proper `User-Agent`, results stored on the row (lat/lng rounded to 2 decimals) | Simplest; well within usage policy at this scale; noted in README |
| Swipe gesture (§6.2) | **framer-motion** custom swipe | PRD preference; maintained, small gesture code |
| Match creation (§4.1) | **DB trigger** on `swipes` insert using `pg_advisory_xact_lock` on the canonical card pair | Serializes concurrent reciprocal likes → race-safe; `on conflict do nothing` as second guard |
| Date of birth at signup | Stored in `auth.users.user_metadata` at signup; copied into `profiles.birth_date` when the profile row is created at onboarding | `profiles` has NOT NULL columns (name, city, lat/lng) that don't exist until onboarding, so the row can't be created at signup |
| Read receipts | Column-level grant: clients may `UPDATE` only `messages.read_at` (revoke update, `GRANT UPDATE (read_at)`), policy restricts to recipient | Prevents content tampering without an extra RPC |
| Account deletion (§5.8) | Client deletes own `drawings/{uid}/*` storage objects first, then calls `delete_account()` security-definer RPC that deletes the `auth.users` row → everything cascades | Deleting `storage.objects` rows via SQL orphans the underlying files; the storage API delete is the correct path |
| core/ boundary (§6.1) | ESLint: `no-restricted-globals` (window, document, navigator, localStorage) + `no-restricted-imports` (react-dom, react-router, ../ui) scoped to `src/core/**`; Supabase client created via `initSupabase(url, key)` called from web entry point | `import.meta.env` must not leak into `core/` (Vite-specific) |
| UI language | German, all strings in `src/ui/i18n/de.ts` from day one (§8) | |
| Version pins | React 18, Vite 5, Tailwind 3, React Router 6, Zustand 4, zod 3, supabase-js 2 | Stable, well-documented majors matching the PRD; upgrade later deliberately, not accidentally |

---

## 2. Repository Layout

```
kombo/
  PRD.md
  IMPLEMENTATION_PLAN.md
  README.md                  # setup, decisions log (geocoding, radius rule)
  .env.example               # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
  .env.local                 # gitignored
  supabase/
    migrations/              # numbered SQL files, applied via Supabase MCP / CLI
      0001_schema.sql        # enums, tables, constraints, updated_at triggers
      0002_rls.sql           # RLS policies + storage bucket & policies
      0003_matching.sql      # match trigger + get_deck RPC
    seed/
      seed_demo.sql          # M6: ~30 demo cards across DACH cities
  src/
    core/                    # platform-neutral: NO browser APIs, NO react-dom
      types/                 # DB row types, enums, DTOs (mirror SQL)
      api/                   # supabase.ts (initSupabase), auth.ts, profiles.ts,
                             # cards.ts, deck.ts, swipes.ts, matches.ts,
                             # messages.ts, blocks.ts, reports.ts, storage.ts,
                             # realtime.ts (callback interface), geocode.ts
      logic/                 # age.ts, distance.ts, matrix.ts, validation.ts (zod)
      store/                 # authStore, cardsStore, deckStore, matchesStore, chatStore
    ui/                      # web-only components & hooks
      i18n/de.ts
      components/            # AppShell, CardView, DrawingCanvas, SwipeStack, …
    pages/                   # route-level composition (React Router)
  e2e/                       # M6: Playwright smoke tests
  .github/workflows/ci.yml   # typecheck, lint, test, build
```

---

## 3. Milestones

Each milestone ends deployable and manually testable. Commit per task, milestone tag at the end.

### M1 — Foundation (schema, auth, skeleton)

1. **Scaffold**: `git init`; Vite + React + TS; Tailwind (mobile-first, desktop = centered ~420px column via `AppShell`); ESLint incl. the `core/` boundary rules; Vitest; `de.ts` started; README with decisions log; `.env` plumbing (`initSupabase` called from `main.tsx`).
2. **Migration 0001 — schema**: all enums + tables verbatim from PRD §4 (profiles, cards, swipes, matches, messages, blocks, reports) plus `updated_at` triggers. Mirror as TS types in `core/types`.
3. **Migration 0002 — RLS & storage**: RLS enabled on every table; policies per PRD §4.3 (profiles readable by self + match partners only; cards owner-CRUD + match-partner read; swipes insert-own/read-own; matches/messages participants only, insert requires `status='active'`; blocks/reports insert+read own). `drawings` bucket: public read, owner-scoped write via path prefix `{uid}/`, 500 KB limit.
4. **Migration 0003 — matching primitives**: race-safe match trigger (advisory lock on `least/greatest` card pair, reciprocity check, `on conflict do nothing`); `get_deck` as a stub with correct signature (full logic in M3). Verify trigger with a SQL test script (seeded `auth.users` rows) including the concurrent-reciprocal-like case.
5. **Auth**: zod signup schema (email, password ≥ 8, DoB with ≥ 16 refine + clear German error); `core/api/auth.ts` (signUp stores DoB in metadata, signIn, signOut, reset, session listener); `authStore`; pages: Signup, Login, VerifyEmailNotice, PasswordReset; route guards (unverified → verify notice; verified without profile → onboarding). Confirm "Confirm email" is ON in Supabase Auth settings.

**Done when:** user can sign up (under-16 rejected), verify email, log in, reset password; schema + RLS live; CI-less local build green.

### M2 — Profile & Cards

6. **Geocoding**: `core/api/geocode.ts` — Nominatim search (city → lat/lng, DACH-biased), reverse geocode for "Use my location"; debounce; round coords to 2 decimals before storing. Unit tests for rounding/mapping.
7. **Onboarding step 1**: display name, city (geocoded picker), optional bio → creates `profiles` row (DoB from metadata); `onboarding_complete` gating.
8. **Drawing canvas**: single `DrawingCanvas` component (HTML canvas + perfect-freehand): pen ×3 widths, ~8 preset colors, eraser, undo, clear, rotate; export transparent PNG ≤ 800×800 via `canvas.toBlob`; narrow interface `onExport(pngBlob)` (the one allowed platform-specific island). `core/api/storage.ts` upload to `drawings/{uid}/{uuid}.png`.
9. **Onboarding steps 2–3**: drawing step (skippable → neutral placeholder doodle); "create first card" prompt (skippable).
10. **Cards CRUD**: `core/api/cards.ts` + `cardsStore`; My Cards list (type badge, status, match count); create/edit form: type selection with one-line role explanations, title, description, city (prefilled), radius slider 5–200 km default 50, drawing canvas, visibility toggles (project cards only); pause/reactivate; delete with confirmation → archives its matches (status flip, no row deletes).

**Done when:** full onboarding works end-to-end incl. doodle upload; cards can be created, edited, paused, deleted.

### M3 — Matching

11. **Full `get_deck` RPC** (security definer, validates card ownership): active + not own + matrix-compatible (project toggles respected **in both directions**) + Haversine ≤ min(both radii) + not already swiped + no block either direction; ordered `created_at desc` with small random factor; plain SQL Haversine, **no PostGIS**. SQL test script covering each filter condition.
12. **Swipe recording**: `core/api/swipes.ts` insert (RLS-guarded); match detection happens in the DB trigger; response surfaces whether a match was created (check `matches` after insert, or return from an RPC wrapping both).
13. **Deck UI**: active-card switcher (chips/dropdown); card stack with framer-motion drag gestures + explicit Like/Pass buttons; card layout per §5.4 (drawing header, type badge, title, expandable description, owner name, **age**, **city**, distance rounded to 5 km); empty state suggesting bigger radius / toggles.
14. **Match overlay**: "It's a match" for the completing user with "Say hello" deep link into chat; badge for the counterpart (via realtime `matches` insert subscription).

**Done when:** two test accounts can swipe, match race-safely, and see the overlay/badge.

### M4 — Chat

15. **Matches list**: all matches across the user's cards, labeled by own card, sorted by latest message; counterpart drawing, name, card title, last-message preview, unread badge.
16. **Realtime**: `core/api/realtime.ts` — subscriptions on `messages` (per user's match IDs) and `matches` inserts, behind a callback interface (ports to native unchanged).
17. **Chat screen**: 1:1 text chat (≤ 2000 chars), timestamps, `read_at` set when recipient opens; header shows counterpart card (tap → full card view) + overflow menu (Block / Report); archived matches render read-only.

**Done when:** two accounts chat live in two browsers; unread badges and read state behave.

### M5 — Safety & GDPR

18. **Block**: security-definer RPC — insert block, archive all shared matches; hides both directions everywhere (deck query already filters); no notification to the other side.
19. **Report**: reason text (≤ 1000), targets user and/or card → `reports` table. Moderation via Supabase dashboard only.
20. **Account deletion**: double confirmation → delete own storage folder via storage API → `delete_account()` RPC deletes `auth.users` row → full cascade. Verify with a test account that profiles/cards/swipes/matches/messages/storage are all gone.
21. **Legal pages**: privacy policy, terms, Impressum as static placeholder pages, linked from Settings.
22. **Settings**: edit profile (name, city, bio, redraw doodle), change email/password (Supabase flows), legal links, delete account.
23. **Polish pass**: error handling (network failures, geocode fail, upload fail), loading states, empty states on every screen.

**Done when:** GDPR checklist passes: self-service deletion cascades fully; only schema-listed data collected; legal placeholders live.

### M6 — Beta Hardening

24. **Seed script**: ~30 plausible demo cards across DACH cities (Zürich, Wien, Berlin, München, Hamburg, Basel, Graz, Köln, …) with varied types/radii.
25. **Playwright e2e smoke**: signup → onboard → create card → swipe → match → chat (two browser contexts).
26. **CI + deploy**: GitHub Actions (typecheck, lint, unit tests, build); deploy to Vercel (static); production env vars; final QA against the success metrics instrumentation-wise available in Supabase.

**Done when:** production URL live, e2e green in CI, seeded deck gives new users > 10 cards.

---

## 4. Cross-cutting Rules (from PRD — enforced throughout)

- **Do not "improve" deliberate decisions**: no photos/videos, no category filters, no people search, free for all.
- Age always visible on cards; location shown as city name only; stored coords rounded to ~1 km.
- Swipes/matches are **card-to-card**, never user-to-user; multiple matches between the same two users are legitimate.
- Deleting a card archives its matches (status change, never row deletion); deactivating keeps chats fully usable.
- All authorization via RLS + security-definer RPCs. **No custom server.**
- Deferred (§8) stays deferred: no SMS, no push, no native, no admin UI, no i18n beyond the `de.ts` structure.

## 5. Risks & Watch Items

1. **Region decision** (see §0) — needs product-owner call before beta users sign up.
2. **RLS complexity on `profiles`/`cards`** — mitigated by PRD's own fallback: deck data flows exclusively through `get_deck`; direct selects limited to self + match partners.
3. **Nominatim availability/policy** — fallback documented in PRD: bundled DACH city table; the `geocode.ts` interface keeps the swap local.
4. **Canvas on iOS Safari** — test PNG export + touch drawing early in M2 on a real phone.
5. **Email deliverability** — Supabase's built-in SMTP is heavily rate-limited (~3-4 emails/h); fine for dev, but configure custom SMTP (e.g. Resend) before beta.
