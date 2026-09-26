/*
  config.js — IQLY.CONFIG: the entire flow shape + every copy string.

  This is the single surface Part 2 variants are allowed to touch. screens.js
  and state.js must read from here rather than hardcoding numbers, strings,
  or ordering — that's what turns "test a hypothesis" into "override one
  field" instead of "duplicate and hand-edit the flow".
*/

var IQLY = window.IQLY || {};

IQLY.CONFIG = {
  // Product name used everywhere the wordmark renders as text (quiz header
  // brand lockup, etc.) — one place to change it, per this file's own rule
  // against hardcoded strings.
  brand: {
    name: 'IQly',
  },

  flow: {
    // This is the BASE HAPPY PATH ONLY — entry through the result reveal
    // assuming email is never gated mid-quiz. It intentionally does NOT
    // include 'emailGate': that screen's position is decided fresh on
    // every transition by state.js's resolver, driven entirely by
    // emailGate.afterQuestionIndex/position + result.revealMode below.
    // That's what lets Test 1 move the gate mid-quiz, or a reveal-mode
    // variant move it after the result, with zero code changes.
    // 'upsell' is listed for reference only — it's reached via an
    // explicit user click (fullResult's "Unlock more"), not the resolver,
    // since it's an optional post-signup detour, not a funnel step.
    screens: ['entry', 'quiz', 'analyzing', 'partialResult', 'fullResult', 'upsell'],
    questionCount: 8,
    // Soft-entry pattern: Q0 sits on the entry screen itself, standing in
    // for a "Start Quiz" button, to remove the landing->start drop-off
    // observed across all 3 sponsored competitors (write-up.md).
    entryShowsFirstQuestion: true,
  },

  emailGate: {
    // Number of answered questions at which the gate becomes due. A value
    // >= questionCount means "after the quiz" (baseline); a lower value
    // means "mid-quiz", which always interrupts and then resumes the quiz
    // regardless of `position` below (Test 1: after the full quiz -> 4).
    afterQuestionIndex: 8,
    // For a post-quiz gate only: show it before the result reveal
    // (baseline — holds the curiosity gap from a partial reveal) or after
    // it (only meaningful paired with result.revealMode: 'full').
    position: 'beforeResult', // 'beforeResult' | 'afterResult'
    fields: ['email'],
    requirePassword: false,
  },

  progress: {
    // Endowed progress effect: users persist further when a task appears
    // partially complete from the start.
    initialPercent: 15,
    showStreak: true,
  },

  feedback: {
    // Non-blocking toast keyed by "answered this many questions".
    // Adopted from all 3 competitors audited — a validated retention
    // mechanic in this niche (write-up.md).
    toastsAfterQuestion: {
      3: 'speedPercentile',
      6: 'accuracyPercentile',
    },
    autoDismissMs: 3000,
  },

  analyzing: {
    // Labor illusion: a brief animated "processing" sequence raises the
    // perceived value of the result that follows.
    enabled: true,
    stepDurationMs: 900,
    steps: ['analyzingResponses', 'comparingBenchmark', 'calculatingProfile'],
  },

  result: {
    // Partial reveal creates a curiosity gap that the email gate resolves.
    revealMode: 'partial', // 'partial' | 'full'
    leadWith: 'standoutStrength',
    showTrustBadgeBeforeCta: true,
  },

  processingResult: {
    // Brief, honest pacing between email submit and the result reveal —
    // the account creation genuinely is being processed here, this just
    // makes that visible instead of an instant, "did anything happen?"
    // jump straight to the result (docs/fixes.md item 3). Mirrors the
    // analyzing screen's labor-illusion timing, owned by render.js the
    // same way.
    durationMs: 900,
  },

  copy: {
    entry: {
      headline: 'Discover your IQ score',
      // Exact "2 min" phrasing (not "about 2 minutes") to match the ad
      // creatives' wording verbatim (docs/creative-fixes.md item 0) — a
      // visitor who just read "2 min" in the ad shouldn't land on a
      // softened claim that reads as a different number.
      subheadline: 'Free · 2 min',
      trustCue: 'Based on established cognitive-testing methodology. We never sell your data.',
    },
    quiz: {
      questionLabel: 'Question {current} of {total}',
    },
    feedback: {
      speedPercentile: 'Faster than 78% of test-takers',
      accuracyPercentile: 'More accurate than 65% of test-takers',
    },
    analyzing: {
      analyzingResponses: 'Analyzing your responses...',
      comparingBenchmark: 'Comparing against benchmark data...',
      calculatingProfile: 'Calculating your profile...',
    },
    processingResult: {
      message: 'Calculating your results...',
      // Mid-quiz email submit (Test 1) resumes the quiz, not a result — reusing
      // "Calculating your results..." here would fabricate a processing step
      // that isn't happening. See render.js handleEmailSubmit().
      messageMidQuiz: 'Saving...',
    },
    partialResult: {
      standoutLabel: 'Your Standout Strength',
      // Part 2 Test 3 (result.leadWith: 'percentileRank') swaps the
      // headline card above from personal insight to competitive standing —
      // self-understanding vs. social-comparison motivation (docs/part2-spec.md).
      percentileLeadLabel: 'Your Ranking',
      percentileLeadHeadline: 'Higher than {percentile}% of test-takers',
      // Frames the curve visual below without giving away the number it
      // represents — the position is the teaser, not the label.
      percentileTeaserLabel: 'See where you rank',
      percentileMarkerLabel: 'You',
      // No separate CTA copy: the email field is inline on this screen
      // (copy.emailGate.headline/cta double as its own copy) — no
      // intermediate click on the steepest modeled funnel drop-off.
      trustBadge: 'Scored using a validated cognitive-assessment methodology',
    },
    emailGate: {
      // End-of-quiz gate (control/baseline): submitting reveals the
      // already-computed partial result, so "unlock" framing is accurate.
      headline: "You're one step away from your full results",
      subheadline: 'Enter your email to unlock your score, percentile, and full breakdown.',
      emailPlaceholder: 'you@example.com',
      cta: 'Unlock my results',
      invalidEmail: 'Enter a valid email to continue.',
      // Mid-quiz gate only (Test 1): no score/percentile exists yet at this
      // point, so the reassurance names real remaining effort instead of
      // implying a result — reinforces momentum right where post-gate
      // drop-off is the known risk (write-up.md).
      reassurance: "Just a few more questions, then your full results.",
      // Mid-quiz override (state.isMidQuizGate()): submitting here returns
      // the user to the next question, not a result, so headline/subheadline/
      // cta must not promise an unlock that doesn't exist yet. Overrides only
      // what actually differs — emailPlaceholder/invalidEmail/reassurance are
      // shared as-is (see screens.js emailGate()).
      midQuiz: {
        headline: 'Enter your email to continue',
        subheadline: 'Save your email now — you can pick up right where you left off.',
        cta: 'Continue the quiz',
      },
    },
    fullResult: {
      scoreLabel: 'Your IQ Score',
      percentileLabel: 'You scored higher than {percentile}% of test-takers',
      archetypeLabel: 'Your Archetype',
      shareCta: 'Share your result',
      shareCopiedMessage: 'Result copied — paste it anywhere!',
      // Benefit-led, not urgency-led: names what's on the other side
      // (growth/mastery motivation) rather than pressuring a decision —
      // stays consistent with the "no pressure" framing on the upsell
      // screen itself.
      unlockMoreCta: 'See how you improve over time →',
      // Locked category report (docs/fixes.md item 4): sits post-signup on
      // this screen specifically — unlike the pre-conversion blur/lock
      // rejected for the score itself (write-up-part1.md's decision log),
      // this gates a genuinely deeper tier of detail (exact right/wrong
      // counts) behind a real premium feature, on a screen the user only
      // reaches after converting. See AI_WORKFLOW.md.
      categoryReportToggle: 'See your exact right/wrong breakdown',
      categoryReportUnlockLabel: 'Unlock full breakdown',
    },
    // Wording for scoring.js's categoryLabel() tiers — replaces a raw
    // percentage, which is falsely precise given ~1-2 questions/category.
    categoryLabels: {
      strong: 'Strong',
      average: 'Average',
      needsPractice: 'Needs practice',
    },
    // Post-signup upsell teaser (not a real payment flow — see
    // render.js's handleSelectPlan). No urgency/countdown copy anywhere
    // here by design: it would clash with the credibility the flow spends
    // the whole quiz building.
    upsell: {
      headline: 'Unlock more with IQly',
      subheadline: 'Optional add-ons — no pressure.',
      maybeLater: 'Maybe later',
      comingSoon: 'Coming soon',
      // Object key order is display order (progress first, then the more
      // aspirational coaching tier) — iterated via Object.keys in
      // screens.js, same pattern scoring.js already relies on for
      // categories.
      plans: {
        progress: {
          title: 'Track Your Progress',
          // Names the category breakdown explicitly (docs/fixes.md item 4's
          // pricing tie-in note) — it's what the locked teaser on
          // partialResult already showed a glimpse of, so this plan is
          // naming a benefit the user has already seen, not a new pitch.
          description: 'Retake the test over time, see your IQ trend, and unlock your full category-by-category breakdown.',
          price: '$9/mo',
          cta: 'Get started',
        },
        coach: {
          title: 'IQ Coach',
          badge: 'Premium',
          description: 'AI-powered, personalized cognitive training.',
          price: '$19/mo',
          cta: 'Get started',
        },
      },
    },
  },

  // Text + icon only, no illustrated mascots — keeps the test's credibility
  // intact per write-up.md. Keyed by scoring.js's category names.
  archetypes: {
    pattern: { label: 'The Pattern Seeker', icon: '◈' },
    logic: { label: 'The Logician', icon: '△' },
    spatial: { label: 'The Spatial Thinker', icon: '▢' },
    sequence: { label: 'The Sequencer', icon: '⇉' },
    memory: { label: 'The Retainer', icon: '◉' },
  },

  tracking: {
    storageKey: 'iqly_events',
    // Identifies which flow variant produced an event, so Part 1 baseline
    // and Part 2 test data stay separable in localStorage.
    variantId: 'control',
  },

  persistence: {
    // Separate key from tracking.storageKey: this one is read back and
    // validated to resume a session, not just appended to as a log.
    storageKey: 'iqly_progress',
  },
};

window.IQLY = IQLY;
