# International Shibari Events

A static, community-driven directory of international shibari events.
Runtime-derived predictions of next editions, confidence and provenance on
every date, and a buyer-guide browse UX inspired by MacRumors.

**Stack:** Vue 3 + Vite + TypeScript + Tailwind 4 + Vitest. Hosted on GitHub
Pages. Data lives as JSONC files per event in `data/events/`. Daily GitHub
Action (`daily-status.yml`) updates statuses and opens maintainer reminder
issues.

**Source of truth docs:** `docs/website-architecture-and-product-decisions.md`.

**Writing voice:** canonical voice + topic-placement reference for all
rope-sites copy lives at `../docs/writing-style.md`. Read it before
drafting any editorial content. This site is data-led with a plain
functional voice; editorial recommendations on individual events
belong on `tsurineko.org`, not here.

**Ecosystem context:** this site is the discovery layer in a five-site rope
ecosystem run under the Tsuri Neko banner. CNAME is
`shibari-events.tsurineko.org`; the repo lives under the `tsurineko.org`
subdomain family. Siblings:

- `tsurineko.org` — main content (teaching, jams, classes)
- `shop.tsurineko.org` — e-commerce (rope + safety scissors)
- `ropelabs.org` — RopeLabs international teaching (matcha accent family)
- `ropelabs.be` — standalone Belgian wellness/movement surface (non-shibari;
  do not cross-link or mirror content in either direction)

Keep transactional (event reminders) and marketing (ecosystem cross-promotion)
consent strictly separate — never conflate the two in email flows or data
capture.

## Design language

This site is the **reference implementation** of the Tsuri Neko kakiiro
palette. Canonical tokens live in the umbrella `DESIGN.md`; this repo's
local `DESIGN.md` mirrors it with a dated sync note and is the day-to-day
reference for contributors.

- Accent: **kakiiro `#c2562a`** — persimmon/jute, shared across the three
  Tsuri Neko family sites.
- `src/styles.css` carries the `:root` token block.
- Known migration debt: `src/components/StatusPill.vue` (and possibly a
  couple of siblings) still contain raw hex values from before the palette
  landed. New components must go through tokens.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. The
skill has multi-step workflows, checklists, and quality gates that produce better
results than an ad-hoc answer. When in doubt, invoke the skill. A false positive is
cheaper than a false negative.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke /office-hours
- Strategy, scope, "think bigger", "what should we build" → invoke /plan-ceo-review
- Architecture, "does this design make sense" → invoke /plan-eng-review
- Design system, brand, "how should this look" → invoke /design-consultation
- Design review of a plan → invoke /plan-design-review
- Developer experience of a plan → invoke /plan-devex-review
- "Review everything", full review pipeline → invoke /autoplan
- Bugs, errors, "why is this broken", "wtf", "this doesn't work" → invoke /investigate
- Test the site, find bugs, "does this work" → invoke /qa (or /qa-only for report only)
- Code review, check the diff, "look at my changes" → invoke /review
- Visual polish, design audit, "this looks off" → invoke /design-review
- Developer experience audit, try onboarding → invoke /devex-review
- Ship, deploy, create a PR, "send it" → invoke /ship
- Merge + deploy + verify → invoke /land-and-deploy
- Configure deployment → invoke /setup-deploy
- Post-deploy monitoring → invoke /canary
- Update docs after shipping → invoke /document-release
- Weekly retro, "how'd we do" → invoke /retro
- Second opinion, codex review → invoke /codex
- Safety mode, careful mode, lock it down → invoke /careful or /guard
- Restrict edits to a directory → invoke /freeze or /unfreeze
- Upgrade gstack → invoke /gstack-upgrade
- Save progress, "save my work" → invoke /context-save
- Resume, restore, "where was I" → invoke /context-restore
- Security audit, OWASP, "is this secure" → invoke /cso
- Make a PDF, document, publication → invoke /make-pdf
- Launch real browser for QA → invoke /open-gstack-browser
- Import cookies for authenticated testing → invoke /setup-browser-cookies
- Performance regression, page speed, benchmarks → invoke /benchmark
- Review what gstack has learned → invoke /learn
- Tune question sensitivity → invoke /plan-tune
- Code quality dashboard → invoke /health

## gstack (recommended)

This project uses [gstack](https://github.com/garrytan/gstack) for AI-assisted workflows.
Install it for the best experience:

```bash
git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup --team
```

Skills like /qa, /ship, /review, /investigate, and /browse become available after install.
Use /browse for all web browsing. Use ~/.claude/skills/gstack/... for gstack file paths.

## GBrain Search Guidance (configured by /sync-gbrain)
<!-- gstack-gbrain-search-guidance:start -->

GBrain is set up and synced on this machine. The agent should prefer gbrain
over Grep when the question is semantic or when you don't know the exact
identifier yet.

**This repo is pinned** to `shibari-events-tsurineko-org` via the `.gbrain-source` file in
the repo root (kubectl-style context). Any `gbrain code-def`, `code-refs`,
`code-callers`, `code-callees`, or `query` call from anywhere under this
worktree routes to that source by default — no `--source` flag needed. Pass
`--source <id>` to scope a query to a sibling repo.

Seven rope-sites sources are indexed (markdown + code where applicable):

| Source ID | Path | Pages |
| --- | --- | --- |
| `rope-sites-umbrella` | umbrella docs (`docs/` + root CLAUDE.md/DESIGN.md/README.md) | ~6 |
| `tsurineko-org` | tsurineko.org | ~45 |
| `shop-tsurineko-org` | shop.tsurineko.org | ~208 |
| `shibari-events-tsurineko-org` | shibari-events.tsurineko.org | ~28 |
| `ropelabs-org` | ropelabs.org | ~22 |
| `ropelabs-be` | ropelabs.be | ~10 |
| `project-nawa` | project-nawa (rope app) | ~239 |

Prefer gbrain when:
- "Where is X handled?" / semantic intent, no exact string yet:
    `gbrain search "<terms>"` or `gbrain query "<question>"`
- "Where is symbol Y defined?" / symbol-based code questions:
    `gbrain code-def <symbol>` or `gbrain code-refs <symbol>`
- "What calls Y?" / "What does Y depend on?":
    `gbrain code-callers <symbol>` / `gbrain code-callees <symbol>`
- Cross-ecosystem semantic questions ("which sites mention kuwairo?"):
    `gbrain search "kuwairo"` — federated default surfaces all 7 sources

Grep is still right for known exact strings, regex, multiline patterns, and
file globs. Run `/sync-gbrain` after meaningful code changes; for ongoing
auto-sync across all worktrees, run `gbrain autopilot --install` once per
machine — gbrain's daemon handles incremental refresh on a schedule.

<!-- gstack-gbrain-search-guidance:end -->