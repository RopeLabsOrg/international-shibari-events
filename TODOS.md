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
