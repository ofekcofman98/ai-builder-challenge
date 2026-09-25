# Final Polish Spec — Pre-Submission

Status: Ready to implement
Depends on: existing quiz flow (screens.js, config.js, tracking.js,
scoring.js), styles/tokens.css (branding pass already merged)

## Purpose

Four remaining items noticed while reviewing the deployed flow, in
priority order (top = do first if time runs out):

1. Refresh resets all progress to the start screen
2. Progress bar still has no transition animation (Tier 2 item — was
   requested once already, apparently didn't land, re-verify this time)
3. No transitional feedback after email submission — result appears
   instantly, doesn't feel like anything happened
4. Category-level right/wrong report — collapsible, blurred, locked
   behind pricing (new feature, friend's suggestion)

---

## 1. Persist progress across refresh

**Problem**: refreshing mid-quiz (even by accident) drops the user back
to the entry screen with no memory of their answers or position.

**Fix**: save quiz state to `localStorage` on every answer, restore it
on load if present.

**What to persist**: current question index, answers given so far,
which variant is active (if applicable), and whether the user already
reached/passed the email gate. Do NOT persist past the point of
account creation / full result — once someone's completed the flow, a
fresh visit should start clean, not perpetually resume a finished
session.

**Restore behavior**: on page load, check for saved state. If present
and incomplete, skip straight to the question they were on (not
back to Q1) with previously-given answers already applied to internal
state (so the score at the end is still correct). If the saved state
looks stale or malformed, fail safe — start fresh rather than crash.

**Clear the saved state**: once the user reaches full-result /
account-created, or if they explicitly restart (if a restart control
exists).

**Implementation notes**: check whether `tracking.js` already has a
storage-key convention to reuse rather than inventing a second
localStorage key scheme.

---

## 2. Progress bar transition (re-verify)

**Problem**: the progress bar fill still jumps instantly between
questions instead of animating.

**Fix**: add a CSS transition (`width`, ease, ~300ms) on the fill
element.

**This was requested once before and apparently wasn't actually
applied** — before making the change, grep the CSS for the fill
element's selector and confirm there's genuinely no transition
currently set, then add it and **visually verify** (via the existing
Puppeteer convention: capture two consecutive states, or at minimum
confirm the CSS rule is present in the rendered/computed style) rather
than reporting done from just having written the line.

---

## 3. Transitional feedback after email submission

**Problem**: entering an email and submitting jumps to the result
screen with no transition — doesn't feel like the system "did"
anything with the input.

**Fix**: add a brief (600ms–1.2s) processing state between email
submit and result display — e.g. a short loading/progress indicator
with copy like "Calculating your results..." or similar (match
existing copy tone from `copy.js`/`config.js`), then transition to the
result screen.

**Framing note**: this is legitimate UX pacing, not deception — the
email genuinely is being processed (account creation), the delay just
makes that visible instead of instant. Keep the copy honest about what
it's doing.

**Implementation notes**: reuse existing transition/animation
conventions already in the codebase (check how screen transitions are
handled elsewhere in screens.js) rather than introducing a new
animation pattern for this one moment.

---

## 4. Locked category breakdown (new feature)

**Problem**: no way to preview what a paid category-level report would
contain — pricing screen currently sells the feature abstractly.

**Fix**: after email submission (partial-result screen, same point
where the score/pattern is already shown), add a collapsible section
listing each quiz category. Clicking a category expands a **blurred**
list styled as locked (lock icon), and clicking the blurred/locked
content navigates to the pricing screen.

**Do NOT fabricate blurred placeholder text.** Use the real per-
category right/wrong data already computed in `scoring.js` — blur the
actual computed content (e.g. `<div class="blurred">{{real content}}</div>`
with a CSS blur filter), not lorem-ipsum-style fake text. Real content
blurred reads as a genuine teaser; fake content blurred reads as
fabricated the moment anyone inspects it.

**Consistency note for the write-up — do not skip this**: this
project's `AI_WORKFLOW.md` already documents a decision to reject
blur/lock treatment on the score at the partial-result screen,
specifically because it was pre-conversion and read as a dark pattern.
This new locked section is NOT the same case — it sits **after** email
submission (post-conversion) and gates a genuine premium feature
rather than obscuring something that should be free. The write-up (or
an AI_WORKFLOW.md entry) must state this distinction explicitly, or a
reviewer who reads both decisions back to back will read it as an
inconsistency rather than a deliberate pre/post-conversion boundary.

**Where this sits in the funnel / measurement**: this interaction is
entirely post-signup, so it sits outside the CVR measured by Part 2's
tests. Do not present it in the write-up as a CVR improvement — it's a
monetization/retention lever, a separate claim.

**Pricing screen tie-in**: since this feature is what unlocks on the
pricing screen, this is also the natural place to note (not
necessarily build, if time-limited) that the category-report feature
could be explicitly named as a paid-tier benefit on the pricing
screen's feature list.

---

## Priority if time is short

1. Progress bar animation (trivial, already scoped once)
2. Refresh persistence (real bug, but scoped narrowly above — not full
   session resume, just quiz position + answers)
3. Post-email transitional state (small, high perceived-value payoff)
4. Locked category report (largest scope — cut this first if time
   runs out; the pricing screen already sells the concept without it)

## Build checklist (for Claude Code)

- [ ] Quiz state persists to localStorage on each answer; refresh
      mid-quiz resumes at the correct question, not the start screen
- [ ] Persisted state clears on full completion; stale/malformed state
      fails safe to a fresh start
- [ ] Progress bar fill has a verified CSS transition (checked, not
      assumed already present)
- [ ] Post-email-submit transitional state added (600ms–1.2s), copy
      matches existing tone
- [ ] Category breakdown section added to partial-result screen:
      collapsible, real per-category data (not fake text), blur + lock
      styling, click-through to pricing
- [ ] AI_WORKFLOW.md entry (or write-up note) explicitly distinguishes
      this lock treatment from the earlier-rejected pre-conversion
      blur/lock decision
- [ ] Verified at 375px and 1280px via the existing Puppeteer
      convention
- [ ] Stop for review before considering this done