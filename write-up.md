## Competitive Research

I audited 3 sponsored results for "free iq test" and 1 top organic
result (myiqtested.com) by completing each flow end-to-end as a user.

**Findings — sponsored competitors:**
- None used a traditional landing page. The first screen was already
  part of the quiz (e.g., a demographic question), removing the
  Landing→Start drop-off almost entirely.
- All three injected real-time percentile feedback during the quiz
  ("faster than 85% of users," "more accurate than 65%") — a
  retention mechanism that turns a long form into a live progress
  game.
- Email was requested immediately after the last question, before
  the result was revealed — leveraging peak investment (sunk cost)
  at the point of lowest friction to ask.
- Trust signals (credentials, reviews, certifications) only appeared
  on the final pricing screen — too late to build confidence before
  the ask.
- One competitor displayed a currency symbol ($) before the quiz
  even started. As a user, this was an immediate trust signal
  failure — I closed the tab and searched for an alternative.

**Findings — organic competitor (myiqtested.com):**
- Runs a freemium model: full result free, payment gated behind an
  "official certificate" upsell — not applicable to our CVR metric
  (account creation), since giving the full result free removes the
  incentive to sign up. Noted only as a future monetization
  reference, out of this challenge's scope.
- Result screen shows a categorical breakdown (not just one number),
  which is a stronger reveal mechanic than a single score.

**Trade-offs and decisions derived from this research:**

1. **Combined entry screen over multi-section landing page** — Chose
   a single screen with headline, minimal trust cue, and the first
   quiz question visible together, instead of a traditional
   multi-section landing page (hero, features, testimonials, etc.).
   Trade-off: less room to build extended context/trust before the
   ask, but removes the highest drop-off point observed across all
   3 competitors while still giving the user a half-second of
   framing before acting.

2. **Zero monetary cues before account creation** — Explicit design
   rule, directly informed by my own negative reaction as a test
   user to seeing a price indicator early. Trade-off: no upsell
   surfaced in this flow at all, even though monetization exists in
   the market (deferred to a future iteration, out of CVR scope).

3. **Mid-quiz percentile feedback** — Adopted this pattern from all
   3 competitors since it appeared consistently, suggesting it's a
   validated retention mechanic in this niche. Trade-off: adds
   complexity (needs fake benchmark data since there's no real user
   base) for expected retention gain.

4. **Email requested before result reveal, not after** — Matches
   competitor pattern; positions the ask at peak curiosity/sunk
   cost. Trade-off: some users may abandon right before seeing their
   score, but this is when conversion intent is highest.

5. **Partial result + trust badge placement** — Result screen shows
   a category breakdown with the overall score partially obscured
   (curiosity gap), and a small trust/credibility element placed
   immediately before the signup CTA — not at the top (would slow
   entry) and not only at the end (too late, as observed in
   competitor #1).


## Funnel Model & Assumptions

I modeled the flow as a 4-transition funnel before designing any
screen, so that every design decision could be tied to a specific
step-level metric rather than aesthetic preference.

| Transition                  | Assumed rate | Basis                          |
|-----------------------------|--------------|--------------------------------|
| Page visit → Quiz start     | 72%          | Paid-search engagement (~56%)  |
|                             |              | lifted by soft-entry design    |
| Quiz start → Completion     | 65%          | Interact benchmark (80M+       |
|                             |              | quiz submissions)              |
| Completion → Result screen  | 92%          | Peak momentum; technical       |
|                             |              | drop-off only                  |
| Result → Account created    | 42%          | Single-field gate; Outgrow     |
|                             |              | reports +57% opt-in for        |
|                             |              | single-field vs multi-field    |
| **Modeled CVR**             | **~18.1%**   |                                |

These are estimates, not measurements — there is no live traffic yet.
They are anchored to published quiz-funnel benchmarks and to my own
competitive audit of 3 sponsored "free iq test" results.

18% sits above the 7–12% Google Ads lead-gen benchmark. I consider
this defensible here because of near-perfect message match: the user
searched "free iq test" and receives exactly that, with no
intermediate offer.

**Bottleneck ranking (impact of a +10 percentage-point improvement on
overall CVR):**
- Result → Account:      +4.3pp  ← highest leverage
- Quiz start → Complete: +2.8pp
- Visit → Quiz start:    +2.5pp

This ranking is what drives both the design of Part 1 (trust element
and partial-reveal mechanic placed immediately before the signup CTA)
and the prioritization of the A/B tests in Part 2.

**Device split:** mobile bounce runs ~12pp higher than desktop
structurally, projecting ~16.6% CVR on mobile vs ~19.6% on desktop.
Mobile is the structurally weaker half of the funnel, which is why
responsiveness is treated as a conversion requirement here, not a
presentation one.

---

## IQly Quiz Flow — Screen Sequence (Part 1, as built)

### 1. Entry Screen
- Headline: value proposition ("Discover your IQ score")
- Subheadline: "Free · ~2 minutes" (time claim matched to actual
  flow length, including feedback/loading screens)
- Minimal trust cue: methodology reference + privacy note
  (no fabricated social proof — product has no user history yet)
- Q0 (soft-entry demographic question) visible immediately below,
  acting as the de facto CTA — no separate "Start Quiz" button
- Progress bar starts at 0% on load — it does not pre-fill before
  any user action. It only jumps forward once Q1 is answered.
  Reasoning changed from the original "endowed progress" plan: a
  bar that's already partially full before the user has done
  anything reads as a fake/decorative element rather than a
  reflection of real progress, undermining the trust framing the
  entry screen is otherwise built around.

### 2. Quiz — Q1 to Q8
- One question per screen (pattern, logic, spatial, memory,
  sequence types)
- Progress bar fills incrementally with each answer
- The answer-options area renders inside a fixed-height container,
  sized to the longest answer set across all questions, so moving
  from a short-answer question to a long-answer one causes no
  layout shift or scroll jump — mid-quiz layout jumps are a
  concrete source of rage-clicks/mis-taps on mobile
- Non-blocking toast feedback after Q3 and Q6 (e.g. "Faster than
  78% of test-takers") renders into a fixed, reserved slot in the
  layout (space is always allocated, whether or not a toast is
  showing) rather than absolutely-positioned overlay — this was
  changed after the first pass overlapped the toast with question
  content on short viewports; the reserved slot guarantees it never
  can, on any screen size
- Small streak indicator in corner for continued engagement

### 3. Loading / Labor Illusion
- 2–3 second animated sequence: "Analyzing your responses...
  Comparing against benchmark data... Calculating your profile..."
- Purpose: perceived-effort cue: raises perceived value of the
  result that follows

### 4. Partial Result Screen (with inline email gate)
- Personal framing, not just a category list: lead with
  "Your Standout Strength: [Pattern Recognition]" as the dominant
  element, secondary categories shown smaller below
- Overall standing is shown as a visual percentile curve (SVG bell
  curve with the user's position marked) instead of plain text —
  no exact number or percentile is stated. This replaced an earlier
  "locked score" placeholder; the curve communicates "you're here,
  relative to others" at a glance without needing a number to do it,
  and keeps the reveal purely visual/curiosity-driven
- Small trust badge positioned directly above the CTA (methodology
  reference, not fabricated numbers)
- The email field is inline at the bottom of this same screen, not
  a separate "See your full score" screen reached by an extra click.
  Result → Account is the steepest modeled drop-off in this funnel
  (see Bottleneck ranking above), so an unearned extra click on it
  directly worked against the flow's own stated priority. Submitting
  the email advances straight to the full result; `result_viewed`
  and `account_created` still fire as distinct tracked events at the
  same points, so step-level measurement isn't lost by removing the
  screen boundary.

### 5. Full Result Screen
- Exact IQ score + percentile rank
- Category breakdown shown as qualitative tiers (Strong / Average /
  Needs practice) rather than raw percentages. With only 1-2
  questions feeding each category, a number like "67%" implies a
  precision the underlying sample size doesn't support — that's
  false precision, not information. Tiers say the same useful thing
  (where you're relatively stronger/weaker) without the fake decimal
- Optional: minimalist archetype label (e.g. "The Pattern Seeker"),
  text + icon only — no illustrated mascots, to preserve the
  test's credibility
- Note on "no mascots": this rules out personified/cartoon figures
  specifically (a face, a character with arms and an expression) —
  not single-color geometric or line-art symbols. The site's brand
  mark (`logoMark()` in `screens.js`) is a two-lobe brain glyph in
  that same category as its original abstract circle/rect/triangle
  version: flat, single-color, no character. It replaced the abstract
  shapes (2026-09-25, see `docs/AI_WORKFLOW.md`) because a brain
  reads as a direct, immediate signal of "intelligence test" at a
  glance, where the abstract shapes required the wordmark next to
  them to mean anything — worth the tradeoff of being a more literal
  symbol than the original design's deliberately abstract stance
- Optional: "Share your result" action — generates a shareable
  card. Positioned post-conversion only, as a low-cost acquisition
  loop (K-factor) — out of the core CVR scope but noted in the
  write-up as an additional growth lever

### 6. Post-signup "Unlock more" upsell teaser (not part of measured funnel)
- Shown immediately after account creation, so it never sits in the
  path being optimized for CVR
- Demonstrates two monetization directions considered but not built:
  historical progress tracking and an AI-powered "IQ Coach" — teaser
  UI only, no payment processing
- Rendered as a real button (not a text link), since a screen whose
  entire purpose is to be clicked should look clickable
- Click-through on each option is tracked, since which direction
  users gravitate toward is itself a useful signal for a future
  iteration

---

### Reserved for Part 2 (not part of Part 1 baseline)
- **Test candidate #1**: Move the email gate earlier in the quiz
  (e.g. after Q4 instead of after Q8) — tests whether mid-quiz
  investment + partial-value FOMO increases signup rate vs. the
  full-quiz-then-gate baseline. Directly informed by the task's own
  example filename convention (`variant-1-signup-after-q3.html`).


## Deferred Scope — Noted, Not Implemented

Several ideas were considered and deliberately excluded from this
flow because they don't move the measured KPI (account creation
from ad click), but are worth noting as they inform the product
thinking behind the design:

- **Quiz navigation**: Users cannot skip questions or go back to
  change previous answers. This is intentional — each answer is a
  micro-commitment that increases completion likelihood, and
  allowing edits would undercut both that psychology and the
  perceived rigor of the test.

- **Historical comparison / retake tracking**: Storing a user's past
  results and showing improvement over time (e.g. "your IQ score
  this month vs. last") was considered as a reason account creation
  — not just email capture — has standing value beyond the initial
  session. Not built here, since it doesn't affect the funnel being
  measured, but it strengthens the case for why "create an account"
  is the right ask rather than a lighter-weight action.

- **Future monetization paths**: Two directions were considered,
  both deliberately out of scope for this CVR-focused flow: (1) a
  one-time paid "official certificate" (the pattern observed in
  organic competitor research), and (2) a subscription "IQ Coach"
  agent offering ongoing, personalized cognitive training —
  consistent with the broader shift toward AI-native, agentic
  product experiences. Neither was fully implemented (a teaser-only
  UI for both exists post-signup, see screen 6 above), since
  introducing any monetary element before account creation would
  work against the flow's actual goal, but the agent-based direction
  in particular reflects where this kind of product likely evolves
  next.
