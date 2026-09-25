# AI Workflow — Decision Log

Reverse-chronological log of non-trivial decisions made jointly with Claude Code while
building this submission. Used directly in the submission write-up to show where AI
tools helped and what was decided by the candidate.

Entry format:

```
## YYYY-MM-DD — <short title>

**Decision:** what we chose.

**Considered:** the alternatives on the table.

**Why:** the reasoning / trade-off that decided it.

**AI's role:** what Claude surfaced vs. what the user decided.
```

---

## 2026-09-25 — Final polish pass (`docs/fixes.md`): progress-bar animation bug, refresh persistence, post-email pacing, locked category report

**Decision:** implemented all 4 items from `docs/fixes.md`, one at a time with a stop for
review after each:

1. **Progress bar transition** — `docs/fixes.md` asked to *verify* the existing CSS
   transition, on the assumption an earlier pass had added it but it "apparently didn't
   land." The CSS rule was genuinely present, but the actual bug was elsewhere: `mount()`
   replaces `#app.innerHTML` wholesale on every screen change, so `.progress-fill` is a
   brand-new DOM node each mount, painted directly at its target width with no "before"
   state to transition from — the CSS was correct but inert. Fixed in `render.js` with a
   snap-back-then-defer approach: on mount, the fresh node is set back to the
   last-rendered percent, then the real target width is written two `requestAnimationFrame`
   callbacks later, giving the browser an actual committed paint to animate from.
2. **Refresh persistence** — new `src/persistence.js` (save/load/clear, reusing
   `tracking.js`'s try/catch localStorage convention under a separate key), `state.js`
   gained `getSnapshot()`/`restoreSnapshot()` (fails safe on anything malformed, rejects
   `emailCaptured: true` or a terminal screen), `render.js`'s `mount()` saves/clears on
   every screen, `main.js` restores before the first mount unless a deep-link param is
   present (a fresh ad click intentionally overrides stale saved progress).
3. **Post-email transitional state** — a `processingResult` screen (spinner +
   "Calculating your results...", `CONFIG.processingResult.durationMs`), rendered directly
   by `render.js`'s `handleEmailSubmit()` and deferring `state.advance()`/`mount()` by a
   `setTimeout`, mirroring the existing `runAnalyzingSequence()` pattern. Deliberately not
   a `state.js` screen — email submission doesn't change the resolver's notion of "current
   screen," so it's never persisted or reached via a fresh mount.
4. **Locked category report** — placed on `fullResult`, not `partialResult`. See below.

**Considered (item 4 placement):** `docs/fixes.md`'s own text was internally
inconsistent — its "Fix" bullet said "partial-result screen," but every other mention in
the same doc ("after email submission," "post-conversion," "sits outside the CVR measured
by Part 2's tests," "entirely post-signup") points at the screen reached *after* email
capture, which in this codebase is `fullResult` (the baseline gate is inline on
`partialResult`, submitted *before* the reveal it gates). Went with `fullResult`, treating
"partial-result screen" as a stale reference to a pre-refactor layout rather than the
literal instruction — confirmed by the earlier "Inline email capture on partialResult"
decision below, which predates `docs/fixes.md` and already moved the gate off a standalone
screen. This placement also resolves a data-shape question: `fullResult` already shows a
free, qualitative per-category tier (Strong/Average/Needs practice); the new locked
section teases the *exact* right/wrong counts instead — a genuinely deeper tier, not a
blurred duplicate of what's already free on the same screen.

**Why the pre-conversion blur/lock rejection does NOT apply here:** `write-up-part1.md`
(lines 85–92) documents rejecting a blurred/locked *exact score* on the pre-conversion
partial-result screen as a dark pattern — "a fake-looking blur reads as manipulative, not
curious," replaced with the honest percentile-curve visualization (also in
`write-up.md:161–166`). This new locked section is a different case on three counts: (a)
it sits on `fullResult`, reached only *after* the user has already converted (the account
exists), not before; (b) the free tier on the same screen already gives an honest,
non-obscured qualitative answer (Strong/Average/Needs practice) — nothing that should be
free is hidden; (c) the blurred content is the real computed right/wrong count, not a
placeholder standing in for data that doesn't exist yet, matching `docs/fixes.md`'s
explicit instruction not to fabricate blurred text. It's a genuine paid-feature teaser on
a monetization/retention screen, not a curiosity-gap tactic on the conversion path itself
— out of scope for the CVR metric Part 2's tests measure.

**AI's role:** the user asked to implement `docs/fixes.md` one item at a time. Claude
diagnosed the actual root cause of item 1 (a DOM-recreation issue, not a missing CSS rule)
via real browser measurement (`getBoundingClientRect` sampled across animation frames,
not just reading the CSS) after an initial naive fix (`offsetWidth` reflow) turned out
insufficient and needed a second, verified attempt. For item 4, Claude caught the
placement inconsistency in `docs/fixes.md` itself, resolved it against the codebase's
actual architecture and an earlier logged decision, and implemented+verified the result
end-to-end in a real browser (confirmed the blurred text matches `scoring.js`'s real
`categoryDetails`, not placeholder copy, and that the locked click-through lands on the
pricing/upsell screen) before reporting each item done.

---

## 2026-09-25 — Guardrail dashboard (`dashboard.html`), simulated data only

**Decision:** built a standalone `dashboard.html` per `docs/dashboard.md`'s spec — flat
file at repo root, no `src/*.js` (static markup only, no state machine needed), reusing
`styles/tokens.css`/`base.css`/`components.css` via the same link pattern as `index.html`.
Its own `.dashboard` container bypasses base.css's `#app` phone-width cap (this is a report
page, not a funnel screen) rather than reworking `#app` itself. Added `--color-danger`/
`--color-warning` token pairs to `tokens.css` (reusing `--color-success` for the Ship tag)
and a set of dashboard-scoped classes to `components.css`. All KPI numbers are transcribed
verbatim from the spec's fixed data table — no recalculation. Verified via a locally
installed (then removed) `puppeteer` at 375px and 1280px: no overflow/overlap at either
width, verdict tags color-coded and legible.

**Considered:** a "Live" mode reading real `tracking.js` events — rejected/deferred per
the spec itself, since no real traffic exists yet to make it meaningful. A single combined
funnel chart for all 3 variants — rejected as visually crowded; per-test rows read faster.

**Why:** Tests 1 and 2 both look like wins on their primary KPI alone; the entire point of
the dashboard is showing the guardrail (and, for Test 2, the net-funnel multiplication)
catching what the primary metric misses. That "primary looked good but guardrail said no"
point is stated explicitly in-page (a `.guardrail-callout` block on each of those two
cards), not left implicit, per the spec's explicit requirement.

**AI's role:** Claude read the spec, chose the CSS-token/component split (additive to
existing files, no new ad-hoc colors), wrote the page, and ran the Puppeteer verification
pass end-to-end; the user confirmed the approach and asked for the Puppeteer check to be
run via `npx` when local puppeteer wasn't already available.

---

## 2026-09-25 — Dashboard charts: inline SVG, no library (follow-up to the guardrail dashboard)

**Decision:** added two hand-built inline-SVG charts to `dashboard.html` as a JS-generation
pass, following `screens.js`'s existing `percentileCurve()`/`logoMark()` pattern (a
function returning an SVG string, colors via `var(--token)`) rather than a new approach —
a net-CVR bar chart (Control/Test 2/Test 3; Test 1 omitted since its primary KPI isn't a
comparable full-funnel number, with a caption explaining why) above the funnel comparison,
and a compact before/after bar pair inline in each KPI row, scaled against a per-row `max`
(100 for percentages, 20 for Test 3's time-on-screen guardrail so seconds aren't treated as
0–100). Bar colors: verdict-colored for the summary chart (danger/success, not the brand
primary — reserved for the quiz product), and success/danger per KPI row based on whether
that specific metric moved in a good or bad direction. Hit one bug during verification:
`height="auto"` is invalid as an SVG attribute (unlike CSS) and threw a console error in
Puppeteer — fixed by moving sizing to a CSS class (`width:100%; height:auto`) instead of
inline SVG attributes.

**Considered:** including a 4th "not comparable" bar for Test 1 — rejected per the task's
own instruction not to fabricate a full-funnel number that isn't in the spec; omission +
caption was cleaner than a fake/greyed bar.

**AI's role:** Claude checked `screens.js`'s existing SVG helpers first (confirmed the
pattern extends cleanly, no data-shape coupling issue), wrote both chart functions and the
inline markup/CSS, caught and fixed the `height="auto"` SVG bug via the Puppeteer console
capture, and re-verified visually via screenshots at 375px/1280px before reporting done.

---

## 2026-09-25 — Branding pass: navy accent + Space Grotesk/Geist Sans; closes Tier 2/3 polish

**Decision:** merged a proposed `tokens.css` (navy `#1C61C9` accent, warm neutrals,
Space Grotesk headings / Geist Sans body, tighter radii) into the real `styles/tokens.css`
rather than replacing it outright — kept every existing token the proposal didn't cover
(`--color-progress-track/fill`, `--color-toast-bg/text`, `--radius-pill`, `--shadow-card`,
motion/spacing scales), re-pointing the toast/progress tokens at the new success/border
colors instead of dropping them. `--font-weight-medium` moved 600→500 to match Geist's
actual medium weight. Applied `var(--font-heading)` globally via `h1,h2,h3` in `base.css`
(covers every screen — no per-screen class changes needed) and to the analogous headline
elements in all 3 `creatives/*.html` files. Closed the two remaining polish items that
were blocked on this branding decision: the feedback toast now uses
`var(--color-success)`/`var(--color-success-bg)` (was black) with a fade+slide-in
matching the existing `.toast-slot-text` convention; the progress bar's `width` transition
(`components.css`) was already in place from an earlier pass and needed no change.

**Considered:** leaving the old cool-blue/system-ui palette and only adding the toast/
progress fixes — rejected since Tier 3 in `docs/fixes.md` was explicitly blocked on this
exact branding call, and the user supplied the finished token proposal rather than asking
for a redesign to be invented.

**Why:** the toast/progress-bar items had been sitting blocked on "pick branding
direction" (`docs/fixes.md` Tier 3) since the last polish pass; doing the token swap and
the two dependent fixes together avoids a second review cycle. Kept old tokens instead of
deleting them because `components.css` references `--color-progress-track/fill` and
`--color-toast-bg/text` directly — dropping them silently would have been exactly the
"variant rule" violation CLAUDE.md warns about (a code change forced by an incomplete
config surface).

**Fonts:** no network fetch tool was available in-session; used `npm install
@fontsource/space-grotesk @fontsource/geist-sans` purely to extract the 5 needed
`.woff2`/`.woff` files (OFL/SIL-licensed, matching upstream Google Fonts / Vercel Geist
exactly) into `styles/fonts/`, then removed `node_modules`/`package.json`/
`package-lock.json` immediately — the repo stays dependency-free and build-step-free per
CLAUDE.md; npm was a one-time asset-extraction tool, not a runtime dependency.

**Bug found during verification, not requested but necessary:** `creatives/export.js`
resolves `var()` for wkhtmltoimage and then strips the `<link>` to `tokens.css` entirely
(that renderer can't parse custom properties — documented from the prior session). That
also silently dropped tokens.css's `@font-face` rules, so the exported PNGs rendered in a
system-font fallback despite the live app's fonts being correct. Fixed by extracting the
`@font-face` blocks from `tokens.css`, resolving their own `var()` references, rewriting
their `./fonts/` paths to `../styles/fonts/` (temp file lives in `creatives/`, not
`styles/`), and re-inlining them as a `<style>` block in place of the removed `<link>`.
Also added a `.woff` sibling for each weight in the `@font-face` `src` list — wkhtmltoimage
0.12.6 ships a Qt WebKit build that predates woff2 support entirely, same "old renderer,
modern format" class of gap as its missing `var()` support. Confirmed the fix by re-viewing
the exported PNGs directly (not just confirming the script exited 0): Space Grotesk now
renders correctly in all 3 creatives, at unchanged pixel dimensions (320×50 / 250×250 /
1080×1920).

**Verification:** rendered entry, quiz (q1 matrix + q6), partialResult, fullResult and all
3 A/B variants at 360×640, 390×844, and 480px desktop via Puppeteer (temporary
`npm install puppeteer`, removed after) — no overflow or clipping at any breakpoint. The
entry headline ("Discover your IQ score") now wraps to 2 lines at all 3 widths where it
may have fit on fewer lines under the old system-ui stack (Space Grotesk Bold is wider
per character) — flagged, not fixed, since it doesn't overflow or get clipped and no
single-line constraint was requested. Contrast checked via WCAG relative-luminance
formula: `--color-primary` (#1C61C9) on `--color-bg` = 5.50:1, on white = 5.83:1, white
text on primary buttons = 5.83:1 — all ≥4.5:1.

**AI's role:** Claude flagged two blockers before starting (no fetch tool for the fonts;
the user's prose description of the proposed tokens didn't include the actual file) and
paused for the user to resolve both — the user then supplied the real tokens.css and
suggested the `@fontsource` npm packages as the font source. Claude did the merge, the
global heading rule, the toast/progress-bar fixes, discovered and fixed the export
pipeline's `@font-face`-dropping bug and the woff2-support gap, re-exported and visually
verified the creatives, ran the cross-viewport/contrast verification, and removed all npm
artifacts before finishing, without further user direction on those specifics.

---

## 2026-09-24 — Build A/B visual polish: card fill, icon sizing, CTA wording

**Decision:** three fixes to `creative-1080x1920.html` (Build A) and
`creative-1080x1920-interactive.html` (Build B), all user-reported from an actual
rendered screenshot:

1. Removed `.question-card`'s `var(--color-surface)` background/border-radius fill.
   The matrix cells already carry their own border+background from
   `svgGridMatrix()`'s render, so a second full-card gray background underneath read
   as "card inside a card" — visibly heavier than Creative 1 and Creative 2, both
   plain white. Padding kept; only the fill removed.
2. Fixed `.option-icon`'s hardcoded 96px width/height in both creative files' own
   stylesheets — the same unrelated-numbers bug already fixed once in
   `components.css`'s live-app answer grid, recurring here because these two files
   ship separate CSS that was never updated with that fix. Icons now size as 44% of
   their own cell/option's rendered width, computed in JS (not CSS `aspect-ratio`,
   which the export renderer doesn't support — see below).
3. Reworded Build A's CTA banner from "Answer this question →" to "Start the quiz →"
   — every tap on Build A, including a tap directly on one option, goes to the same
   `?skip=entry` destination regardless of which option was tapped, so the old
   wording implied in-place interactivity the ad doesn't have. The microcopy below it
   ("Tap anywhere to jump straight into the quiz") was already honest; the CTA above
   it wasn't quite consistent with that.

**Considered (icon sizing specifically):** CSS `aspect-ratio: 1/1` on a
percentage-width icon, matching the live app's `.option-icon-wrap` fix — tried first,
and confirmed via a real export (not assumed) that wkhtmltoimage's WebKit-based
renderer silently collapses it to 0 height, since `aspect-ratio` postdates that
engine. Replaced with explicit pixel `width`/`height` set in JS from each icon's
own cell's `clientWidth` after layout — the same category of fix already used
elsewhere in these files (the question-visual SVG's explicit dimensions) for the
same underlying reason: this renderer needs sizes it doesn't have to compute itself.

**Why (a fourth issue found during verification, not requested but necessary):**
the larger icons (44% of a ~456px cell vs. a fixed 96px) added real height, pushing
Build A's total content 103px past the fixed 1920px canvas — confirmed via Puppeteer
(`content.scrollHeight` vs. 1920), not assumed, and visible in the first re-export as
a garbled double-page artifact. Trimmed `.headline`'s top margin (64→40px),
`.subheadline`'s bottom margin (56→32px), `.question-card`'s top/bottom padding
(48→32px), and `.cta-banner`'s top margin (72→40px) — 112px of freed room for 103px
of overflow. Re-measured at 0px overflow before re-exporting.

**AI's role:** Claude implemented all three requested fixes, then caught the
resulting overflow bug during its own verification pass (re-exporting and viewing the
PNG before declaring done, per this session's standing instruction to verify against
real output rather than assume a CSS change is correct) and fixed it in the same
pass rather than shipping a broken export. The icon-sizing approach (JS-computed
pixels instead of CSS aspect-ratio) was Claude's diagnosis of why the first attempt
silently failed on this specific renderer, not a user-specified fix.

---

## 2026-09-24 — Matrix pattern question moved from q6 to q1, for Build B's deep link

**Decision:** swapped the content of `q1` and `q6` in `src/questions.js`. The 3x3
matrix pattern question (icon-rendered options, previously at array position 5, id
`q6`) now lives at position 0, id `q1`. The plain sequence question that used to be
`q1` ("What comes next? 2, 4, 6, 8, __") took its old place at position 5, id `q6`.
`creative-1080x1920.html` (Build A) and `creative-1080x1920-interactive.html`
(Build B) were both updated to pull `q1` instead of `q6`; Build B was also rebuilt
from a plain text-option list into a 2x2 icon-grid of real per-answer deep links
(mirroring Build A's visual, but clickable), and both PNGs were re-exported.

**Considered:** three options, presented to the user directly because this was a
genuine product trade-off, not a pure implementation choice —
1. Keep Build B on the old q1 (plain sequence), leave the matrix at q6, and accept
   that Build B's per-answer deep-linking simply can't showcase the icon-grid
   mechanic.
2. Extend the app (`state.js`/`main.js`) with real logic to pre-fill/skip the first 5
   answers so a `?q6=<index>` link could validly land on q6.
3. Move the matrix question itself to array position 0, so the *existing* deep-link
   mechanism (which only ever honors index 0 — see `main.js`'s `readAnswerParam()`)
   works for it without any app-logic changes. **Chosen.**

**Why:** `main.js`'s `readAnswerParam()` parses the target question index straight
from the `qN` query-param's name (not from any question's `id` field) and only
honors it when `questionIndex === state.getAnswers().length` — i.e., only the first
unanswered question, always index 0, on a fresh page load. There is no mechanism to
validly deep-link to question 6 without the 5 preceding answers already recorded, so
option 2 would have meant real app behavior changes just to serve one ad creative.
Option 3 solves the constraint by construction — whatever question sits at array
position 0 is automatically the only one Build B *can* deep-link to — at the cost of
breaking the quiz's original "easy first two, hardest cluster around Q6-Q7" difficulty
curve: the quiz now opens with a genuinely harder matrix question instead of a simple
sequence one. Accepted explicitly by the user as the trade-off worth taking; called out
in `questions.js`'s comments rather than silently absorbed, in case the difficulty-curve
concern outweighs it later (at which point option 1 or 2 above are the fallback paths).

**AI's role:** Claude surfaced the technical constraint (the deep-link mechanism's
index-0-only guard) that the user's original request — "use q6 in both creative
files" — would have silently violated, presented the three options above via
`AskUserQuestion` rather than picking one unilaterally, and implemented the chosen
swap end-to-end: content swap in `questions.js`, both creative files repointed to
`q1`, Build B rebuilt from a text list to a clickable icon grid, and the whole path
verified live via Puppeteer (confirmed clicking Build B's first option lands on
`index.html?q1=0` and correctly advances to "Question 2 of 8", not just that the
markup looked right).

---

## 2026-09-24 — q6 screen: dead-space, matrix size, and answer-card proportion fixes

**Decision:** three related layout fixes to the q6 quiz screen, each verified with
real Puppeteer measurements (not eyeballed), at 360×640, 390×844, and 480×900:

1. **Dead space above "Question X of Y":** measured 88px between the progress bar and
   the quiz-header (24px `.screen` gap + 40px `.toast-slot` + 24px gap). The 40px slot
   is load-bearing (mid-quiz toast feature) and stays; the two 24px gaps around it
   don't need to match `.screen`'s shared rhythm. Fixed with `margin: -16px 0` on
   `.toast-slot` alone (not a global `.screen` gap change, which every other screen
   also uses) — shrinks each side's effective gap from 24px to 8px, saving 32px.
2. **Matrix cell size:** `svgGridMatrix()`'s default `cellSize` raised from 28px to
   48px (64px overflowed 360×640 by 47px; 48px is the largest that fits with the
   freed vertical room). Also replaced its `width:100%`/`max-width` scaling hack with
   explicit pixel `width`/`height` attributes matching the viewBox — the old approach
   made the CSS cap, not `cellSize`, the actual source of truth for rendered size, and
   was fragile against inline-style-vs-attribute precedence (this is what silently
   broke `creative-1080x1920.html` before an earlier fix). Result: matrix visual grows
   from 96px to 156–204px depending on viewport, and shape radius/spacing (derived
   from `cellSize` via the existing scale formula) grows proportionally — confirmed
   legible, not just "bigger than before."
3. **Answer card / icon proportion:** `.option-icon-wrap`'s percentage width was
   resolving correctly against its card's content box (confirmed via
   `getBoundingClientRect`, not assumed) — the actual problem was the card itself
   stretching to fill its full grid-track width regardless of the icon's size inside
   it. Added `max-width: 180px; justify-self: center;` to `.btn-option-grid` so the
   card no longer fills the column, and raised the icon proportion from 44% to 55% of
   the now-smaller card. Confirmed at 480px: card width caps at exactly 180px and
   centers within its track (`left: 35px` inside a wider column), rather than
   stretching to it.

**Considered:** reducing `.screen`'s shared gap token globally instead of a
`.toast-slot`-scoped margin — rejected, since that gap is used by every other screen
and this fix needed to be scoped to the quiz screen's toast-slot specifically. Also
considered shrinking the icon-wrap percentage instead of capping the card — rejected,
since the icon-wrap's percentage sizing was already correct; the card's *size*, not
the icon's *proportion*, was the actual defect.

**Why:** all three were user-reported from an actual screenshot, and all three
explicitly required measured verification rather than a code read-through — a repeat
instruction after earlier rounds in this session where "fixed" CSS turned out not to
be, once actually measured.

**AI's role:** Claude ran the real DOM measurements (Puppeteer, `getBoundingClientRect`,
`scrollHeight`/`clientHeight`) at all 3 required widths before and after each change,
diagnosed which of the three problems was a genuine sizing bug vs. a card that was
simply too large, and re-exported/visually confirmed the Build A PNG still renders the
larger matrix correctly. The specific numbers (which gap to cut, how much cellSize
headroom existed, where the proportion bug actually lived) came from the user's
screenshot-based report; Claude's job was root-causing each one against real measured
values instead of guessing.

---

## 2026-09-24 — q6 upgraded from a single-row shape-count sequence to a real 3x3 matrix

**Decision:** `q6` changed from `svgGrid()`'s single row of 3 cells (triangle count
increasing by 1 per cell: 3, 2, blank) to a genuine 3x3 matrix rendered by a new
`svgGridMatrix(rows, cellSize)` function. The rule: one shape (circle) throughout the
whole grid, each row's 3rd cell is the sum of that row's first two cells' counts
(1+2=3, 2+3=5, 3+5=**8**). Distractors (6, 7, 9) each fail a *different* wrong
strategy (continuing the diagonal, summing across rows instead of within one, a
generic increasing guess) rather than being arbitrary near-misses, and the correct
answer (8) is placed 3rd, not 1st, among the options.

**Considered:** a row-identity/column-count dual-rule grid (the more common IQ-test
matrix format) — explicitly avoided so this question doesn't resemble that pattern
family, per the user's direction to keep it a single-rule question.

**Why:** the previous q6 was "one more shape than last time" — genuinely easier than
it looked, not a real step up in difficulty from q3's simpler pattern. A 3x3 matrix
with an arithmetic (not just counting) rule is a materially harder, more legitimate
"hardest cluster" question, and gives the pattern-question ad creative
(`creative-1080x1920.html`) a stronger hook than a single row of shapes could.

**AI's role — and 4 real rendering bugs this surfaced, none assumed away:**
1. `shapeMarkup()`'s `r`/`spacing` constants are absolute pixels, tuned for
   `svgGrid()`'s 64px single-row cells — a 3x3 grid needs much smaller cells to fit
   `.question-content`'s ~168px budget, but its densest row (a cell with 5 circles)
   couldn't physically fit in a small cell at those fixed constants. Added an
   optional `scale` param to `shapeMarkup()` (default 1, so every existing caller —
   `svgGrid()`, `optionIcon()` — is byte-for-byte unaffected) that `svgGridMatrix()`
   uses to shrink shapes proportionally to its own cell size.
2. First scale attempt used a fixed `cellSize/64` ratio — fine for low counts, but
   still let 5-circle cells overflow their own cell border, since count and cellSize
   were scaled independently (same class of bug as the option-icon sizing fix from
   the previous session). Fixed by deriving scale from the matrix's own *densest*
   cell (`neededSpan` for `maxCount` shapes), not a constant ratio — one shared scale
   across the whole matrix, same principle as `optionIcon()`'s shared `canvasSize`.
   Caught by rendering the actual PNG at 1080x1920 and looking, not by inspecting the
   formula — the overflow was a barely-visible sliver at the quiz's compact 96px
   size and only became obviously wrong at the ad's much larger scale.
3. Set `svgGridMatrix()`'s rendered size via an inline `style="max-width:96px"` to
   fit the quiz's height budget, then separately discovered — via Puppeteer
   measuring `document.documentElement.scrollHeight` vs. `clientHeight`, not
   eyeballed — that an earlier `max-width:180px` (copy-pasted habit from `svgGrid()`)
   caused an 18px real vertical overflow at 360x640 specifically, the narrowest
   required width. Reduced to 96px and reverified overflow-free at 360/390/480.
4. `creative-1080x1920.html`'s existing viewBox-ratio resize script sets `width`/
   `height` *attributes* on the visual SVG — but `svgGridMatrix()`'s own inline
   `max-width:96px` style silently overrode those attributes regardless of value (an
   inline style always beats an HTML attribute), so the ad's matrix rendered tiny in
   a sea of empty space at the full 1080x1920 canvas until `visualSvg.style.maxWidth
   = 'none'` was added before setting the new dimensions. Confirmed by rendering the
   actual export both before and after the fix, per the explicit instruction not to
   assume the existing scaling logic "should just work."

Regression-checked specifically for q6 (not just a general pass): `index.html` and
variant-1/variant-3 (`questionCount` unchanged at 8, so q6 is reached) share the
exact rendering path verified live; variant-2 (`questionCount: 5`) never reaches q6
at all (`selectQuestions()`'s round-robin picks q1–q5), so it's structurally
unaffected either way. `creative-1080x1920-interactive.html` (Build B) still sources
`q1`, unchanged — its per-answer deep link only ever worked for the first question
(established last session), so q6's redesign doesn't touch it.

---

## 2026-09-24 — Live-quiz fix: sequence-prompt line-break + styled blank marker

**Decision:** `screens.js` gained a `formatQuestionPrompt()` helper that, for
`type: 'sequence'` questions only, splits the prompt's intro text from its numeric
sequence and wraps the sequence + blank marker in `<span class="sequence-line">`
(`white-space: nowrap`), replacing the plain `"__"` with a styled `.sequence-blank`
chip (`components.css`). Every other question type is unaffected (falls through to
the existing plain `escapeHtml()` path).

**Considered:** restructuring `questions.js` to carry the sequence as a separate
data field (`sequence: [2,4,6,8]`) instead of parsing it back out of the prompt
string.

**Why:** the bug (`docs/fixes.md` Tier 1) was purely presentational — the sequence
wrapping mid-number-list on narrow/wide viewports, and `"__"` being easy to miss as
the blank. A prompt-string regex fix is additive and keeps `questions.js` content
authors writing the prompt as one natural string, matching every other question
type; a new structured field would have meant every sequence question's data shape
diverging from the rest for a rendering-only problem.

**AI's role:** user filed the bug (mirrors `docs/fixes.md`'s existing Tier 1 entry);
Claude implemented the fix and verified it with a static render at both mobile quiz
width (390px) and the 1080px creative width, confirming the sequence + blank stay on
one line at both before reporting done.

---

## 2026-09-24 — Live-quiz fix: icon-rendered options for pattern/spatial questions; q4 replaced

**Decision:** `questions.js` gained an additive `optionShapes` field (parallel array
to `options`, one `{shape, count}` per option) on `q3` and `q6` — the two pattern
questions whose options reduce cleanly to shape+count — rendered via a new
`optionIcon()` helper reusing `shapeMarkup()`. `screens.js`'s `quiz()` wires these
into a 2x2 icon grid (`.option-grid`/`.btn-option-grid` in `components.css`) instead
of the text-only single column, icon-only (no label) per the user's explicit
correction after an initial icon+label build. `q4`'s original prompt ("rotate a
square 90°") was replaced entirely with a text-only spatial-reasoning question (the
classic painted-cube problem) — its single-cell `svgGrid()` render had no second
cell to set an aspect ratio against, so the SVG scaled to fill the full question-
visual width at 1:1, overflowing `question-content`'s fixed-height contract and
shifting the option buttons down (`docs/fixes.md`'s "image too big, moves the
answers" report).

**Considered:** (1) giving `q4` an `optionShapes` entry too, forcing its options
("a rectangle", "a rotated square") into the shape+count vocabulary — rejected,
`shapeMarkup()` has no rectangle or rotation primitive, and inventing one for a
single question wasn't worth the scope; (2) patching `svgGrid()`'s single-cell
scaling instead of replacing `q4`'s content — rejected in favor of the simpler,
narrower fix once a suitable replacement question (no visual needed at all) was
available; (3) keeping the icon grid's sizing as two independent numbers (icon px
size, cell px size) — this is what the first two implementation passes actually
shipped, and it round-tripped through "shapes too small" → "cell way too big" →
"still small" before the user stopped the tuning loop and asked for the CSS
custom-property-free rewrite actually in place now (icon `width/height: 100%` of
its wrapper, wrapper `44%` of its cell — one proportion, not two independent
numbers).

**Why:** the icon grid fix corrects a real inconsistency (`docs/fixes.md`'s
observation that pattern questions render their *prompt* visually via `svgGrid()`
but their *options* as plain text) without touching `scoring.js` or the flow/state
machine — purely additive content + rendering. The `q4` replacement fixes a genuine
layout bug rather than working around it with more CSS on top of an SVG scaling
problem specific to single-cell grids.

**AI's role:** user identified both problems from `docs/fixes.md` and specified the
additive-field/reuse-`shapeMarkup()` approach for the first; Claude implemented
both, but the icon-grid rendering needed two rounds of user-driven correction: first
switching from a single-column icon+text list to a 2x2 grid (user's initial
request), then a full rewrite after grid cells and icons kept being sized as two
unrelated numbers as Claude iterated on gut-feel pixel values across several
messages — the user explicitly stopped that loop and specified the exact CSS
(icon = 44% of cell, one proportion, no independent pixel sizes) actually in place
now. Claude then found and fixed two bugs the user's CSS spec's literal values
didn't anticipate: `max-height` (not `height`) can't actually shrink
`aspect-ratio: 1/1` cells, so it overflowed vertically regardless of the cap — fixed
by switching to a definite `height` shared across two `fr` rows; and an `<svg>` with
no width/height attributes (per the user's "let CSS size it" instruction) hits a
browser fallback to a 300x150 default intrinsic size for min-content purposes,
forcing grid tracks wider than their `1fr` share — fixed with `aspect-ratio: 1/1` on
`.option-icon`, safe because `optionIcon()`'s viewBox is always square. Both were
verified with real measurements (Puppeteer's `scrollWidth`/`scrollHeight` vs.
`clientWidth`/`clientHeight`, not eyeballed screenshots) at all 3 required widths
(360×640, 390×844, 480px desktop column) for both `q3` and `q6`, after an earlier
verification pass using wkhtmltoimage's legacy `--headless --screenshot` CLI flag
produced a false-positive overflow reading — a flaw in that measurement tool, not
the page, subsequently confirmed and discarded in favor of Puppeteer's real DOM
metrics. Creative 3 (`creatives/creative-1080x1920.html`, Build A) was then updated
to source `q6` with real icon-rendered options instead of `q1`'s plain text, so the
PNG's visual promise matches what the live quiz now actually shows; Build B
(`creative-1080x1920-interactive.html`) stays on `q1` — its `?qN=<index>` deep-link
mechanism only ever works for the first unanswered question (`main.js`'s
`readAnswerParam()` guards on `questionIndex === state.getAnswers().length`, which
is `0` on a fresh load), so a `?q6=` link would never actually validate, and `q1`
has no `optionShapes` to render as icons regardless.

---

## 2026-09-24 — Export-time token resolver for ad-creative PNGs; creatives kept in their own folder

**Decision:** `wkhtmltoimage` (installed this session for Part 3's PNG export pipeline)
runs on an old Qt WebKit build with no support for CSS custom properties (`var()`) or
modern flexbox — confirmed empirically, not documented anywhere, and contrary to
`part3-spec.md`'s assumption that this was already verified working. The checked-in
creative HTML files keep `var()` against `styles/tokens.css` as the real source of truth
(correct in any real browser, honors the "read tokens live" rule); a small script,
`creatives/export.js`, resolves `var()` to literal values into a temp copy that only the
`wkhtmltoimage` subprocess consumes, then deletes it. Layout inside the creatives uses
table/table-cell instead of flexbox, since that renders identically across old and new
WebKit. All three creative HTML files, their exported PNGs, and `export.js` live together
under a new top-level `creatives/` folder rather than scattered at repo root.

**Considered:** (1) hardcoding resolved hex values directly into the creative HTML files,
with a comment to keep them in sync with `tokens.css` by hand; (2) leaving the creatives
at repo root alongside `index.html` and the Part 2 variant files.

**Why:** Option 1 reintroduces exactly the kind of manual-duplication drift the whole
`CONFIG`-driven architecture exists to avoid — a token change would silently desync the
ad creatives from the live palette with no error. The export-time resolver keeps a single
source of truth while working around a rendering-tool limitation that has nothing to do
with the app itself. On folder placement: Part 3's deliverables (3 HTML files + 3 PNGs +
one shared export script) are a self-contained unit with their own shared tooling, unlike
Part 2's variants which must sit next to `index.html` to share its `src/` scripts as-is —
grouping them avoids cluttering repo root as more creatives are added.

**AI's role:** Claude installed `wkhtmltoimage`, discovered the `var()`/flexbox rendering
gap by testing a minimal reproduction case (not from the spec, which had assumed it
worked), and proposed the export-time resolver plus the table-layout fix; the user chose
the resolver over hardcoding hex values via AskUserQuestion, and separately asked for the
creatives folder.

---

## 2026-09-24 — Inline email capture on partialResult, no intermediate screen

**Decision:** the baseline post-quiz email gate is no longer a separate `emailGate`
screen reached via a "See your full score" button. The email field renders inline at
the bottom of `partialResult`, and submitting it advances straight to `fullResult`. The
standalone `emailGate` screen still exists (extracted into a shared `emailForm()`
helper) for the two paths with no result content to merge into: a gate firing mid-quiz
(Test 1) and a gate firing before a full, ungated reveal.

**Considered:** keeping the separate screen and CTA as originally built.

**Why:** Result -> Account is the steepest drop-off in the funnel model (write-up.md),
so an unearned extra click on it directly opposes the flow's own stated priority. Step-
level measurement isn't lost — `result_viewed` and `account_created` still fire as
distinct events at the same points, just without a screen boundary between them.

**AI's role:** user identified the friction and specified the fix directly; Claude
implemented it, including refactoring the duplicated form markup into one helper so the
two remaining standalone-emailGate code paths didn't drift from the inline version.

---

## 2026-09-24 — State machine: resolver function, not an index walk

**Decision:** `state.js`'s screen transitions are computed by a pure `resolveNextScreen()`
function of (current screen, answers, email-captured, `CONFIG`) — not by incrementing an
index through `CONFIG.flow.screens`. The email gate is not in that array at all; its
position is decided fresh on every transition from `CONFIG.emailGate` and
`CONFIG.result.revealMode`.

**Considered:** keeping the original index-walk skeleton (`screenIndex + 1` through a
flat array including `'emailGate'` at a fixed position).

**Why:** the index walk cannot express Test 1 (email gate moved from after Q8 to after
Q4) — a fixed array position can't make the gate interrupt the quiz mid-way and then
resume it. It also can't express a variant that skips `partialResult` for a full reveal.
Building the real screens first surfaced this: `state.shouldShowEmailGate()` existed in
the skeleton but nothing called it, which was the concrete signal the design was
incomplete. The resolver makes every variant in this session's scope (and Part 2's
gate-timing test specifically) a pure `CONFIG` edit, with the state machine unchanged —
the promise this project's whole architecture exists to keep.

**AI's role:** Claude identified the gap while implementing screens (before writing any
screen code) and proposed the resolver model with a worked transition table; verified by
simulating the full answer sequence for baseline and all 3 variant configs headlessly
before treating it as correct.

---

## 2026-09-24 — Variant delivery: shared files + config override

**Decision:** Part 2's 3 variants are separate entry HTML files
(`variant-N-<name>.html`) that load the same `src/` scripts as `index.html` and apply a
small inline `IQLY.CONFIG` override between the `config.js` and `main.js` tags.

**Considered:** (1) a dev-time bundler script that inlines everything into 4 fully
self-contained single-file HTML documents; (2) one fully-inlined `index.html`, with
each variant a full copy with one section changed.

**Why:** Option 2 is exactly the manual-duplication bug source the task warns against —
any shared-code fix has to be repeated by hand in 4 files. Option 1 reintroduces a build
step, which is a hard constraint violation for local development (must remember to
re-run it after every edit) even though the output itself is buildless. The chosen
option keeps a single source of truth for shared behavior and makes each test a
~10-line diff. `task.md` explicitly accepts a `.zip` of linked files for both Part 1 and
Part 2, so shipping the folder together is in-format.

**AI's role:** Claude proposed all three options with trade-offs; the user selected the
config-override approach via AskUserQuestion.

---

## 2026-09-24 — No ES modules; classic scripts on a global namespace

**Decision:** All JS files are classic `<script>` tags in a fixed dependency order,
each file attaching its exports to one global object, `IQLY`. No `import`/`export`.

**Considered:** ES modules (`<script type="module">`), which would give cleaner
explicit imports between `config.js`, `questions.js`, `state.js`, etc.

**Why:** `import`/`export` fail under `file://` CORS restrictions in every major
browser — opening `index.html` by double-click would silently break, violating the
hard "no backend, click index.html to run" constraint. Classic scripts with a shared
namespace preserve the same file separation without depending on a server.

**AI's role:** Claude identified the `file://` CORS constraint (a detail the user
had not raised) and proposed the classic-script/namespace pattern as the fix; the user
confirmed it via AskUserQuestion.
