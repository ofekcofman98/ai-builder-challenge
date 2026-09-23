/*
  render.js — IQLY.render: mounts whatever IQLY.screens produces into the
  DOM, binds interaction via one delegated listener, and fires
  IQLY.track calls at each transition boundary. This is the only file that
  touches #app directly and the only file that calls IQLY.track, so
  instrumentation lives in one place instead of being sprinkled through
  screen markup.

  Event taxonomy (maps 1:1 onto write-up.md's 4-transition funnel model):
  page_view -> quiz_started -> question_answered* -> quiz_completed ->
  result_viewed -> email_gate_viewed -> account_created -> result_shared
  (plus a generic screen_view fired on every mount, for step-level detail).
*/

var IQLY = window.IQLY || {};

(function () {

  var toastTimer = null;

  function getToastEl() {
    var el = document.getElementById('iqly-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'iqly-toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    return el;
  }

  function showToast(message) {
    var el = getToastEl();
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove('is-visible');
    }, IQLY.CONFIG.feedback.autoDismissMs);
  }

  // Runs the labor-illusion step sequence, then advances automatically —
  // this screen has no user action, so render.js (not screens.js) owns
  // the timing, keeping screens.js free of side effects.
  function runAnalyzingSequence() {
    var cfg = IQLY.CONFIG.analyzing;
    if (!cfg.enabled) {
      IQLY.state.advance();
      mount();
      return;
    }

    cfg.steps.forEach(function (_, i) {
      setTimeout(function () {
        var stepEl = document.querySelector('[data-step="' + i + '"]');
        if (stepEl) stepEl.classList.add('is-active');
      }, i * cfg.stepDurationMs);
    });

    setTimeout(function () {
      IQLY.state.advance();
      mount();
    }, cfg.steps.length * cfg.stepDurationMs);
  }

  function trackScreenView(screenName) {
    IQLY.track('screen_view', { screen: screenName });
    if (screenName === 'emailGate') {
      IQLY.track('email_gate_viewed', {});
    }
    if (screenName === 'partialResult' || screenName === 'fullResult') {
      IQLY.track('result_viewed', { screen: screenName });
    }
  }

  function isValidEmail(value) {
    // Deliberately simple — this is a conversion gate, not a validator
    // that should ever block a real address on an edge case.
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function handleSoftEntry(value) {
    IQLY.state.recordSoftEntry(value);
    IQLY.track('quiz_started', {});
    IQLY.state.advance();
    mount();
  }

  function handleAnswer(index) {
    IQLY.state.recordAnswer(Number(index));
    var answers = IQLY.state.getAnswers();
    IQLY.track('question_answered', { questionIndex: answers.length });

    if (answers.length === IQLY.CONFIG.flow.questionCount) {
      IQLY.track('quiz_completed', {});
    }

    var toastKey = IQLY.CONFIG.feedback.toastsAfterQuestion[answers.length];
    if (toastKey) {
      showToast(IQLY.CONFIG.copy.feedback[toastKey]);
    }

    IQLY.state.advance();
    mount();
  }

  function handleEmailSubmit() {
    var input = document.querySelector('[data-role="email-input"]');
    var errorEl = document.querySelector('[data-role="email-error"]');
    var value = input ? input.value.trim() : '';

    if (!isValidEmail(value)) {
      if (errorEl) errorEl.hidden = false;
      return;
    }

    IQLY.state.recordEmail(value);
    // Only a boolean is tracked, never the address itself — the debug
    // panel and localStorage are still "as if going live" instrumentation,
    // not a place to also stash PII.
    IQLY.track('account_created', { hasEmail: true });
    IQLY.state.advance();
    mount();
  }

  function handleShare() {
    var result = IQLY.state.getResult();
    var text = 'I scored ' + result.score + ' on IQly — higher than ' +
      result.percentile + '% of test-takers. Try it yourself!';

    IQLY.track('result_shared', {});

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast(IQLY.CONFIG.copy.fullResult.shareCopiedMessage);
      }).catch(function () {
        showToast(text);
      });
    } else {
      showToast(text);
    }
  }

  function onAppClick(event) {
    var target = event.target.closest('[data-action]');
    if (!target) return;

    var action = target.getAttribute('data-action');
    var value = target.getAttribute('data-value');

    if (action === 'soft-entry') handleSoftEntry(value);
    else if (action === 'answer') handleAnswer(value);
    else if (action === 'submit-email') handleEmailSubmit();
    else if (action === 'share') handleShare();
  }

  function onAppSubmit(event) {
    // The email field is a <form> so Enter submits it; treat that the
    // same as clicking the CTA rather than letting the browser navigate.
    var form = event.target.closest('[data-role="email-form"]');
    if (!form) return;
    event.preventDefault();
    handleEmailSubmit();
  }

  function mount() {
    var screenName = IQLY.state.getCurrentScreen();
    var renderFn = IQLY.screens[screenName];
    var appEl = document.getElementById('app');

    if (!renderFn) {
      appEl.innerHTML = '<div class="screen">Unknown screen: ' + screenName + '</div>';
      return;
    }

    appEl.innerHTML = renderFn();
    trackScreenView(screenName);

    if (screenName === 'analyzing') {
      runAnalyzingSequence();
    }
  }

  IQLY.render = {
    mount: mount,
  };

  window.IQLY = IQLY;

  document.addEventListener('DOMContentLoaded', function () {
    var appEl = document.getElementById('app');
    appEl.addEventListener('click', onAppClick);
    appEl.addEventListener('submit', onAppSubmit);
  });

})();
