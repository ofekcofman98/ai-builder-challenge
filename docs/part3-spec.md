# Part 3 Spec — Ad Creatives

Status: Ready to implement
Depends on: Part 1 baseline (`index.html` + `src/` + `styles/`), frozen
as control since [DATE — fill in].

## Purpose

Three ad creatives, one per required size, each built as a standalone
HTML file that reads `styles/tokens.css` directly — never a hardcoded
duplicate of the palette/type/spacing. Each is exported to a
pixel-exact PNG for submission; the HTML source is included as a
bonus, not a requirement (task.md accepts static images alone).

Unlike Part 2, these are not config overrides of the same file — each
size has a genuinely different role in the funnel and a different
information budget, so each gets its own HTML file. What they must
still share: the same visual mark, the same color tokens, and a
click-through destination that is the actual Part 1 entry screen —
this is what "carry through to the entry screen" (task.md) requires
in practice.

**Shared build mechanics for all three:**
- File: `<link rel="stylesheet" href="styles/tokens.css">` — colors,
  radius, and type scale are read live from the token file the panel
  itself uses. No new hex values invented for the creatives.
- Logo: `heroMark()`'s SVG (from `screens.js`), pasted inline as-is.
  Treated as a placeholder-that-isn't-a-placeholder — it's already an
  on-brand mark (echoes pattern-recognition, uses `--color-primary`),
  not a generic box to be replaced before building. If a final
  logo/wordmark is decided later, it's a single SVG swap across three
  files — layout, copy, and CTA are untouched by that swap.
- Export: `wkhtmltoimage --width <W> --height <H> --disable-smart-width
  --quality 100 creative-<W>x<H>.html iqly-<W>x<H>.png`. Verified in
  this environment to return exact target dimensions and to render
  inline SVG (CSS custom properties included) correctly.
- Filename carries the size per task.md's requirement:
  `iqly-320x50.png`, `iqly-250x250.png`, `iqly-1080x1920.png`.

---

## Creative 1 — Banner

**File**: `creative-320x50.html` → `iqly-320x50.png`
**Role in funnel**: attention capture — the ad has to be read and
recognized as relevant in well under a second at this size.
**Content**: mark + short value claim + visible CTA button. No quiz
content — the space (~16,000px², realistically ~170px of text width
after mark and button) does not support it.

**Hypothesis**: at this size, a clear promise + low-cost signal
("Free · 3 min") converts attention into a click better than any
attempt at a hook, because there is no room to build one properly.

**Implementation notes**:
- Copy budget is genuinely ~3–4 words. Decide before building whether
  the mark stands alone or is paired with a text wordmark — both
  competing for the same ~170px means picking one, not fitting both
  at full size.
- CTA reads as a button visually (background, radius, weight) but
  must be a non-interactive element (`<span>`/`<div>`) styled as a
  button — an actual `<button>` nested inside the wrapping `<a>` is
  invalid HTML (interactive content nested in interactive content)
  and renders inconsistently across engines, `wkhtmltoimage`'s
  WebKit included. Confirmed present as a defect in the first build
  (`<button tabindex="-1">` inside `<a class="banner">`) — must be
  fixed to a styled `<span>` before export.
- Minimal, clean layout per task.md's framing — this is the size where
  restraint matters most; anything beyond mark + claim + CTA is noise
  at 50px tall.

---

## Creative 2 — Square Banner

**File**: `creative-250x250.html` → `iqly-250x250.png`
**Role in funnel**: curiosity — enough space for one real hook before
the click, but the hook is self-insight, not a puzzle.
**Content**: mark + wordmark, a headline built on the same
self-understanding motivation already used in the live flow
(`copy.partialResult.standoutLabel`, "Your Standout Strength"),
a short explanatory line (free / time / instant result), and a CTA
that promises exactly that. Text only — no supporting graphic.

**Revision note**: the first build of this creative used a
`svgGrid()` pattern question with the missing element marked `?`
(the original plan below, kept as a rejected candidate). Built and
reviewed: the specific question drawn (`q3`, 1-circle → 2-circles →
`?`) has an answer that's visually obvious at a glance, which closes
the curiosity gap instead of opening it — the viewer already knows
the missing shape is "3 circles" before reading the CTA, so "Find
out" promises something already delivered for free. This is a defect
in the concept itself (an easy pattern question can't carry a
curiosity hook), not something a harder-question swap reliably fixes,
since question difficulty isn't controlled per creative and a future
question-bank change could just as easily produce another
easy-to-solve case.

**Hypothesis**: a headline built on self-insight ("what's your
cognitive strength") creates a real curiosity gap — the answer
genuinely isn't knowable by looking at the ad — where a pattern
puzzle didn't. It also keeps this creative's promise identical to
what the live flow's first post-quiz screen actually delivers, so the
ad and the product make the same claim in the same language.

**Implementation notes**:
- Headline: self-insight framing, e.g. "What's your cognitive
  strength?" — reuse wording close to `copy.partialResult.standoutLabel`
  rather than inventing new product language for the ad alone.
- Subline: **must explicitly say "IQ Test"** — the ad's whole traffic
  source is a Google Search campaign on the exact keywords "free iq
  test" / "iq test" (task.md); a headline built entirely around
  "cognitive strength" with no literal "IQ" mention breaks message
  match with the search term the visitor just typed. Confirmed
  missing from the first build — the other two creatives both open
  with "What's your IQ?"; this one was the outlier and needs the same
  anchor. Time claim stays "3 min" (or "3-Min"), matching the entry
  screen's existing "about 3 minutes" claim, phrased as a stated fact
  rather than a hedge ("about") — e.g. "Take a 3-Min IQ Test." A
  shorter claim (e.g. "1 min") is explicitly rejected: the quiz is 8
  questions plus an analyzing/result sequence, and promising a
  shorter time than the app delivers is the same trust failure the
  competitive research flagged for the price-symbol competitor
  (write-up.md) — it just surfaces later in the funnel instead of on
  first load.
- CTA: promises the cost/friction removal directly — "Try Free" — 
  rather than restating the headline's promise a second time. Putting
  "Free" in the CTA itself (not a small subline) also gives it the
  visual weight a secondary value prop needs; a gray subline-sized
  "Free" under-sells the single biggest objection-remover this ad has.
- No supporting graphic — text-only at this size, by explicit
  decision. `heroMark()`'s SVG mark is still present as the identity
  element, but no additional illustrative content (icon row, pattern
  grid, or otherwise) is added underneath it.

---

## Creative 3 — Full-Screen Mobile

**File**: `creative-1080x1920.html` → `iqly-1080x1920.png`
**Role in funnel**: conversion + funnel head-start. Full room for a
real question with its actual answer options.
**Content**: mark, a real quiz question, and its 4 answer options shown
as visual content (what the ad promises), plus a single CTA covering
the whole creative — see the two-option build below for what that CTA
actually links to and why.

**Hypothesis**: getting the user to mentally engage with a real
question inside the ad, before they've even landed, converts better
than a generic value-prop full-screen. The stronger version of this
bet — letting the tap itself carry the answer forward — runs into a
real ad-serving constraint (below), so the build is split into a
default (A) that ships as the PNG deliverable, and a bonus (B) that
demonstrates the fuller mechanism outside the PNG constraint.

**Ad-serving constraint (why this creative splits into A/B)**: an
image creative served through any standard ad placement (Google
Display, most exchanges) has exactly one click-through URL for the
entire image — there is no way for different regions of a *served*
image to link to different destinations. A PNG cannot encode "which
answer the user tapped." This is a platform constraint, not a code
limitation, and it rules out per-answer deep-linking as the primary
deliverable.

**Build A — skip-to-quiz deep link (default; this is the PNG)**
- The single click-through target is `index.html?skip=entry` — it
  skips the entry/soft-entry screen entirely and lands the user
  directly on Q1 of the live quiz.
- Still a real funnel change, not just a persuasive message: it
  removes the Visit→Quiz-start screen boundary that the standard
  landing-first flow has, for traffic that arrives via this creative
  specifically.
- **Scope this touches Part 1 code**: `state.js` has no URL-param
  entry point today. Requires reading a `skip` param in `main.js`
  before `IQLY.init()` calls `render.mount()`, and calling
  `IQLY.state.advance()` (or setting `current.screen = 'quiz'`
  directly) before the first render, bypassing `entry`. This is the
  one piece of Part 3 that is not purely additive to Part 1 — confirm
  it's worth the scope before building, since everything else in this
  spec touches only new files.
- The visual content of the ad (question + 4 answer options rendered
  as static content, not live click targets) still functions as the
  hook described in the hypothesis above — the user sees a real
  question before tapping, they just don't select an answer inside
  the ad itself.
- **Affordance risk, confirmed in first build**: the option rows are
  styled identically to the live quiz's real answer buttons (same
  border/padding/type treatment as `.btn-option` in
  `components.css`), which invites a tap on one specific option
  expecting it to register that answer — it doesn't; every tap on the
  creative goes to the same `?skip=entry` destination regardless of
  where. The microcopy ("Tap anywhere to jump straight into the
  quiz") states this honestly, but the visual design still implies a
  different interaction model than the one that exists. Reduce the
  option rows' resemblance to real buttons before finalizing (e.g.
  drop the border, lower contrast against the card background) so
  they read as a preview rather than a control.
- **Challenge copy — no fabricated statistics.** A specific invented
  claim ("80% got this wrong") is rejected even though the live
  quiz's mid-quiz percentile toasts use fabricated benchmark numbers
  as a disclosed trade-off (write-up.md) — that precedent doesn't
  transfer here: the toasts reach a user already mid-commitment,
  while ad copy is a pre-click claim made to a stranger, the same
  trust register as the entry screen's explicit "no fabricated social
  proof" rule. A specific false numeric claim in outward ad copy also
  risks ad-platform policy enforcement (unsubstantiated
  comparative/statistical claims), a real operational risk beyond the
  trust question alone. Resolved as `.challenge-tag`, reading "Think
  you can solve it?" — not on the CTA banner, which stays "Start the
  quiz →" per the honesty fix above.
- **Text density, revised after review**: the first pass (headline +
  a full-sentence subheadline + challenge-tag, each its own line,
  ahead of the question prompt itself) stacked 3 same-weight text
  lines before the visual hook — more text-forward than Creative 1
  and 2's restraint, and it buried "Free" inside a run-on sentence
  competing with two other claims for the same attention. Restructured:
  - `headline` ("What's your IQ?") and a new `.free-badge` pill
    ("FREE", `--color-primary` fill, reusing `components.css`'s
    existing `.streak-chip` pill pattern rather than inventing a new
    visual primitive) sit on one row together — "Free" gets its own
    dedicated visual weight instead of small gray text inside a
    sentence.
  - `.challenge-tag` ("Think you can solve it?") is the only other
    line before the question card — headline+badge, then the
    challenge, then the puzzle. Two visual steps, not three-plus.
  - The old subheadline's remaining claims ("about 3 minutes", "no
    signup to start") move down into the existing bottom `microcopy`
    line, merged with the honest tap-explainer already there — this
    adds no new line, it consolidates into one that already exists:
    "About 3 min · No signup to start · Tap anywhere to jump straight
    into the quiz."
  Ad copy hierarchy, final: headline+free-badge (brand/keyword/cost,
  one row) → challenge-tag (desire, right before the puzzle) →
  question card → CTA (action) → microcopy (secondary reassurance,
  low visual priority at the bottom, not competing at the top).
- This is the version exported to `iqly-1080x1920.png` and submitted
  as the required deliverable.

**Build B — per-answer deep link (bonus, HTML only, not the PNG)**
- Demonstrates the fuller mechanism: 4 real `<a href>` click zones
  laid over the answer options, each linking to
  `index.html?q1=<index>` — landing pre-fills that answer and advances
  state past Q1, so the user is never re-asked the same question they
  just answered in the ad (a bait-and-switch risk if reused naively).
- Ships as an additional `creative-1080x1920-interactive.html`
  alongside the required PNG — never in place of it. task.md accepts
  HTML as a creative format, but is explicit that static images fully
  satisfy the deliverable on their own; this file is a bonus concept
  demo, not a second required asset.
- **Scope, on top of Build A's**: `main.js` needs a `qN` param reader
  (not just `skip`), and `state.js` needs `recordAnswer()` callable
  before first render with the resulting screen resolved correctly by
  `resolveNextScreen()`. Build only after Build A is confirmed
  working — this is a strict superset of A's scope.
- Call this out explicitly in the write-up as a demonstrated
  understanding of the ad-serving constraint (why A is the real
  deliverable) plus a concrete example of the mechanism the
  constraint otherwise blocks (why B exists at all).

---

## Rejected candidates (for the write-up's "why not" note)

- **Identical content scaled across all three sizes**: the default
  approach, and the one to explicitly argue against in the write-up.
  Each size has a different information budget and reaches the viewer
  at a different point of attention — collapsing them into one design
  wastes the two larger formats' actual capacity.
- **Quiz question at 250×250 with full answer options**: considered,
  cut for space — a legible 4-option layout doesn't fit alongside
  mark, prompt, and CTA at this size without the whole creative
  feeling cramped. Reserved for the 1080×1920 format, which has the
  room to do it properly.
- **Pattern-question hook at 250×250 (first build, replaced)**: built
  and reviewed before being cut — the specific question drawn had a
  visually obvious answer, which closed the curiosity gap the
  creative was meant to open rather than creating one. Replaced with
  a self-insight headline that can't be pre-solved by looking at the
  ad. See Creative 2's revision note above for the full reasoning.
- **Wordmark/logo finalization before building**: considered blocking
  on this, rejected — `heroMark()` is already on-brand and swappable
  as a single SVG include across all three files, so waiting on a
  final logo would delay the build for no structural reason.
- **Per-answer deep link as the primary 1080×1920 deliverable**:
  ruled out, not just deprioritized — a served PNG creative has one
  click-through URL for the whole image, so "which answer was tapped"
  cannot reach the landing page through a static-image ad. Kept as
  Build B, an HTML-only bonus demo, never as the thing exported to
  the required PNG.

---

## Build checklist (for Claude Code)

- [ ] Confirm `wkhtmltoimage` export pipeline against each of the 3
      target dimensions (already spot-verified for 250×250 and
      320×50 in this environment)
- [ ] Creative 1: mark + claim + CTA, verify legibility at 320×50
      actual size, not zoomed; confirm CTA is a styled `<span>`, not
      a `<button>` nested inside the wrapping `<a>`
- [ ] Creative 2: self-insight headline + "IQ Test"-anchored subline
      ("Take a 3-Min IQ Test", not a hedge like "about 3 minutes" and
      not a shorter claim like "1 min") + "Try Free" CTA, text only
      (no icon row, no pattern graphic)
- [ ] Creative 3 — Build A: `main.js` reads `skip=entry`, lands user
      directly on Q1; verify no console errors and that `entry`
      screen/soft-entry answer is cleanly bypassed (not just hidden)
- [ ] Creative 3 — Build A: reduce the option rows' visual
      resemblance to real clickable buttons (no border / lower
      contrast) so the static preview doesn't imply per-answer
      interactivity it doesn't have
- [ ] Creative 3 — Build A: export `iqly-1080x1920.png` from this
      version — this is the required deliverable
- [ ] Creative 3 — Build B (after A is confirmed working): add `qN`
      param handling + click-zone overlay HTML; ship as
      `creative-1080x1920-interactive.html`, bonus only, not exported
      to PNG
- [ ] All 3: exported PNGs named with exact dimensions
      (`iqly-320x50.png`, `iqly-250x250.png`, `iqly-1080x1920.png`)
- [ ] Stop for review before touching the write-up