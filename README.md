# International Shibari Events

A community-maintained directory of international shibari events with runtime-derived next-edition predictions, confidence and provenance on every date, and a buyer-guide browse UX.

Static Vue 3 + Vite + TypeScript + Tailwind 4 SPA on GitHub Pages, backed by JSONC files under `data/events/`. A daily GitHub Action refreshes statuses and opens maintainer reminder issues when data looks stale.

## Quickstart

```bash
npm install
npm run dev              # local dev server
npm run validate:data    # schema + slug-ledger check for data/events/
npm run typecheck        # tsc + vue-tsc
npm test                 # vitest
```

CI runs the same checks. The PR template walks through them — see `.github/PULL_REQUEST_TEMPLATE.md`.

## Adding or editing an event

1. Copy `data/event-template.jsonc` to `data/events/<slug>.jsonc`. The filename MUST equal the `slug` field inside.
2. Fill in every field. Use `null` for unknowns; do not omit keys.
3. Append your new slug to the `active` array in `data/slug-history.jsonc`. Slugs are immutable once shipped — renaming one silently breaks users' saved watchlists.
4. Run `npm run validate:data` — errors point at the offending line with a concrete fix hint.
5. Open a PR; check each box in the PR template.

Full contributor guide: [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Contributor map

| Area | Where to look |
| --- | --- |
| Product decisions, prediction rules, sort order | `docs/website-architecture-and-product-decisions.md` |
| Event schema | `schemas/event.schema.ts` |
| Event data | `data/events/*.jsonc` + `data/event-template.jsonc` |
| Slug-immutability ledger | `data/slug-history.jsonc` |
| Prediction logic | `src/lib/predictions.ts` |
| Event ingestion | `src/lib/events.ts` |
| Pages & components | `src/pages/`, `src/components/` |
| Daily status refresh | `scripts/update-statuses.ts`, `.github/workflows/daily-status.yml` |
| Data validator | `scripts/validate-events.ts` |
| Worker (reminder emails, v1) | `worker/` — see `worker/.dev.vars.example` for required secrets |
| Deferred work | `TODOS.md` |

## Ecosystem

This site is the discovery layer for a three-part rope-scene ecosystem: [RopeLabs](https://ropelabs.org/) (teaching) and [Tsuri Neko](https://tsurineko.org/) (rope sales). Keep transactional (event reminders) and marketing (ecosystem cross-promotion) consent strictly separate — never conflate the two in email flows or data capture.
