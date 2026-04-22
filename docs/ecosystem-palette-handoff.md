# Ecosystem palette handoff

Shared visual language across the three-part rope-scene ecosystem:

- **Tsuri Neko** (`tsurineko.org`) — rope product sales
- **International Shibari Events** (`shibari-events.org`) — event discovery *(this repo)*
- **RopeLabs** (`ropelabs.org`) — teaching

ISE is the reference implementation. This doc is what you hand to TN / RopeLabs so they can pick up the palette without re-deriving it.

---

## Two-tier linkage

| Pair | Relationship | Why |
|---|---|---|
| TN ↔ ISE | **Strongly linked** — near-identical palette | Both serve *discovery/catalog* mode. Users flip between "what's next" and "where do I get jute" in one mental register. Visual seam should be invisible. |
| RopeLabs ↔ ISE | **Loosely linked** — same family, shifted accent | Teaching is a different emotional register (warmer, more approachable) than catalog. Needs its own accent while keeping shared anchors. |

**Shared anchors across all three:** kinari page (`#f7f3ea`), sumi-indigo ink (`#1a2332`), indigo secondary (`#2c4a6b`).

**Distinct axis:** the accent color. TN copies ISE's kakiiro persimmon. RopeLabs shifts to a warmer/softer teaching tone.

---

## The palette (ISE, committed)

Japanese craft references — not fetish cliché. Kakiiro (柿色) is the actual dye color of aged jute rope. Sumi (墨) is the ink of calligraphy. Kinari (生成り) is unbleached cotton/paper.

```css
:root {
  --color-page: #f7f3ea;                      /* kinari — unbleached cream */
  --color-surface: rgba(255, 255, 255, 0.92);
  --color-surface-strong: #ffffff;
  --color-text: #1a2332;                      /* sumi — near-black indigo */
  --color-muted: #5a6372;                     /* WCAG AA on kinari (4.5:1+) */
  --color-border: rgba(26, 35, 50, 0.14);
  --color-primary: #c2562a;                   /* kakiiro — persimmon/jute */
  --color-primary-hover: #a84620;
  --color-secondary: #2c4a6b;                 /* aizome — indigo */
  --color-highlight: #c2562a;
  --color-danger: #8a2a2a;
  --color-success: #5f6b3a;                   /* matcha */
  --color-focus: #2c4a6b;
}

body {
  background: radial-gradient(circle at top, #fbf8f0 0%, var(--color-page) 60%);
  color: var(--color-text);
}

a { color: var(--color-secondary); }
a:hover { color: var(--color-primary); }

:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

Contrast verified: body text ~15:1, muted ~5.8:1. Both pass WCAG AA.

---

## Tsuri Neko — adopt 1:1

**Action:** copy the block above verbatim. No changes.

**Why:** TN and ISE share the discovery/catalog job. The palette was designed with rope craft in mind (kakiiro *is* rope-dye color) — it belongs on TN at least as much as it belongs on ISE. Adopting 1:1 is the correct move, not lazy reuse.

**Watch-outs:**
- TN likely has more product-photography surface than ISE. Make sure `--color-page` cream doesn't fight rope photography. If it does, nudge surface cards to pure `#ffffff` before touching the page color.
- If TN has a cart/checkout flow, keep `--color-primary` (persimmon) for the primary CTA — it reads as "act now" without being aggressive.

---

## RopeLabs — shift the accent axis

**Keep:** `--color-page`, `--color-text`, `--color-secondary`, `--color-muted`, `--color-border`, `--color-surface*`, `--color-focus`. Same anchors as ISE/TN.

**Change:** swap `--color-primary` from persimmon to a warmer/softer teaching tone.

**Recommended candidate: matcha `#5f6b3a`** (currently ISE's `--color-success`). Reasons:
- Green reads "growth / learning" without drifting off-family.
- Already validated — it's been living in the ISE palette and works next to sumi-indigo and kinari.
- Half the work is done; you can lift the exact token.

**Alternative to test:** a warmer clay/terracotta (e.g. `#b07a4a`) if you want RopeLabs to feel more human-handmade vs. ISE's catalog-crisp. Do a quick swatch test before committing — matcha is the safe default.

**Suggested RopeLabs `:root` (matcha variant):**

```css
:root {
  --color-page: #f7f3ea;
  --color-surface: rgba(255, 255, 255, 0.92);
  --color-surface-strong: #ffffff;
  --color-text: #1a2332;
  --color-muted: #5a6372;
  --color-border: rgba(26, 35, 50, 0.14);
  --color-primary: #5f6b3a;                   /* matcha — teaching accent */
  --color-primary-hover: #4d5730;
  --color-secondary: #2c4a6b;
  --color-highlight: #5f6b3a;
  --color-danger: #8a2a2a;
  --color-success: #5f6b3a;                   /* same as primary — OK */
  --color-focus: #2c4a6b;
}
```

Note: when primary and success collapse to the same color, that's a signal to drop `--color-success` entirely and lean on iconography / copy for success states. Don't fight it.

---

## Shared tokens package — not yet

Tempting to extract a `@ropelabs/tokens` npm package. **Don't, yet.**

**Why wait:** copy-paste across three repos is cheaper than a package until TN has actually adopted the palette *and* RopeLabs has its accent finalized. Premature extraction locks in shape before you know what actually diverges (the accent) vs. what's truly shared (everything else).

**Revisit trigger:** when all three properties are live on the new palette and you're about to make the *third* coordinated token change. That's when the package starts paying for itself.

---

## Commit reference

ISE palette lands in commit `0a04cb2` on branch `Pezmc/office-hours-review`. Files:
- `src/styles.css` — token definitions
- `src/components/EventCard.vue` — shadow + estimated-badge color update
- `src/components/DateField.vue` — estimated-badge color update

If you need to see the palette in use, that branch is the reference.
