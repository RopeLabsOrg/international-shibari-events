# Website Architecture and Product Decisions

This file is the persistent source of truth for agreed architecture and product behavior decisions while building the website.

## Product Scope

- Site style follows a buyer-guide pattern inspired by MacRumors:
  - list view with sortable cards,
  - detail view with confidence/provenance data,
  - clear status and timeline signals.
- Runtime is a static client-side SPA for GitHub Pages.
- Initial routes:
  - `/`: Home event guide listing.
  - `/events/:slug`: Event detail page.

## Design Decisions

- Visual direction uses rope-inspired accents with:
  - primary color: rose (`--color-primary`),
  - secondary color: lighter rose (`--color-secondary`),
  - dark neutral background for high contrast.
- Statuses are always shown as high-contrast pills/cards.
- Estimated dates are always explicitly labeled as `Estimated`.

## Data Contract and Source of Truth

- Canonical event contract remains in `schemas/event.schema.ts`.
- Data source is `data/events/*.jsonc` (one file per event).
- Frontend ingests JSONC directly with `import.meta.glob(..., { eager: true })` and parses via `jsonc-parser`.
- Business statuses stored in data:
  - `scheduled`, `on_sale`, `sold_out`, `waiting_list`, `tba`.
- Temporal state is derived at runtime from dates:
  - `happening_now`, `upcoming`, `ended`.

## Sorting Semantics

Home listing supports sorting by:

1. `eventDate`
   - confirmed dates first,
   - then estimated dates,
   - then missing dates.
2. `ticketDate`
   - confirmed dates first,
   - then estimated dates,
   - then missing dates.
3. `status`
   - priority: `on_sale`, `waiting_list`, `scheduled`, `sold_out`, `tba`.
4. `lastUpdated` (most recent first).
5. `name` (A-Z).

## Prediction Rules

- Every event detail page must show two forward-looking editions:
  - next/current edition from `nextEdition` confirmed fields + runtime prediction fallback,
  - following forecasted edition computed from historical cadence.
- Following-edition forecast algorithm:
  - cadence days = median interval between historical start dates,
  - duration days = median historical duration,
  - fallback cadence = 180 days,
  - fallback duration = 3 days.
- Forecast ticket and announcement dates are inferred from offsets before forecast start date.

## Event Detail Requirements

Each event detail page displays:

- strong business status marker,
- derived temporal state marker,
- current/next edition block,
- following predicted edition block,
- prediction provenance:
  - cadence,
  - duration,
  - sample size,
  - source notes from historical editions,
- historical editions table,
- direct links for website, FetLife, mailing list, and contact email when present.

## Validation and Automation Decisions

- `scripts/validate-events.ts` validates all event JSONC files against `EVENT_SCHEMA`.
- `scripts/update-statuses.ts` keeps deterministic statuses updated and builds reminder payloads.
- Daily automation workflow remains in `.github/workflows/daily-status.yml`.
- Build must run `npm run validate:data` before site bundling.

## Historical Evidence Capture Standard

- Goal: keep timeline fields useful for prediction while avoiding fabricated certainty.
- For each edition entry in `historicalEditions`, prefer this order:
  1. official event/ticket pages,
  2. event archive pages,
  3. user-provided community sources (including FetLife dumps).
- Fill only values that are explicitly evidenced:
  - if a date is not explicit, keep it `null`,
  - if the edition is known but timeline dates are unclear, store only `startDate`/`endDate`.
- Always include provenance in `sourceNotes` with:
  - source URL or source label,
  - short extraction note (for example, "ticket drop date explicitly stated").

### FetLife Raw Dump Normalization

- Expected raw input per item:
  - event name/slug,
  - post or event link,
  - visible timestamp/date,
  - copied text snippet (announcement, ticket-open, sold-out signal).
- Normalization rules into JSONC fields:
  - announcement text -> `announcementDate`,
  - "tickets live/open/registration open" -> `ticketSaleDate`,
  - "sold out/waiting list only" -> `soldOutDate` when date is explicit.
- If timing language is relative ("tomorrow", "next Friday"), do not infer without a post timestamp.
- When uncertainty remains after normalization, store `null` and explain ambiguity in `sourceNotes`.

## Working Agreement for Ongoing Sessions

- Make small, atomic commits following gitmoji conventions.
- Keep data provenance explicit in `historicalEditions[].sourceNotes`.
- Keep uncertain/unverified events in catalog with conservative `tba` status and runtime-derived estimates instead of removing them.
- Extend features incrementally after each baseline milestone (sorting/filtering, saved preferences, region filters, reminder exports).

## Next Feature Backlog (Post-Baseline)

- Filters: country, month, status.
- "Watchlist" in local storage for favorite events.
- Confidence badges (`high`, `medium`, `low`) for predicted dates.
- Dedicated "ticket watch" view sorted by next ticket window.

