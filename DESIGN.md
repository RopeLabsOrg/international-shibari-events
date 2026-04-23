# shibari-events.tsurineko.org — Design System (local mirror)

Synced from the rope-sites umbrella `DESIGN.md` on 2026-04-22.

This site is the **reference implementation** of the Tsuri Neko kakiiro
palette. In practice that means when tokens drift between the umbrella and
child repos, this one wins on pragmatic questions ("does this look right
next to real content?") — but on canonical token values, the umbrella
`DESIGN.md` is still the source of truth. If a change lands here first,
propagate it to the umbrella same day.

---

Shared across the full five-site rope ecosystem: `tsurineko.org`,
`shop.tsurineko.org`, `shibari-events.tsurineko.org` *(this repo)*,
`ropelabs.org`, and `ropelabs.be`.

**Palette philosophy:** Japanese craft references — not fetish cliché.
Kakiiro (柿色) is the actual dye color of aged jute rope. Sumi (墨) is
calligraphy ink. Kinari (生成り) is unbleached cotton/paper.

## Tokens

```css
:root {
  --color-page: #f7f3ea;                       /* kinari — unbleached cream */
  --color-surface: rgba(255, 255, 255, 0.92);
  --color-surface-strong: #ffffff;             /* use when photography needs crisp card */
  --color-text: #1a2332;                       /* sumi — near-black indigo */
  --color-muted: #5a6372;                      /* WCAG AA on kinari (4.5:1+) */
  --color-border: rgba(26, 35, 50, 0.14);
  --color-primary: #c2562a;                    /* kakiiro — persimmon/jute (CTAs) */
  --color-primary-hover: #a84620;
  --color-secondary: #2c4a6b;                  /* aizome — indigo (links) */
  --color-highlight: #c2562a;
  --color-danger:  #8a2a2a;
  --color-success: #5f6b3a;                    /* matcha */
  --color-focus:   #2c4a6b;
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

**Contrast verified:** body text ~15:1, muted ~5.8:1. Both pass WCAG AA.

**PR rule:** no raw hex in Vue templates. Every new color references a
token. Known debt: `src/components/StatusPill.vue` still carries raw hex
from before the palette landed. Fix on touch; don't add more.

## Surfaces

- **Card:** `bg: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  backdrop-filter: blur(6px); padding: 2rem;`
- **Card (photography):** use `--color-surface-strong: #ffffff` when a
  photo's contrast is at risk against kinari.
- **Button:** `border-radius: 14px; padding: 0.75rem 1rem;` hover lifts
  `translateY(-1px)`. Respect `prefers-reduced-motion`.

## Typography

- **Family:** `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
- **Scale:** h1 2rem, h2 1.5rem, h3 1.15rem, body 1rem, small 0.75rem
- **Leading:** 1.6

## Spacing & layout

- 8px grid
- `--max-content-width: 720px` for text-heavy pages
- `--max-grid-width: 1040px` for event listings
- Between-card rhythm: `space-y-8` mobile, `space-y-12` desktop

## Voice rules

**Do:**
- Dry, concrete, Belgian/British understatement
- Event listings: dates, venue, language, link. Let the facts do the work.

**Don't:**
- Emoji, exclamation marks, chatbot-tone
- Testimonial widgets, rating stars, attendance counters
- Hero carousels

## Iconography

- **Library:** Heroicons outline
- **Color:** `var(--color-text)` by default; `var(--color-primary)` on CTAs
- Do not mix icon families

## Accessibility baseline

- Tap targets ≥ 44×44px
- Focus ring via `--color-focus`, visible on all interactive elements
- `prefers-reduced-motion: reduce` disables hover lifts and transitions
- `prefers-reduced-transparency: reduce` swaps `--color-surface` to
  `--color-surface-strong`
- Alt text describes the thing, not "photo of thing"

## Site-specific accents

| Site | Primary | Register |
|---|---|---|
| tsurineko.org | kakiiro `#c2562a` | Brand / catalog |
| shop.tsurineko.org | kakiiro `#c2562a` | Commerce CTA |
| **shibari-events.tsurineko.org (this repo)** | **kakiiro `#c2562a`** | **Event discovery / catalog — reference implementation** |
| ropelabs.org | matcha `#5f6b3a` | Teaching (international) |
| ropelabs.be | matcha `#5f6b3a` | Standalone Belgian presence (non-shibari) |

See the umbrella `docs/ecosystem.md` for the full strong/loose-link model.
