# Combo

Swipe-basierte Matching-Plattform für kreative Nebenprojekte (siehe `PRD.md`).

## Stack

React 18 + TypeScript + Vite + Tailwind CSS · Zustand · Supabase (Postgres, Auth, Realtime, Storage) · kein eigener Server.

## Setup

```bash
npm install
cp .env.example .env.local   # Anon-Key eintragen (Supabase Dashboard → API Keys)
npm run dev
```

Migrationen liegen in `supabase/migrations/` und werden über das Supabase-Dashboard/MCP angewendet (kein lokaler Stack nötig).

## Architektur

- `src/core/` — plattformneutral (kein DOM, kein react-dom, kein Router). Typen, Supabase-API-Aufrufe, reine Logik, Zustand-Stores. Wird von einer späteren React-Native-App unverändert wiederverwendet. Erzwungen per ESLint-Regel (`eslint.config.js`).
- `src/ui/` — Web-Komponenten, Canvas, i18n (`ui/i18n/de.ts`, alle UI-Strings).
- `src/pages/` — Routen-Komposition (React Router).

Der Supabase-Client wird via `initSupabase(url, key)` aus `main.tsx` initialisiert, damit `core/` keine Vite-spezifischen `import.meta.env`-Zugriffe enthält.

## Entscheidungslog

| Datum | Entscheidung |
|---|---|
| 2026-07-04 | **DB-Region: Zürich (eu-central-2)** statt Frankfurt — Entscheid Product Owner. Schweiz hat EU-Angemessenheitsbeschluss, DSGVO-konform. |
| 2026-07-04 | Deck-Radius: zunächst beidseitig (kleinerer der beiden `radius_km`-Werte), noch am selben Tag gemäss PRD §10.2 auf **Swiper-Radius** umgestellt (Migration `0004`) — der beidseitige Radius führte im Beta-Test zu unerwartet leeren Decks. |
| 2026-07-04 | Geocoding: **Nominatim** (OpenStreetMap), DACH-gefiltert, debounced (≤ 1 req/s), Koordinaten auf 2 Dezimalstellen gerundet (~1 km) gespeichert. Fallback laut PRD wäre eine gebündelte Städte-Tabelle. |
| 2026-07-04 | Match-Erzeugung: DB-Trigger auf `swipes` mit `pg_advisory_xact_lock` auf das Kartenpaar → race-sicher. |
| 2026-07-04 | Versionen bewusst konservativ gepinnt: React 18, Vite 5, Tailwind 3, Router 6, Zustand 4 (Stabilität vor Neuheit). |

## Vor dem Beta-Launch (manuell zu erledigen)

- [ ] Supabase Auth: Site-URL + Redirect-URLs auf die Produktions-Domain stellen (Dashboard → Authentication → URL Configuration).
- [ ] Eigenes SMTP konfigurieren (z. B. Resend) — das eingebaute Supabase-SMTP ist auf wenige Mails/Stunde limitiert.
- [ ] Rechtstexte (Datenschutz, AGB, Impressum) vom Product Owner einsetzen (`src/pages/legal/`).
