# Part 3 Creative Fixes — Round 4

## 0. Confirm "2 min" is consistent everywhere, not just in the 3 creatives

All three creatives now read "2 min" (Creative 2's subline "Take a
2-Min IQ Test", Creative 1's subline "2 min quiz", Creative 3's
microcopy "2 min · No signup to start") — this is intentional, keep
it as-is in all three.

Before treating this as settled, confirm two things elsewhere in the
codebase so the ad and the product don't end up contradicting each
other (the exact failure mode the original "match the real time"
rule existed to prevent — it just moved from ad-vs-quiz to
ad-vs-entry-screen if this isn't checked):

- `CONFIG.copy.entry`'s own subheadline currently says "about 3
  minutes" — update it to match "2 min" (or whatever exact phrasing
  is used) so the entry screen a visitor lands on doesn't contradict
  the ad claim they just clicked through on.
- Confirm the quiz's actual expected completion time genuinely
  supports "2 min" at its current question count (8 questions). If
  the question count wasn't reduced to justify this, flag it back
  rather than silently shipping a time claim that isn't grounded in
  the flow as it currently exists.

---

## 1. Creative 2 (250×250) — headline and subline need real hierarchy

Current render: headline ("What's your cognitive strength?") and
subline ("Take a 3-Min IQ Test") are both too small — the subline in
particular is barely legible at actual size.

- Increase headline font-size and weight so it's clearly the
  dominant element on the card — it's the hook, it should read
  instantly, not compete with the mark or subline for attention.
- Increase subline font-size and give it real contrast (bold weight
  and/or `var(--color-text)` instead of a muted gray) — right now
  it under-performs its job of anchoring the "IQ Test" keyword match.
- These two changes will consume more vertical space at a size that's
  already tight — verify the full stack (mark row, headline, subline,
  CTA) still fits inside 250×250 without cramming or clipping after
  the size increase, not just that each element looks better in
  isolation. If it doesn't fit cleanly, tighten vertical gaps between
  elements before shrinking type back down — line-height and margin
  are cheaper to cut than legibility.

---

## 2. Creative 1 (320×50) — CTA button too small, subline illegible

Current render: the "Try Free" button is small relative to the
available width, and the subline text under the headline is too
small to read at actual size.

- Enlarge the CTA button — let it take up more of the banner's width
  than it currently does (the `.cta-cell` table-cell is sized too
  conservatively right now), with text sized to match rather than a
  small button with padding around oversized text or vice versa.
- Enlarge and bump the subline's weight/contrast so it's legible at
  actual 320×50 size, not just at zoom.
- 320×50 has almost no spare room — if enlarging the button and
  subline doesn't fit alongside the mark and headline without
  crowding, the mark is the first candidate to shrink (it's already
  the least informative element at this size), not the button or
  copy. Verify legibility at actual rendered size (export the PNG
  and view it at 100%, not the HTML zoomed in a browser).

---

## 3. Creative 3 — Build B (interactive, `creative-1080x1920-interactive.html`)

### 3a. Don't drop the age question when a deep link skips ahead

Build B's per-answer deep link (`?q1=<index>`) currently lands the
user on Q2, which — combined with `?skip=entry` bypassing the
soft-entry age screen entirely — means a viewer who taps an answer
in the ad never gets asked their age at all. That's silent data loss
in a field that's genuinely used for age-normed scoring context (see
`questions.js`'s comment on `SOFT_ENTRY_QUESTION`), not just cosmetic.

Fix: when the flow is entered via this deep link, defer
`IQLY.SOFT_ENTRY_QUESTION` (q0) to the END of the quiz sequence
instead of skipping it — ask it after Q8, before the
analyzing/result transition, rather than before Q1 as in the normal
flow.

- This is a `state.js`/`main.js` change, not just a creative change:
  the flow needs a branch — normal entry asks q0 → Q1...Q8; this
  deep-link entry asks Q2...Q8 → q0 → analyzing. Implement this as a
  flag set when the `q1=<index>` param is read (e.g.
  `state.deferSoftEntry = true`), checked wherever the flow currently
  decides "quiz complete, go to analyzing" — insert q0 there instead
  of skipping it.
- Document this explicitly in two places once implemented: a comment
  in `state.js` at the branch point explaining why q0 moved (so a
  future reader doesn't "fix" it back to skipped), and a dated entry
  in `AI_WORKFLOW.md` describing the deep-link edge case and the
  decision to preserve the age question rather than drop it.
- Regression-check: confirm the NORMAL flow (no deep-link params) is
  completely unaffected — q0 still asks first, as always. Only the
  `?q1=<index>` entry path defers it.

### 3b. CTA wording — "Next Question" instead of "Start the quiz"

The large CTA button in Build B currently reads generically. Since
tapping any of the 4 answer options in this build actually submits
that answer to Q1, the natural continuation from there is the next
question, not "starting" — the quiz has, from the user's perspective,
already started inside the ad. Change the button's label to reflect
that.

- If the button in question is the per-option action itself (i.e.
  each tap effectively says "answer & continue"), "Next Question →"
  fits directly.
- If it's actually the fallback CTA for a viewer who doesn't tap a
  specific option (landing unanswered via `?skip=entry`, same as
  Build A), "Next Question" would be inaccurate there since no
  question was actually answered through that path — that case
  should keep wording consistent with Build A's fix ("Start the
  quiz →"), not "Next Question." Confirm which button this note
  refers to before applying the change, and keep the two paths'
  wording honest to what each one actually does.

---

## Verification checklist

- [ ] All 3 creatives read "2 min", consistently
- [ ] `CONFIG.copy.entry`'s subheadline updated to match "2 min" —
      no contradiction between ad claim and the screen the click
      lands on
- [ ] Quiz's actual question count/expected duration checked against
      the "2 min" claim — flagged back if not reduced to support it
- [ ] Creative 2 fits at actual 250×250 with the enlarged
      headline/subline — no clipping, no cramming
- [ ] Creative 1 fits at actual 320×50 with the enlarged
      button/subline — no clipping, no cramming; mark shrinks first
      if something has to give
- [ ] Build B: normal flow (no params) still asks q0 first, unchanged
- [ ] Build B: `?q1=<index>` deep-link flow asks Q2...Q8, then q0,
      then analyzing — verify by walking the flow end to end, not
      just reading the branch logic
- [ ] Build B's CTA wording confirmed against which button it's on
      (see 3b) and matches what that specific path actually does
- [ ] `state.js` comment + `AI_WORKFLOW.md` entry added for the
      soft-entry deferral
- [ ] Re-export all 3 PNGs only after the above are confirmed