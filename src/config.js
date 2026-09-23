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
    // Screen sequence is data, not code. A variant can reorder/insert here
    // without state.js or screens.js changing at all.
    screens: ['entry', 'quiz', 'analyzing', 'partialResult', 'emailGate', 'fullResult'],
    questionCount: 8,
    // Soft-entry pattern: Q0 sits on the entry screen itself, standing in
    // for a "Start Quiz" button, to remove the landing->start drop-off
    // observed across all 3 sponsored competitors (write-up.md).
    entryShowsFirstQuestion: true,
  },

  emailGate: {
    // Number of questions answered before the gate is shown.
    // Part 1 baseline: after the full quiz (peak sunk-cost investment).
    // Test 1 candidate: move to 4 (write-up.md, "Reserved for Part 2").
    afterQuestionIndex: 8,
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
      cta: 'See your full score and percentile',
      trustBadge: 'Scored using a validated cognitive-assessment methodology',
    },
    emailGate: {
      headline: "You're one step away from your full results",
      subheadline: 'Enter your email to unlock your score, percentile, and full breakdown.',
      emailPlaceholder: 'you@example.com',
      cta: 'Unlock my results',
    },
    fullResult: {
      scoreLabel: 'Your IQ Score',
      percentileLabel: 'You scored higher than {percentile}% of test-takers',
      shareCta: 'Share your result',
    },
  },

  tracking: {
    storageKey: 'iqly_events',
    // Identifies which flow variant produced an event, so Part 1 baseline
    // and Part 2 test data stay separable in localStorage.
    variantId: 'control',
  },
};

window.IQLY = IQLY;
