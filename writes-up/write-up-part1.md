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

//? percentages here are necessary? or just numbers?

**Bottleneck ranking (impact of a +10pp improvement on overall CVR):**
- Result → Account:      +4.3pp  ← highest leverage 
- Quiz start → Complete: +2.8pp
- Visit → Quiz start:    +2.5pp

//? what is pp ?

This ranking is what drives both the design of Part 1 (trust element
and partial-reveal mechanic placed immediately before the signup CTA)
and the prioritization of the A/B tests in Part 2.

**Device split:** mobile bounce runs ~12pp higher than desktop
structurally, projecting ~16.6% CVR on mobile vs ~19.6% on desktop.
Mobile is the structurally weaker half of the funnel, which is why
responsiveness is treated as a conversion requirement here, not a
presentation one.

---

## IQly Quiz Flow — Screen Sequence (Part 1)

### 1. Entry Screen
- Headline: value proposition ("Discover your IQ score")
- Subheadline: "Free · ~2 minutes" (time claim matched to actual
  flow length, including feedback/loading screens)
- Minimal trust cue: methodology reference + privacy note
  (no fabricated social proof — product has no user history yet)
- Q0 (soft-entry demographic question) visible immediately below,
  acting as the de facto CTA — no separate "Start Quiz" button
- Progress bar initialized at ~15% (endowed progress effect)

### 2. Quiz — Q1 to Q8
- One question per screen (pattern, logic, spatial, memory,
  sequence types)
- Progress bar fills incrementally with each answer
- Non-blocking toast feedback after Q3 and Q6 (e.g. "Faster than
  78% of test-takers") — slides in above the question, auto-dismiss,
  never overlays answer options
- Small streak indicator in corner for continued engagement

### 3. Loading / Labor Illusion
- 2–3 second animated sequence: "Analyzing your responses...
  Comparing against benchmark data... Calculating your profile..."
- Purpose: perceived-effort cue: raises perceived value of the
  result that follows

### 4. Partial Result Screen
- Personal framing, not just a category list: lead with
  "Your Standout Strength: [Pattern Recognition]" as the dominant
  element, secondary categories shown smaller below
- Small trust badge positioned directly above the CTA (methodology
  reference, not fabricated numbers)
- No numeric score or percentile shown yet
- CTA: "See your full score and percentile"

### 5. Email Gate
- Single field: email only (no password/multi-field form)
- Zero monetary cues anywhere on this screen
- Framed as unlocking value already earned, not a paywall

### 6. Full Result Screen
- Exact IQ score + percentile rank
- Full category breakdown
- Optional: minimalist archetype label (e.g. "The Pattern Seeker"),
  text + icon only — no illustrated mascots, to preserve the
  test's credibility
- Optional: "Share your result" action — generates a shareable
  card. Positioned post-conversion only, as a low-cost acquisition
  loop (K-factor) — out of the core CVR scope but noted in the
  write-up as an additional growth lever

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
  product experiences. Neither was implemented, since introducing
  any monetary element before account creation would work against
  the flow's actual goal, but the agent-based direction in
  particular reflects where this kind of product likely evolves
  next.

  A lightweight post-signup upsell screen was added (not part of the
  measured funnel, since it appears only after account creation) to
  demonstrate the two monetization directions considered: historical
  progress tracking and an AI-powered "IQ Coach." Both are shown as
  teaser UI only — no payment processing was built, as this is
  explicitly out of the CVR scope for this challenge. Click-through on
  each option is tracked, since which direction users gravitate toward
  is itself a useful signal for a future iteration.