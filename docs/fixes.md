some questions with image - moving the answers buttons down - they should be in the same place.

"Question x of y" should be right above the progress bar.
the progress bar should be more interactive (gentle animation when progressing)
should we add "x% Complete"? near the ""Question x of y"?
OR - changing the progress bar (from simple bar to some wizard component - the numbers are inside the component)

should we show category for each question? 

the feedback should be more user-friendly (now it has black backgorund - maybe green is better and it should have motion)

the graph appears before the email but not shown after the email...

more questions per category

random them 

in the first result screen - you need to scroll down to enter the email - I think we should think more about the layout and if it all should be in "one screen size" without scrolling - or in the other hand - make some "landing page" with sections to show what you can get by entering the email 

when refreshing - it start all over again with no memory - should we use localStorage, with option to "start again"? 

The question themself: need to be clear and readable.
sequences need to be in new line, the missing part should be marked (user-friendly).



# Polish Spec — Post Part 2

## Tier 1 — Bugs (fix now, no discussion needed)
- Fixed-height answer container: extend to cover image questions too
- Sequence questions: line-break + visually mark the missing element

## Tier 2 — Cheap, clear-value polish — CLOSED (2026-09-25)
- "Question X of Y" positioned directly above progress bar — done (pre-existing)
- Gentle CSS transition animation on progress bar fill — done (`components.css`
  `.progress-fill`'s `transition: width var(--duration-base) ease`)
- Partial-result screen: trim breakdown height so email field sits
  closer to top (no landing-page-with-sections — stays consistent
  with the rest of the flow's minimalism) — done (pre-existing)

## Tier 3 — Blocked on a decision from me — CLOSED (2026-09-25)
- Feedback toast color/motion: branding direction resolved (navy accent +
  Space Grotesk/Geist Sans, see docs/AI_WORKFLOW.md 2026-09-25 entry). Toast
  now uses `var(--color-success)`/`var(--color-success-bg)` (was black) with
  a fade + slight slide-in on show, matching `.toast-slot-text`'s existing
  transition convention.

## Tier 4 — Nice-to-have, only if time remains after Part 3
- Wizard-style progress component (redesign, not a fix)
- Per-question category label
- Percentile curve shown again post-email with the real number marked
- More questions per category + question-order randomization (paired —
  low value separately, do together or skip)
- Basic localStorage persistence + "start over" button

## Explicitly rejected
- Landing-page-with-sections for partial result — contradicts the
  minimalist, no-extra-friction pattern used throughout the rest of
  the flow