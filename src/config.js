/*
  config.js — IQLY.CONFIG: the entire flow shape + every copy string.

  This is the single surface Part 2 variants are allowed to touch. screens.js
  and state.js must read from here rather than hardcoding numbers, strings,
  or ordering — that's what turns "test a hypothesis" into "override one
  field" instead of "duplicate and hand-edit the flow".
*/

var IQLY = window.IQLY || {};

IQLY.CONFIG = {
  flow: {
    // This is the BASE HAPPY PATH ONLY — entry through the result reveal
    // assuming email is never gated mid-quiz. It intentionally does NOT
    // include 'emailGate': that screen's position is decided fresh on
    // every transition by state.js's resolver, driven entirely by
    // emailGate.afterQuestionIndex/position + result.revealMode below.
    // That's what lets Test 1 move the gate mid-quiz, or a reveal-mode
    // variant move it after the result, with zero code changes.
    screens: ['entry', 'quiz', 'analyzing', 'partialResult', 'fullResult'],
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

  copy: {
    entry: {
      headline: 'Discover your IQ score',
      subheadline: 'Free · about 3 minutes',
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
    partialResult: {
      standoutLabel: 'Your Standout Strength',
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
      headline: "You're one step away from your full results",
      subheadline: 'Enter your email to unlock your score, percentile, and full breakdown.',
      emailPlaceholder: 'you@example.com',
      cta: 'Unlock my results',
      invalidEmail: 'Enter a valid email to continue.',
    },
    fullResult: {
      scoreLabel: 'Your IQ Score',
      percentileLabel: 'You scored higher than {percentile}% of test-takers',
      archetypeLabel: 'Your Archetype',
      shareCta: 'Share your result',
      shareCopiedMessage: 'Result copied — paste it anywhere!',
    },
    // Wording for scoring.js's categoryLabel() tiers — replaces a raw
    // percentage, which is falsely precise given ~1-2 questions/category.
    categoryLabels: {
      strong: 'Strong',
      average: 'Average',
      needsPractice: 'Needs practice',
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
};

window.IQLY = IQLY;
