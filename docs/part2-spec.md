# Part 2 Spec — A/B Test Variants

Status: Ready to implement
Depends on: Part 1 baseline (index.html + src/ + styles/), frozen as
control since [DATE — fill in].

## Purpose

Three isolated, standalone variants of the Part 1 flow, each testing
one hypothesis. Each variant is a config override on top of the
shared src/ files — never a code fork. If any test requires touching
screens.js/state.js logic beyond reading a new config key, that's a
signal the behavior belongs in config first (see CLAUDE.md's variant
rule).

---

## Test 1 — Email Gate Timing

**File**: `variant-1-gate-after-q4.html`
**Funnel step**: Quiz progress → Account creation
**Lever**: `IQLY.CONFIG.emailGate.afterQuestionIndex: 8 → 4`
**Status**: Already stubbed in Part 1 setup — verify it still works
after Part 1 polish changes (inline email form, percentile curve,
etc.), no rebuild needed.

**Hypothesis**: Moving the email gate to mid-quiz (Q4, roughly the
midpoint) may increase signup rate by leveraging sunk-cost investment
before any value has been delivered. Competing risk: interrupting
quiz momentum at its peak could break flow and increase abandonment
instead — this is exactly why it's tested, not assumed.

**Primary KPI**: Gate-reached → Account-created rate (this variant's
gate position vs. control's).

**Guardrail KPI**: Drop-off rate in the 2 questions immediately
following the gate (Q5–Q6 in this variant), compared to control's
drop-off in its equivalent post-gate window. Rising guardrail with
rising primary = sunk-cost effect is masking a flow-break, not
confirming the hypothesis cleanly.

**Implementation notes**: no changes beyond the config override.
Confirm `IQLY.CONFIG.tracking.variantId` is set uniquely.

---

## Test 2 — Quiz Length

**File**: `variant-2-shorter-quiz.html`
**Funnel step**: Quiz start → Completion
**Lever**: `IQLY.CONFIG.flow.questionCount: 8 → 5`

**Hypothesis**: Reducing quiz length increases completion rate (lower
time-commitment, lower mid-quiz abandonment risk), at the possible
cost of perceived result depth — fewer data points behind the
category breakdown. Tests whether the completion gain outweighs any
resulting drop in signup rate from a "thinner"-feeling result.

**Primary KPI**: Quiz start → Completion rate.

**Guardrail KPI**: Result → Account-created rate (catches whether a
gain in completion comes at the cost of conversion in the next step).

**Implementation notes — required before this variant is valid**:
- Question selection must NOT be hardcoded to "first N questions."
- Add a `selectQuestions(count)` helper (scoring.js or a new
  questions-selector.js) that draws `count` questions proportionally
  across IQLY.QUESTIONS' categories.
- This decouples `flow.questionCount` from the raw size of the
  question bank — so growing the question bank later, or testing a
  different length, never silently leaves a category uncovered in
  the result breakdown.
- `flow.questionCount` stays the single source of truth for "how
  many questions this run shows."

---

## Test 3 — Result Framing

**File**: `variant-3-percentile-framing.html`
**Funnel step**: Result shown → Account creation
**Lever**: `IQLY.CONFIG.result.leadWith: 'standoutStrength' → 'percentileRank'`

**Hypothesis**: The baseline partial-result screen leads with personal
insight ("Your Standout Strength: Pattern Recognition"). An
alternative leads with competitive standing instead ("You scored
higher than most test-takers"). These appeal to different
motivations — self-understanding vs. social comparison — and it's
unclear which resonates more with a "free iq test" search audience.

**Primary KPI**: Result → Account-created rate (same gate, different
framing before it).

**Guardrail KPI**: Time-on-screen on the partial-result screen before
click — a qualitative signal for engagement vs. impulsive action,
enriching interpretation of the primary metric either direction wins.

**Implementation notes — required before this variant is valid**:
- Verify `screens.js`'s partial-result render function actually
  branches on `CONFIG.result.leadWith` today. If the config key
  exists but nothing reads it yet, that's a gap carried from Part 1 —
  wire it up: `leadWith: 'percentileRank'` should replace the
  standout-strength headline with a percentile-rank-led headline
  (copy TBD — reuse the pattern in `CONFIG.copy.partialResult`).
- Also relevant beyond this test: whichever framing wins should
  inform Part 3 creative copy — note this in the write-up.

---

## Rejected candidates (for the write-up's "why not" note)

- **Full reveal before gate** (`result.revealMode: 'full'`): overlaps
  functionally with Test 1 — both are fundamentally "when do we ask
  for email relative to value delivered." Chose Test 1 as the cleaner
  version of that question.
- **Analyzing screen on/off** (`analyzing.enabled: false`): strong
  candidate, cut only for the 3-test limit. Real trade-off (perceived
  value vs. abandonment risk during the delay) — noted as a
  next-round candidate.
- **Entry headline copy**: lowest-leverage funnel step (+2.5pp vs
  +4.3pp for Result→Account); copy tests also tend to move the needle
  less than structural changes. Deprioritized.

---

## Build checklist (for Claude Code)

- [ ] Test 1: verify existing stub still works post-Part-1-polish
- [ ] Test 2: build `selectQuestions()` helper, wire to
      `flow.questionCount`, verify no category ends up uncovered
- [ ] Test 3: verify `result.leadWith` is actually read by
      `screens.js`; wire it up if not
- [ ] All 3: unique `tracking.variantId`, double-click-verified with
      zero console errors
- [ ] Stop for review before touching the write-up