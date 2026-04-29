# Contributing

Thanks for helping maintain this directory. Most contributions are data updates: a new event, a confirmed ticket-sale date, a status change. This guide covers what you need to know.

## Setup

```bash
npm install
```

That's it. Node 20+ and npm are the only requirements. Before every PR, run:

```bash
npm run validate:data
npm run typecheck
npm test
```

## Adding a new event

1. **Create the file.** Copy `data/event-template.jsonc` to `data/events/<slug>.jsonc`. The filename MUST equal the `slug` field inside — the validator enforces both shapes (`^[a-z0-9]+(-[a-z0-9]+)*$`).
2. **Fill every field.** The template marks every key as required. For unknown values, use `null` — never omit a key. The validator rejects both missing keys and extra keys.
3. **Append to the slug ledger.** Open `data/slug-history.jsonc` and append your new slug to the `active` array. See "Slugs are load-bearing" below.
4. **Validate locally.** `npm run validate:data`. Errors include the file, line, column, and a hint pointing at the template.
5. **Open a PR.** The PR template has a 6-point checklist covering the above.

## Updating an existing event

- Bump `lastUpdated` to today's ISO date (YYYY-MM-DD).
- If an edition has concluded, move its dates from `nextEdition` into a new entry in `historicalEditions` (most recent first is the convention).
- If tickets opened, set `nextEdition.ticketSaleDate` and `nextEdition.status` to `on_sale`.
- If tickets sold out, set `nextEdition.status` to `sold_out` and record the `soldOutDate` in `historicalEditions` when the edition ends.
- Use `null` for fields you can't confirm. Speculation belongs in prediction logic (runtime-derived), not in data.

## Slugs are load-bearing

Users save events via a Watch button backed by `localStorage`. The slug is the identifier. If you rename a slug, every watchlist that referenced it silently breaks — there is no migration, no warning, nothing.

Rules:

- A slug currently in `data/events/*.jsonc` must appear in `data/slug-history.jsonc` under `active`.
- To retire an event, MOVE its slug from `active` to `retired` (do not delete).
- Never re-use a retired slug for a different event.
- If you notice a typo in a slug you just opened a PR for and it HAS NOT hit `main`, rename freely. If it has shipped, ship a fix instead and keep the old slug in `retired` forever.

The validator enforces every active slug appears in the ledger and flags filename/slug mismatches.

## Statuses

Top-level `status` and `nextEdition.status` use the same enum:

| Value | Meaning |
| --- | --- |
| `tba` | No public details yet |
| `scheduled` | Dates public, tickets not yet on sale |
| `on_sale` | Tickets available |
| `waiting_list` | Sold out, waitlist open |
| `sold_out` | Sold out, no waitlist |

Temporal state (`happening_now`, `upcoming`, `ended`) is derived at runtime from dates — do not store it.

## Dates & predictions

Dates are ISO-8601 (YYYY-MM-DD). URLs are absolute (`https://…`) or `null`.

The site derives `nextEdition` predictions at runtime from `historicalEditions` when confirmed values are missing. For the prediction to be useful:

- Record every historical edition you can confirm, with as much date detail as possible (`announcementDate`, `ticketSaleDate` are especially valuable).
- Put the source (FetLife event ID, official page URL, discussion permalink) in `sourceNotes`. This is what lets a future reviewer trust or correct the record.

Prediction rules live in `src/lib/predictions.ts` and are spec'd in `docs/website-architecture-and-product-decisions.md`. If you change the algorithm, add a backtest in `tests/` and note the delta in your PR.

### Cancelled or skipped editions (optional)

When you know an edition was cancelled or skipped (organiser announcement, FetLife post, mailing list note), record it in the optional `cancelledEditions` array. Each entry is `{ year, sourceNotes }`. The site uses these entries two ways:

1. **Timeline display.** The cancelled year renders in the historical-editions table interleaved chronologically with held editions, struck through and muted, with your `sourceNotes` next to it.
2. **Cadence sharpening.** The prediction algorithm treats a known cancelled year as a real period in the cadence, so an annual event with one cancellation no longer mispredicts the next edition halfway between two real years.

Year-based metadata only supports annual events. The validator rejects entries that match a held edition's year, fall outside the held-edition range, or sit in a gap that does not fit an annual cadence (e.g. between two biennial editions). If you need biennial or sub-annual cancellation support, open an issue.

## Running the Worker (reminder emails)

The email-reminder backend lives in `worker/`. Required secrets are documented in `worker/.dev.vars.example`. You do not need the Worker running for frontend or data work — the site is fully static otherwise.

## Where things live

| Area | Path |
| --- | --- |
| Schema | `schemas/event.schema.ts` |
| Template | `data/event-template.jsonc` |
| Ledger | `data/slug-history.jsonc` |
| Validator | `scripts/validate-events.ts` |
| Status refresh | `scripts/update-statuses.ts` |
| Prediction logic | `src/lib/predictions.ts` |
| Ingestion | `src/lib/events.ts` |
| Architecture | `docs/website-architecture-and-product-decisions.md` |
| Deferred work | `TODOS.md` |

## Style

- Never include identifying personal data beyond what organizers publish themselves.
- Keep `sourceNotes` factual and short. Cite the URL or FetLife event ID; do not editorialize.
- Do not add fields outside the schema. If you think one is needed, open a discussion first.
