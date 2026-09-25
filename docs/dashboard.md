# Dashboard Spec — Guardrail-Driven Test Results

Status: Ready to implement
Depends on: Part 2 variants (control + 3 variant files), Part 2
write-up (guardrail definitions per test), and the updated
styles/tokens.css (navy accent + Space Grotesk headings).

## Purpose

A standalone growth dashboard (`dashboard.html`) presenting the 3 Part 2
A/B tests as a guardrail-driven analysis, not a metrics display. The
point is to show the guardrail KPI catching or confirming what the
primary KPI implies — including cases where the primary metric looks
like a win and the guardrail says otherwise. Simulated data only; there
is no live traffic yet. no backend. 

Scope is intentionally cut for time: Simulated mode only, one
comparative funnel view, one decision row per test. No "Live" mode
reading real tracking.js events, no extra charts, no additional pages —
see "Rejected / deferred" below.

---

## Data (fixed — do not recalculate or invent new numbers)

### Baseline / control funnel
(from `write-up-part1.md`'s funnel model)

| Transition | Rate |
|---|---|
| Visit → Quiz start | 72% |
| Quiz start → Completion | 65% |
| Completion → Result | 92% |
| Result → Account created | 42% |
| **Modeled overall CVR** | **18.1%** |

### Test 1 — Gate after Q4
**File**: `variant-1-gate-after-q4.html`
**Primary KPI**: gate-reached → account-created rate = **55%** (vs.
control's Result→Account of 42%)
**Guardrail KPI**: drop-off in the 2 questions immediately following
the gate (Q5–Q6) = **21%** (vs. ~12% expected from control's average
per-question drop-off)
**Read**: guardrail rises alongside the primary metric — the sunk-cost
effect may be masking a flow-break rather than confirming the
hypothesis, exactly the risk flagged in the Part 2 write-up.
**Decision**: **INCONCLUSIVE**. The primary KPI measures a different
funnel span than control's (gate→account vs. full result→account), so
it isn't apples-to-apples, and the guardrail spike suggests the lift
may be inflated by pressure rather than genuine intent. Recommend
re-measuring as full visit→account CVR before shipping.

### Test 2 — Shorter quiz (5 questions)
**File**: `variant-2-shorter-quiz.html`
**Primary KPI**: quiz start → completion rate = **77%** (vs. control's
65%)
**Guardrail KPI**: result → account-created rate = **33%** (vs.
control's 42% — a drop)
**Net effect**: full funnel CVR = 72% × 77% × 92% × 33% ≈ **16.8%**,
vs. the 18.1% control baseline — lower, despite the primary metric
looking like a clear win. Show this multiplication explicitly on the
card.
**Decision**: **KILL**. The guardrail catches exactly what it's for:
completion went up, but the "thinner"-feeling result (fewer category
data points) hurt conversion enough to make the net funnel worse than
control.

### Test 3 — Percentile framing
**File**: `variant-3-percentile-framing.html`
**Primary KPI**: result → account-created rate = **47%** (vs. control's
42%)
**Guardrail KPI**: time-on-screen before click = **9s** (vs. control's
14s)
**Net effect**: full funnel CVR = 72% × 65% × 92% × 47% ≈ **20.2%**, vs.
the 18.1% baseline — a genuine lift.
**Decision**: **SHIP**. Both primary and net CVR improve. The shorter
time-on-screen is a secondary watch-item (faster, more impulsive click)
worth monitoring post-launch, not a reason to hold the ship decision.

---

## Layout

1. **Banner**, top of page: "Simulated data — no live traffic yet."
   Same visual weight as the rest of the page — not hidden or subtle.
2. **Funnel comparison**: one row per test, each showing control vs.
   that test's specific primary + guardrail numbers. Not one crowded
   mega-chart with all 3 variants forced into a single view.
3. **One card per test**, containing:
   - Primary KPI, before/after
   - Guardrail KPI, before/after
   - Net-CVR calculation where applicable (Tests 2 and 3)
   - Ship / Kill / Inconclusive verdict + one-sentence reasoning,
     visually distinct (colored tag — green/red/amber) so the
     conclusion is scannable without reading the full card
4. One scrollable page. No tabs, no routing, no additional views.

## Styling
Use the project's real `styles/tokens.css` (navy accent + Space
Grotesk headings) — no new colors invented ad hoc. If a
`--color-danger` / `--color-warning` pair doesn't exist yet for the
Kill/Inconclusive tags, add it to tokens.css properly (not an inline
hex), reusing the existing `--color-success` token where it already
fits the Ship tag.

## Naming & conventions
- File: `dashboard.html`, flat structure — same level as `index.html`
  and the variant files, not nested in `src/`. Same pattern as the
  `creatives/` files.
- Follow existing code conventions (check `screens.js` / `config.js`
  for comment style and naming) rather than introducing a new pattern.

## Implementation notes / verification
- Render `dashboard.html` via Puppeteer at 375px (mobile) and 1280px
  (desktop) before declaring done — confirm the funnel comparison and
  cards don't overflow or overlap at either width.
- Re-check color contrast for the verdict tags against their
  surrounding surface.
- The write-up (or an in-code comment block) must state explicitly that
  Test 1 and Test 2 were marked Inconclusive/Kill *despite* their
  primary KPI looking like a win — that's the point of the guardrail
  framing, and it should not be left implicit.

---

## Rejected / deferred (for the write-up's "why not" note)

- **Live mode** (reading real `tracking.js` localStorage events):
  requires generating real click-through data by manually running the
  panel, plus a second UI mode to read it. Cut for time — Simulated
  mode carries the analysis anyway, since no real traffic exists to
  evaluate a candidate against regardless.
- **Multi-tab / routed dashboard**: one scrollable page is sufficient
  for 3 tests; tabs would add navigation overhead without adding
  information.
- **A single combined funnel chart for all 3 variants**: rejected as
  visually crowded; per-test rows read faster.

---

## Build checklist (for Claude Code)

- [ ] Funnel comparison rendered: control + one row per test
- [ ] 3 cards built with exact numbers above (no recalculation)
- [ ] Net-CVR math shown explicitly on Tests 2 and 3 cards
- [ ] Verdict tags color-coded (Ship/Kill/Inconclusive) and readable
- [ ] "Simulated data" banner present and visually prominent
- [ ] Uses existing tokens.css only — any new color tokens added
      properly, not inline
- [ ] Verified at 375px and 1280px via Puppeteer, no overflow
- [ ] Write-up or in-code comment states the Test 1/Test 2 "primary
      looked good but guardrail said no" point explicitly
- [ ] Stop for review before considering this done