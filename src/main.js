/*
  main.js — IQLY.init: wires config/state/render together and starts the
  flow. Must load last, after every other src/ script.
*/

var IQLY = window.IQLY || {};

// Ad-creative deep link (see creatives/creative-1080x1920.html Build A,
// part3-spec.md): ?skip=entry lands the user on Q1 directly, removing the
// Visit -> Quiz-start screen boundary for traffic arriving via that
// creative specifically. Read before the first render so 'entry' is never
// mounted at all, not just skipped past after a flash.
function readSkipParam() {
  var params = new URLSearchParams(window.location.search);
  return params.get('skip');
}

// Bonus per-answer deep link (see creatives/creative-1080x1920-interactive.html
// Build B, part3-spec.md): ?q1=<optionIndex> pre-fills the answer the user
// already picked inside the ad, so landing never re-asks the exact question
// they just answered. Generalized to qN in case a future creative teases a
// later question, though today only q1 is ever sent.
function readAnswerParam() {
  var params = new URLSearchParams(window.location.search);
  var found = null;
  params.forEach(function (value, key) {
    if (found) return;
    var match = /^q(\d+)$/.exec(key);
    if (match) found = { questionIndex: Number(match[1]) - 1, answerIndex: Number(value) };
  });
  return found;
}

IQLY.init = function () {
  IQLY.track('page_view', {});

  var answerParam = readAnswerParam();
  var skipRequested = readSkipParam() === 'entry' || !!answerParam;

  // A deep-link visit (ad creative) is a deliberate fresh entry point, so
  // it takes priority over any stale progress left in localStorage from an
  // earlier, unrelated session — restore is only attempted when neither
  // deep-link param is present.
  var restored = !skipRequested && IQLY.state.restoreSnapshot(IQLY.persistence.load());

  if (!restored) {
    if (skipRequested) {
      IQLY.state.skipToQuiz();
      // Stands in for handleSoftEntry()'s quiz_started call (render.js),
      // which this path never runs — the transition still needs a fired
      // event, just tagged so the funnel data can separate deep-link
      // entrants from the organic soft-entry path.
      IQLY.track('quiz_started', { source: 'creative_deep_link' });
    }

    // Only the per-answer deep link (?qN=<index>) needs q0 deferred — it
    // lands past 'entry' with an answer already recorded, so q0 has to be
    // asked later instead of never. A plain ?skip=entry (Build A, no
    // answer) intentionally skips q0 the same way it always has — not
    // this file's concern to change (docs/creative-fixes.md item 3a).
    if (answerParam) {
      IQLY.state.setDeferSoftEntry(true);
    }

    // Only honored when it targets the next unanswered question — a stale
    // or malformed link (wrong index, or the quiz already moved on) is
    // ignored rather than corrupting state.answers order.
    if (answerParam && answerParam.questionIndex === IQLY.state.getAnswers().length) {
      IQLY.state.recordAnswer(answerParam.answerIndex);
      IQLY.track('question_answered', {
        questionIndex: answerParam.questionIndex + 1,
        source: 'creative_deep_link',
      });
      IQLY.state.advance();
    }
  }

  IQLY.render.mount();
};

document.addEventListener('DOMContentLoaded', IQLY.init);

window.IQLY = IQLY;
