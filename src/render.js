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

  // Every mount replaces #app's innerHTML wholesale (screens.js renders full
  // HTML strings, not diffs), so .progress-fill is a brand-new DOM node each
  // time with its target width already baked into the initial markup — the
  // CSS width transition (components.css) has no "before" state to animate
  // from and silently no-ops. Track the last-rendered percent here so the
  // fresh node can be snapped back to it and animated forward on each mount.
  var lastProgressPercent = 0;

  // Which category-report pill (if any) is expanded on fullResult —
  // ephemeral UI state, not part of the quiz funnel, so it lives here
  // rather than in state.js. Reset on every mount so leaving/re-entering
  // fullResult always starts collapsed.
  var selectedCategoryId = null;

  var toastTimer = null;
  // The mid-quiz percentile toast (see handleAnswer) fires just before
  // advancing to the NEXT question, so its message is queued here and
  // shown once that quiz screen actually mounts, in its dedicated
  // toast-slot rather than as an overlay (see screens.js quiz()).
  var pendingQuizToast = null;
  var quizToastTimer = null;

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

  // Saves the resumable quiz snapshot on every mount, or clears it once the
  // flow reaches a point the persistence spec says should never resume
  // (full result reveal / post-account-creation) — one place for this
  // rather than duplicating save/clear calls in every handler above.
  function syncPersistence(screenName) {
    if (screenName === 'fullResult' || screenName === 'upsell') {
      IQLY.persistence.clear();
    } else {
      IQLY.persistence.save(IQLY.state.getSnapshot());
    }
  }

  function trackScreenView(screenName) {
    IQLY.track('screen_view', { screen: screenName });
    if (screenName === 'emailGate') {
      IQLY.track('email_gate_viewed', {});
    }
    if (screenName === 'partialResult' || screenName === 'fullResult') {
      IQLY.track('result_viewed', { screen: screenName });
    }
    // Post-signup only — a signal for product interest, not a funnel step
    // (it can't affect account creations / page visits, since the account
    // already exists by the time this screen is reachable).
    if (screenName === 'upsell') {
      IQLY.track('upsell_viewed', {});
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
      pendingQuizToast = IQLY.CONFIG.copy.feedback[toastKey];
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

    // Brief, honest processing state before the result reveal — mirrors
    // runAnalyzingSequence()'s pattern (render.js owns the timing, not a
    // state.js screen) rather than jumping straight to the result, which
    // read as if the submit hadn't done anything (docs/fixes.md item 3).
    var appEl = document.getElementById('app');
    appEl.innerHTML = IQLY.screens.processingResult();
    IQLY.track('screen_view', { screen: 'processingResult' });

    setTimeout(function () {
      IQLY.state.advance();
      mount();
    }, IQLY.CONFIG.processingResult.durationMs);
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

  function handleViewUpsell() {
    IQLY.state.viewUpsell();
    mount();
  }

  // Toggles the single shared category-report panel: re-clicking the
  // already-open pill collapses it, clicking a different pill swaps the
  // panel's content directly (never two panels, never closes-then-opens).
  // Only the panel-wrap's `is-open` class, the panel's innerHTML, and the
  // pills' active class change — the pill row's own layout is untouched
  // either way. The wrap stays at its open grid-template-rows across a
  // category swap (is-open is only ever added/removed on a null<->id
  // transition), so switching categories never re-triggers the
  // open/close animation, just swaps content while already open.
  function handleSelectCategory(categoryId) {
    var wasOpen = !!selectedCategoryId;
    selectedCategoryId = selectedCategoryId === categoryId ? null : categoryId;
    renderCategoryPanel(wasOpen);
  }

  function renderCategoryPanel(wasOpen) {
    var wrap = document.querySelector('[data-role="category-report-panel-wrap"]');
    var panel = document.querySelector('[data-role="category-report-panel"]');
    if (!wrap || !panel) return;

    document.querySelectorAll('.category-report-pill').forEach(function (pill) {
      pill.classList.toggle('is-active', pill.getAttribute('data-value') === selectedCategoryId);
    });

    if (!selectedCategoryId) {
      wrap.classList.remove('is-open');
      return;
    }

    panel.innerHTML = IQLY.categoryReportPanelHtml(selectedCategoryId);
    if (!wasOpen) wrap.classList.add('is-open');
  }

  function handleSelectPlan(planId) {
    // Genuinely useful signal even as a teaser — which tier users show
    // interest in, without building any real payment flow behind it.
    IQLY.track('upsell_plan_selected', { plan: planId });

    var btn = document.querySelector('[data-action="select-plan"][data-value="' + planId + '"]');
    if (btn) {
      btn.textContent = IQLY.CONFIG.copy.upsell.comingSoon;
      btn.disabled = true;
      btn.classList.add('is-disabled');
    }
  }

  function handleDismissUpsell() {
    IQLY.track('upsell_dismissed', {});
    IQLY.state.dismissUpsell();
    mount();
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
    else if (action === 'view-upsell') handleViewUpsell();
    else if (action === 'select-plan') handleSelectPlan(value);
    else if (action === 'dismiss-upsell') handleDismissUpsell();
    else if (action === 'select-category') handleSelectCategory(value);
  }

  function onAppSubmit(event) {
    // The email field is a <form> so Enter submits it; treat that the
    // same as clicking the CTA rather than letting the browser navigate.
    var form = event.target.closest('[data-role="email-form"]');
    if (!form) return;
    event.preventDefault();
    handleEmailSubmit();
  }

  function animateProgressBar() {
    var fillEl = document.querySelector('.progress-fill');
    if (!fillEl) return;

    var targetPercent = IQLY.state.getProgressPercent();
    fillEl.style.width = lastProgressPercent + '%';
    lastProgressPercent = targetPercent;

    // A single reflow isn't enough here: this node was never painted at the
    // "before" width (it's brand new from the innerHTML swap above), so the
    // browser coalesces both style writes into one paint and skips the
    // transition. Deferring the target write two frames out gives the
    // browser an actual committed paint of the start state to animate from.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        fillEl.style.width = targetPercent + '%';
      });
    });
  }

  function mount() {
    var screenName = IQLY.state.getCurrentScreen();
    var renderFn = IQLY.screens[screenName];
    var appEl = document.getElementById('app');

    if (!renderFn) {
      appEl.innerHTML = '<div class="screen">Unknown screen: ' + screenName + '</div>';
      return;
    }

    selectedCategoryId = null;
    appEl.innerHTML = renderFn();
    trackScreenView(screenName);
    syncPersistence(screenName);
    animateProgressBar();

    if (screenName === 'analyzing') {
      runAnalyzingSequence();
    }

    if (screenName === 'quiz' && pendingQuizToast) {
      var toastTextEl = document.querySelector('[data-role="toast-slot-text"]');
      var message = pendingQuizToast;
      pendingQuizToast = null;

      if (toastTextEl) {
        toastTextEl.textContent = message;
        toastTextEl.classList.add('is-visible');
        clearTimeout(quizToastTimer);
        quizToastTimer = setTimeout(function () {
          toastTextEl.classList.remove('is-visible');
        }, IQLY.CONFIG.feedback.autoDismissMs);
      }
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
