# IQly Quiz Flow — Part 2: A/B Test Ideation

All three tests target the funnel's highest-leverage steps, identified
in the Part 1 funnel model (Result→Account: +4.3pp per 10pp improved;
Quiz start→Complete: +2.8pp). Each isolates exactly one variable
against the Part 1 baseline (control).

## Test 1 — Email Gate Timing
**Funnel step**: Quiz progress → Account creation
**Variant**: `variant-1-gate-after-q4.html`

Moving the email gate from after Q8 to after Q4 tests whether
mid-quiz sunk-cost investment increases signup rate more than asking
after full completion. The competing risk is real: interrupting quiz
momentum at its peak could break flow and increase abandonment
instead of reducing it — which is exactly why this is tested rather
than assumed. 
**Primary KPI**: gate-reached → account-created rate,
compared to control's Result→Account rate. 
**Guardrail KPI**:
drop-off in the two questions immediately following the gate — if
this rises alongside the primary metric, the sunk-cost effect is
likely masking a flow-break rather than confirming the hypothesis
cleanly.

## Test 2 — Quiz Length
**Funnel step**: Quiz start → Completion
**Variant**: `variant-2-shorter-quiz.html`

Reducing the quiz from 8 to 5 questions tests whether a shorter time
commitment increases completion rate enough to offset any drop in
perceived result depth — fewer data points behind the category
breakdown could make the result feel "thinner" and less worth
converting on. Questions are drawn proportionally across all five
categories (not simply the first five), so the shorter version still
produces a complete category breakdown. 
**Primary KPI**: quiz start → completion rate. 
**Guardrail KPI**: result → account-created
rate, to confirm a completion-rate gain doesn't come at the cost of
conversion in the very next step.

## Test 3 — Result Framing
**Funnel step**: Result shown → Account creation
**Variant**: `variant-3-percentile-framing.html`

The baseline partial-result screen leads with personal insight
("Your Standout Strength: Pattern Recognition"). This variant leads
with competitive standing instead ("Your Ranking — higher than most
test-takers"). These appeal to different motivations —
self-understanding vs. social comparison — and it's unclear which
resonates more with a "free iq test" search audience, who may be
driven primarily by curiosity about relative standing rather than
self-insight.
**Primary KPI**: result → account-created rate (same
gate, different framing before it). 
**Guardrail KPI**: time-on-screen before click, as a qualitative signal distinguishing engaged
consideration from impulsive action — useful context for interpreting
the primary metric whichever way it moves. Whichever framing wins
should also inform Part 3 creative copy, since the two speak to the
same underlying value proposition from different angles.

## Why not the other candidates
Two other levers were considered and cut: showing the full result
before the gate (`revealMode: 'full'`) functionally overlaps Test 1 —
both ultimately test "when do we ask for email relative to value
delivered," and Test 1 is the cleaner version of that question.
Removing the mid-quiz percentile toasts was deprioritized because it's
a defensive test (confirms an existing mechanic isn't harmful) rather
than an offensive one (could reveal a genuine improvement) — a weaker
bet given only three test slots.