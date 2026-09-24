# IQly Quiz Flow — Part 1 Write-up

## Competitive research

I audited 3 sponsored "free iq test" results and 1 top organic result
(myiqtested.com) end-to-end as a user. None of the sponsored
competitors used a traditional landing page — the first screen was
already part of the quiz, and all three injected real-time percentile
feedback mid-quiz to sustain engagement. All three asked for email
immediately after the last question, before revealing the result,
leveraging peak sunk-cost investment. One competitor showed a price
symbol before the quiz even started, which read as an instant trust
failure as a test user.

## Funnel model & bottleneck

| Transition               | Assumed rate | Basis |
|---------------------------|:---:|---|
| Page visit → Quiz start   | 72% | Paid-search engagement, lifted by soft-entry design |
| Quiz start → Completion   | 65% | Published quiz-funnel benchmark (80M+ submissions) |
| Completion → Result shown | 92% | Peak momentum; technical drop-off only |
| Result → Account created  | 42% | Single-field gate (vs. multi-field) |
| **Modeled CVR**           | **~18.1%** | |

**Bottleneck ranking** (impact of a +10pp improvement on overall CVR):
Result→Account **+4.3pp** (highest leverage) > Quiz start→Complete
+2.8pp > Visit→Quiz start +2.5pp. This ranking is why every Part 1
design decision below protects the Result→Account step specifically,
and why it's the first A/B test prioritized for Part 2.

## Flow

Entry screen with the first quiz question visible (no separate
landing/start step) → 8 quiz questions with mid-quiz percentile
feedback → labor-illusion loading state → partial result (visual
percentile curve, no number) with an inline email field → full result
with qualitative category tiers → post-signup upsell teaser.

## Key trade-offs

1. **Combined entry + first question, no landing page.** Removes the
   Landing→Start drop-off observed across all 3 competitors. Trade-off:
   less room for trust-building copy before the ask.
2. **Email gate is inline on the partial-result screen, not a separate
   screen/CTA.** Result→Account is the steepest modeled drop-off, so an
   unearned extra click there directly opposed the funnel's own
   priority; `result_viewed` and `account_created` still fire as
   distinct tracked events so step-level measurement isn't lost.
3. **Percentile shown as a visual curve, category scores as qualitative
   tiers (Strong/Average/Needs practice), not raw numbers.** With 1-2
   questions per category, a percentage implies false precision; the
   curve and tiers convey the same "where you stand" information
   honestly.
4. **Zero monetary cues before account creation.** Informed by my own
   negative reaction, as a test user, to a competitor showing a price
   before the quiz started. Trade-off: no upsell surfaced pre-signup at
   all — deferred to a post-signup teaser screen instead.
5. **Fixed-height answer containers and a reserved toast slot.** No
   layout shift between questions and the mid-quiz toast can never
   overlap question content, on any screen size — a mobile-specific
   fix, since mobile is the structurally weaker half of the funnel
   (~16.6% vs ~19.6% desktop CVR).

## AI usage

I used Claude across three distinct roles, not as a single "ask and
accept" loop — each with a different level of oversight.

**Research**: Claude ran web searches for published quiz-funnel and
paid-search benchmarks (Interact's 80M-submission dataset, Outgrow's
single-field-gate findings) that anchor the funnel model above. I
directed which claims needed sourcing and cross-checked the figures
before using them — the model separates benchmark-sourced numbers
from my own estimated adjustments (see funnel model caveat).

**Building**: Claude Code surfaced the `file://` CORS constraint
ruling out ES modules for a no-build flow (unprompted) and proposed
the classic-script/namespace pattern used throughout `src/`. When
implementing screens exposed that an index-walk state machine
couldn't express a mid-quiz email gate (needed for Part 2's Test 1),
it proposed a resolver function — which I required it to verify
against all 4 planned configs headlessly before accepting, not just
demo the happy path.

**Oversight**: every non-trivial decision is logged, dated, with what
was considered and why, in `AI_WORKFLOW.md` — including where I
rejected its output. The clearest case: the initial partial-result
screen used a blurred/locked exact score as the curiosity hook. I
rejected this as a dark pattern (a fake-looking blur reads as
manipulative, not curious) and directed a percentile-curve
visualization instead, which reveals real information honestly rather
than simulating a lock on data that doesn't really exist yet.