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
