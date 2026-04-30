# TODOs

Items deferred from planning sessions. Add context, not just titles — future-you needs to understand the motivation in 3 months without re-reading the original design doc.

---

## Share-a-ticket-date Worker endpoint (v2)

**What:** Replace the current `mailto:contact@tsurineko.org` flow with a Worker endpoint that accepts the structured form submission and forwards it as a well-formatted email from the server.

**Why:** `mailto:` links fail for users who don't have a configured local mail client — mostly Gmail/Outlook-web users on desktop. At passion scale the lossage is acceptable for v1 but becomes real as the audience grows. A Worker endpoint posts the structured fields to the same `contact@tsurineko.org` inbox and works for every user.

**Pros:** Removes friction for the biggest browser-user cohort. Lets us add light validation (date sanity, URL shape). Keeps human review loop intact (still emails the maintainer, no auto-PR).

**Cons:** Adds one more endpoint, one more Resend send cost per submission, one more piece of the abuse surface (needs Turnstile too).

**Context:** v1 of the reminder backend ships with a `mailto:` button on each event page. The form fields (`ticketSaleDate`, `sourceUrl`, `notes` capped at 500 chars) are already scoped. Upgrade path is to replace the client-side mailto constructor with `POST /api/share-ticket-date` that sends the same structured email server-side.

**Depends on / blocked by:** v1 Worker + Turnstile setup must land first. After that, this is ~2 hours of work.

---

## Confidence classifier thresholds: rebase on edition count or keep on interval count?

**What:** `classifyConfidence(sampleSize)` in `src/lib/predictions.ts` uses *intervals* (`historicalEditions.length - 1`), so 3 editions → sampleSize 2 → "medium" and 4 editions → "high". Decide if that's the right story for contributors/users or if it should rebase on edition count directly.

**Why:** Adversarial review flagged that a contributor looking at an event with 3 past editions would intuitively expect "high confidence" — they'd see 3 years of data. Statistically the interval count is the honest signal (you need ≥2 intervals before the median does anything meaningful), but the label "Estimated · Medium" on an event with 3 historical years reads as unconfident.

**Options:**
- A) Keep as-is, add a one-line note to `CONTRIBUTING.md` explaining the classifier counts intervals not editions.
- B) Rebase thresholds on `historicalEditions.length`: `≥3 → high`, `≥2 → medium`, else low. Matches user intuition; slightly less rigorous but still monotonic.

**Context:** Landed in commit 30f6675. Tests in `tests/confidence.spec.ts` would need to update if we pick B.

---

## WatchlistPage UX for retired/missing slugs

**What:** If a watched slug isn't in the directory (because its event got retired per the slug ledger, or the data file was deleted), `WatchlistPage.vue` silently filters it out and shows a `"{N} watched events are no longer in the directory"` line with no names and no unwatch button. User can't clean up their list.

**Why:** Slug ledger (`data/slug-history.jsonc`) should prevent this in practice — retired slugs stay in the ledger and get moved to `retired`, but the event file goes away. Right now the user's watchlist points at a dead slug with no display affordance.

**Pros of fixing:** Respects the slug-immutability invariant the ledger enforces. Gives users a way to unwatch orphaned slugs without devtools + `localStorage.removeItem`.

**Cons:** The directory doesn't currently retire anything. We may never hit this in practice. Can wait for the first real retirement.

**Options:**
- A) Persist `{slug, displayName, savedAt}` triples instead of bare slugs, so orphaned entries can be shown by name with a per-row unwatch.
- B) Keep slugs only but surface the raw slug in the "no longer in directory" banner with a "Clean up N orphaned slugs" button.
- C) Defer until the first event is actually retired (YAGNI).

**Context:** Flagged by Codex adversarial + Claude adversarial during /ship review of PR (watchlist branch). Both rated medium severity / low-frequency.

---

## Recency-weighted cadence detection

**What:** Weight recent intervals more heavily in the cadence math so an organiser who tightened their rhythm (e.g. biennial → annual) shows up in next-edition predictions faster.

**Why:** Today the algorithm treats a 2010-era biennial cycle as equal evidence to a 2024-era annual cycle. For events that have visibly shifted cadence mid-history, predictions trail reality.

**Pros:** Sharper predictions for evolving events. Aligns with how a human would weight the same data ("the last three editions all happened a year apart, so probably next year too").

**Cons:** Adds a tunable decay parameter without much real-world data to calibrate against. Easy to over-fit on a 14-event dataset. Most current events show stable cadence so the marginal value is small.

**Context:** Open Question #2 in the cancelled-editions design doc deferred this. Lives in `getCadenceAndDuration` (`src/lib/predictions.ts`); ~30 LOC + tests. Pick a recency window (e.g. last N intervals weighted 2x) and verify against the 14-event dataset before shipping.

**Depends on / blocked by:** Cancelled-editions PR (Pezmc/cancelled-editions) lands first.

---

## `cadenceConfidence` label in the prediction provenance panel

**What:** Expose a "high / medium / low" cadence-confidence label in the provenance pills on the event detail page, based on whether `detectBaseCadence` succeeded with N≥3 intervals (high), fell back to median (medium), or used the default cadence (low).

**Why:** CLAUDE.md says the product principle is "confidence and provenance on every date." Today the provenance panel shows `sampleSize` (a number) but users can't tell whether the prediction is the algorithm's strong opinion or a wild guess from one data point.

**Pros:** Closes the gap on the stated product principle. The signal already exists inside the algorithm; just needs to be returned and rendered. ~10 LOC. The closest-to-free-shipping follow-up of the three.

**Cons:** Three labels is coarse; richer (e.g. percentile uncertainty) would be better but more code. May commit us to a label vocabulary that's hard to evolve.

**Context:** Open Question #2 in the cancelled-editions design doc. Add to the `IPredictionInfo` interface in `src/lib/predictions.ts` (probably as `cadenceConfidence: "high" | "medium" | "low"`), set the value at the same place the cadence is determined in `getCadenceAndDuration`, render as a fourth (or fifth) pill in `EventPage.vue`'s provenance `<ul>`.

**Depends on / blocked by:** Cancelled-editions PR (Pezmc/cancelled-editions) lands first; that PR introduces the `detectBaseCadence` return signal.

---

## Mobile-friendly historical-editions row layout

**What:** Below 640px, replace the horizontal-scroll `<table>` on `EventPage.vue` with a card-stacked layout per edition that prioritises Dates and Notes (the two columns users actually look at). Cancelled rows render as a smaller, muted card.

**Why:** Today the `<table>` at `EventPage.vue:131-154` uses `min-w-[640px]` with `overflow-x-auto`, forcing horizontal scroll on phones to display columns mostly containing "Unknown" and em dashes. Once cancellations land, the most-clicked content (the Notes cell with `externalSourceNotes`) sits in the rightmost column and mobile users miss it.

**Pros:** Mobile users see the actually-useful columns first. Cancelled rows still distinguishable visually. Deeper alignment with DESIGN.md voice ("let the facts do the work").

**Cons:** Real surgery on a working table. Adds two layouts to maintain (table on desktop, cards on mobile, or one CSS-grid layout that responds). Component-level test coverage needed across both viewports. Affects every event detail page, not just events with cancellations.

**Context:** Surfaced in plan-design-review Pass 6 of the cancelled-editions branch (2026-04-27). Rated 5→8 with this deferred; reaching 10/10 needs this work. Affects every event detail page on mobile, not only events with cancellations — so the value is broader than the cancellations PR alone.

**Depends on / blocked by:** Cancelled-editions PR (Pezmc/cancelled-editions) lands first; the new cancelled-row treatment is the strongest signal that the existing layout under-serves mobile.
