# IQly Ad Creatives — Part 3 Write-up

Three creative sizes, three different funnel roles — not the same
message scaled up. Each size's information budget dictated a
different job: the banner has to be read and clicked in well under a
second, the square banner has room for exactly one real hook, and the
full-screen format has enough space to show an actual quiz question
and start the funnel a step early. All three share the same visual
mark, the same design tokens as the live flow, and click through to
the real entry point — never an invented landing experience the quiz
itself doesn't deliver.

## Creative 1 — Banner (320×50)

At this size there's room for roughly three or four words alongside
the mark and CTA, so the copy carries only what actually moves a
click: the value claim ("What's your IQ?") and the cost/time signal
("Free · 2 min"), with a real button for affordance even though the
whole banner is one clickthrough. The time claim matches the entry
screen's own "about 2 minutes" rather than promising something
shorter — a banner that overpromises speed just moves the trust
failure from first load to mid-quiz instead of removing it.

## Creative 2 — Square Banner (250×250)

The first version of this creative led with an actual pattern-
recognition question rendered as an icon grid. Built and reviewed,
it didn't work: the specific pattern chosen had an answer visible at
a glance, which closes the curiosity gap instead of opening it — the
viewer already knows the answer before reading the CTA, so "Find out"
promises something already delivered for free. Replaced with a
self-insight headline ("What's your cognitive strength?") that
mirrors the live flow's own partial-result framing — an answer that
genuinely can't be known by looking at the ad. The subline states
"IQ Test" explicitly, since this campaign runs on exact-match search
keywords ("free iq test" / "iq test") and a headline built entirely
around "cognitive strength" would otherwise lose message match with
what the visitor just typed. "Free" moved from a small subline into
the CTA itself ("Try Free") — it's the strongest objection-remover
this size has, and it was under-selling itself as gray secondary
text.

## Creative 3 — Full-Screen Mobile (1080×1920)

This format has room to show a real quiz question with its answer
options, so it doubles as a funnel head-start rather than just a
larger ad. The single click-through target skips straight to Q1 of
the live quiz instead of the entry screen — cutting a full step out
of the funnel for traffic that arrives through this creative
specifically. A served image ad has exactly one click-through URL
for the whole image, so a per-answer deep link (tap "8", land
already answered) isn't possible as the primary deliverable; that
fuller mechanism exists as a bonus interactive HTML build alongside
the required PNG, not in place of it. The featured question is a 3×3
arithmetic matrix (each row's third cell is the sum of the first
two) rather than a simple count-up sequence — a genuine one-rule
puzzle that rewards a second look, matched to a placement with enough
attention-space to earn it. Copy is ordered deliberately: headline
and a "Free" badge share one row, a short challenge line ("Most people miss this one") 
sits right before the puzzle to build desire before
the payoff, and the CTA ("Start the quiz →") describes exactly what
the tap does rather than implying an in-ad interaction that doesn't
exist.

## Shared building blocks

All three creatives are self-contained HTML files that read
`styles/tokens.css` directly, so colors, radii, and type scale can
never drift from the live product — and pull real question content
from `src/questions.js` at runtime rather than retyping it, so what's
teased is always what's actually asked post-click. The mark is the
same SVG used on the live entry screen; no separate creative-only
branding was introduced.

## AI usage

Claude Code caught two rendering-pipeline defects mid-build that
weren't visible from reading the code: the export renderer's CSS
engine silently drops `var()` custom properties (resolved with an
export-time token substitution pass, keeping the checked-in HTML on
real, browser-correct `var()`), and an icon-sizing bug where each
option's SVG canvas was cropped to its own shape count, so a
single-shape option stretched to fill the same display size as a
three-shape option and read as visually larger despite an identical
absolute scale — fixed by computing one shared canvas size per
question. Both are logged in `AI_WORKFLOW.md`.