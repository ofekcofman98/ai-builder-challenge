/*
  state.js — IQLY.state: the single source of truth for "which screen am I
  on" plus collected answers/email. This is a resolver-based state machine,
  not ad-hoc DOM toggling: render.js/screens.js read from it, but only
  state.js writes to it, and it never touches the DOM.

  Why a resolver and not an index walk: CONFIG.flow.screens is only the
  BASE happy path (entry -> quiz -> analyzing -> partialResult ->
  fullResult). The email gate is NOT in that array — its position is
  decided by CONFIG.emailGate on every transition. That's what lets a
  Part 2 variant move the gate from after Q8 to after Q4 (interrupting the
  quiz mid-way, then resuming it) purely by editing CONFIG, with zero
  changes here.
*/

var IQLY = window.IQLY || {};

IQLY.state = (function () {
  var current = {
    screen: 'entry',
    answers: [],
    softEntryAnswer: null,
    emailCaptured: false,
    // Tracks whether the email gate already ran, so a gate placed
    // "afterResult" (a Test-3-style variant) doesn't re-trigger once
    // emailCaptured flips true.
    gateShown: false,
  };

  function questionCount() {
    return IQLY.CONFIG.flow.questionCount;
  }

  function questionsRemain() {
    return current.answers.length < questionCount();
  }

  // The single lever variant 1 (gate after Q4 instead of Q8) rides on.
  // Baseline (afterQuestionIndex === questionCount) always evaluates
  // false, so the gate never interrupts the quiz — it falls through to
  // its normal post-result slot instead.
  function isGateDueMidQuiz() {
    var gate = IQLY.CONFIG.emailGate;
    return !current.emailCaptured
      && !current.gateShown
      && current.answers.length === gate.afterQuestionIndex
      && gate.afterQuestionIndex < questionCount();
  }

  function isGateDueAfterQuiz() {
    var gate = IQLY.CONFIG.emailGate;
    return !current.emailCaptured
      && !current.gateShown
      && gate.afterQuestionIndex >= questionCount();
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
        if (isGateDueMidQuiz()) return 'emailGate';
        if (questionsRemain()) return 'quiz';
        if (isGateDueAfterQuiz() && gatePosition() === 'beforeResult') return 'emailGate';
        return 'analyzing';

      case 'emailGate':
        // Gate fired mid-quiz (Test 1 style): resume the questions.
        if (questionsRemain()) return 'quiz';
        // Gate fired after the quiz but before analyzing (baseline).
        if (current.screen === 'emailGate' && !current.gateShown) return 'analyzing';
        return 'analyzing';

      case 'analyzing':
        if (current.emailCaptured || revealIsFull()) return 'fullResult';
        return 'partialResult';

      case 'partialResult':
        if (current.emailCaptured) return 'fullResult';
        return 'emailGate';

      case 'fullResult':
        return 'fullResult'; // terminal

      default:
        return 'entry';
    }
  }

  function getCurrentScreen() {
    return current.screen;
  }

  function getCurrentQuestion() {
    return IQLY.QUESTIONS[current.answers.length];
  }

  function recordSoftEntry(value) {
    current.softEntryAnswer = value;
  }

  function recordAnswer(answer) {
    current.answers.push(answer);
  }

  function recordEmail(email) {
    current.emailCaptured = true;
    current.gateShown = true;
  }

  function advance() {
    // emailGate is a one-shot: once we leave it, it must not be offered
    // again even if a later condition would otherwise re-trigger it
    // (e.g. an "afterResult" position variant that also has answers
    // landing exactly on afterQuestionIndex).
    if (current.screen === 'emailGate') {
      current.gateShown = true;
    }
    current.screen = resolveNextScreen();
  }

  function getProgressPercent() {
    var total = questionCount();
    var answered = current.answers.length;
    var base = IQLY.CONFIG.progress.initialPercent;
    var earned = (100 - base) * (answered / total);
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
      gateShown: false,
    };
  }

  return {
    getCurrentScreen: getCurrentScreen,
    getCurrentQuestion: getCurrentQuestion,
    recordSoftEntry: recordSoftEntry,
    recordAnswer: recordAnswer,
    recordEmail: recordEmail,
    advance: advance,
    getProgressPercent: getProgressPercent,
    getStreak: getStreak,
    getResult: getResult,
    getAnswers: getAnswers,
    reset: reset,
  };
})();

window.IQLY = IQLY;
