/*
  state.js — IQLY.state: the single source of truth for "which screen am I
  on" plus collected answers. This is a state machine, not ad-hoc DOM
  toggling: render.js/screens.js read from it, but only state.js writes to
  it. It must never touch the DOM — that's render.js's job — so the flow
  logic stays testable independent of markup.
*/

var IQLY = window.IQLY || {};

IQLY.state = (function () {
  var current = {
    screenIndex: 0,
    answers: [],
  };

  function getScreenSequence() {
    return IQLY.CONFIG.flow.screens;
  }

  function getCurrentScreen() {
    return getScreenSequence()[current.screenIndex];
  }

  function recordAnswer(answer) {
    current.answers.push(answer);
    IQLY.track('question_answered', {
      questionIndex: current.answers.length,
      screen: getCurrentScreen(),
    });
  }

  // Decides whether the email gate should be inserted before advancing,
  // based purely on CONFIG — this is the function a Part 2 "move the
  // gate" variant relies on without any code change.
  function shouldShowEmailGate() {
    return current.answers.length === IQLY.CONFIG.emailGate.afterQuestionIndex;
  }

  function advance() {
    var sequence = getScreenSequence();
    var next = Math.min(current.screenIndex + 1, sequence.length - 1);
    current.screenIndex = next;
    IQLY.track('screen_transition', { screen: getCurrentScreen() });
  }

  function reset() {
    current = { screenIndex: 0, answers: [] };
  }

  return {
    getCurrentScreen: getCurrentScreen,
    recordAnswer: recordAnswer,
    shouldShowEmailGate: shouldShowEmailGate,
    advance: advance,
    reset: reset,
    getAnswers: function () { return current.answers.slice(); },
  };
})();

window.IQLY = IQLY;
