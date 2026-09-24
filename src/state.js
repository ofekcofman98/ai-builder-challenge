/*
  state.js — IQLY.state: the single source of truth for "which screen am I
  on" plus collected answers/email. This is a resolver-based state machine,
  not ad-hoc DOM toggling: render.js/screens.js read from it, but only
  state.js writes to it, and it never touches the DOM.

  Why a resolver and not an index walk: CONFIG.flow.screens is only the
  BASE happy path (entry -> quiz -> analyzing -> partialResult ->
  fullResult). The email gate is NOT in that array — its position is
  decided fresh, every transition, from CONFIG.emailGate. That's what lets
  a Part 2 variant move the gate from after Q8 to after Q4 (interrupting
  the quiz mid-way, then resuming it), or move it to after a full reveal
  instead of before a partial one, purely by editing CONFIG — zero changes
  to this file.

  Gate-trigger model: the gate is due exactly once, the first time answers
  reach `min(afterQuestionIndex, questionCount)`. If that threshold is
  below questionCount, the trigger point falls mid-quiz and always
  interrupts it (Test 1's mechanism). If it equals questionCount, the
  trigger point falls at quiz completion, and CONFIG.emailGate.position
  then decides whether it gates the result screen before or after it is
  shown.
*/

var IQLY = window.IQLY || {};

IQLY.state = (function () {
  var current = {
    screen: 'entry',
    answers: [],
    softEntryAnswer: null,
    emailCaptured: false,
  };

  function questionCount() {
    return IQLY.CONFIG.flow.questionCount;
  }

  // Memoized: same subset must stay stable across a run (state.js decides
  // *which* questions were asked; scoring.js independently re-derives the
  // identical subset from the same deterministic selectQuestions() call for
  // category totals — see scoring.js).
  var activeQuestions = null;
  function getActiveQuestions() {
    if (!activeQuestions) {
      activeQuestions = IQLY.selectQuestions(questionCount());
    }
    return activeQuestions;
  }

  function questionsRemain() {
    return current.answers.length < questionCount();
  }

  function gateThreshold() {
    return Math.min(IQLY.CONFIG.emailGate.afterQuestionIndex, questionCount());
  }

  function isMidQuizGate() {
    return gateThreshold() < questionCount();
  }

  function isGateDueNow() {
    return !current.emailCaptured && current.answers.length === gateThreshold();
  }

  function revealIsFull() {
    return IQLY.CONFIG.result.revealMode === 'full';
  }

  function gatePosition() {
    return IQLY.CONFIG.emailGate.position; // 'beforeResult' | 'afterResult'
  }

  // Pure function of (current, CONFIG) -> next screen name. No side effects.
  function resolveNextScreen() {
    switch (current.screen) {
      case 'entry':
        return 'quiz';

      case 'quiz':
        // Only a mid-quiz threshold interrupts the quiz itself — a
        // post-quiz threshold is resolved later, relative to the result
        // reveal, via CONFIG.emailGate.position (see 'analyzing' below).
        if (isGateDueNow() && isMidQuizGate()) return 'emailGate';
        if (questionsRemain()) return 'quiz';
        return 'analyzing';

      case 'emailGate':
        // Fired mid-quiz: resume the remaining questions. Otherwise the
        // gate is fully resolved and the user has earned the full result,
        // regardless of which screen sent them here (analyzing,
        // partialResult, or fullResult for an afterResult-position gate).
        if (questionsRemain()) return 'quiz';
        return 'fullResult';

      case 'analyzing':
        if (current.emailCaptured) return 'fullResult';
        if (revealIsFull()) {
          // A full reveal must not show the score ungated — gate first.
          return gatePosition() === 'beforeResult' ? 'emailGate' : 'fullResult';
        }
        return 'partialResult';

      case 'partialResult':
        // The email field is inline on this screen now (no separate
        // emailGate click) — stays put until email is actually captured.
        return current.emailCaptured ? 'fullResult' : 'partialResult';

      case 'fullResult':
        // Reached ungated (full reveal + afterResult position): the gate
        // still needs to be shown once, right after the reveal.
        if (isGateDueNow() && gatePosition() === 'afterResult') return 'emailGate';
        return 'fullResult'; // terminal

      case 'upsell':
        return 'upsell'; // only left via dismissUpsell(), below

      default:
        return 'entry';
    }
  }

  function getCurrentScreen() {
    return current.screen;
  }

  function getCurrentQuestion() {
    return getActiveQuestions()[current.answers.length];
  }

  function recordSoftEntry(value) {
    current.softEntryAnswer = value;
  }

  function recordAnswer(answer) {
    current.answers.push(answer);
  }

  function recordEmail(email) {
    current.emailCaptured = true;
  }

  function advance() {
    current.screen = resolveNextScreen();
  }

  // upsell is a user-chosen detour off the resolver's forward-only path,
  // not a CONFIG-driven branch — it's reached from fullResult by explicit
  // click and left the same way, so it's a direct jump rather than
  // something resolveNextScreen() needs to decide.
  function viewUpsell() {
    current.screen = 'upsell';
  }

  function dismissUpsell() {
    current.screen = 'fullResult';
  }

  function getProgressPercent() {
    var answered = current.answers.length;
    // 0% until the user has actually done something — the endowed-progress
    // bump has to follow a real action, not precede it, or it reads as
    // "I already started" on a screen the user hasn't engaged with yet.
    if (answered === 0) return 0;

    var total = questionCount();
    var base = IQLY.CONFIG.progress.initialPercent;
    // Jumps to exactly `base` right after question 1, then scales linearly
    // so the bar lands on exactly 100% at the last question.
    var span = Math.max(total - 1, 1);
    var earned = (100 - base) * ((answered - 1) / span);
    return Math.round(base + earned);
  }

  function getStreak() {
    // Streak counts questions answered in a row, never correctness —
    // telling someone mid-test they're "wrong" is the fastest way to
    // lose the quiz-completion transition this metric exists to protect.
    return current.answers.length;
  }

  function getResult() {
    return IQLY.scoring.computeResult(current.answers);
  }

  function getAnswers() {
    return current.answers.slice();
  }

  function reset() {
    current = {
      screen: 'entry',
      answers: [],
      softEntryAnswer: null,
      emailCaptured: false,
    };
    activeQuestions = null;
  }

  return {
    getCurrentScreen: getCurrentScreen,
    getCurrentQuestion: getCurrentQuestion,
    recordSoftEntry: recordSoftEntry,
    recordAnswer: recordAnswer,
    recordEmail: recordEmail,
    advance: advance,
    viewUpsell: viewUpsell,
    dismissUpsell: dismissUpsell,
    getProgressPercent: getProgressPercent,
    getStreak: getStreak,
    getResult: getResult,
    getAnswers: getAnswers,
    reset: reset,
  };
})();

window.IQLY = IQLY;
