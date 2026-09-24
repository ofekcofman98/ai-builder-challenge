/*
  screens.js — IQLY.screens: one pure render function per screen name.
  Each function reads IQLY.CONFIG (copy/behavior) and IQLY.state (current
  progress) and returns an HTML string. None of them mutate state or call
  IQLY.track — render.js owns both, so instrumentation lives at the
  transition boundary, not scattered through markup.
*/

var IQLY = window.IQLY || {};

(function () {

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Fills {token} placeholders in a copy string, e.g. "{current} of {total}".
function formatCopy(template, values) {
  return template.replace(/\{(\w+)\}/g, function (match, key) {
    return values.hasOwnProperty(key) ? values[key] : match;
  });
}

function progressBar(percent) {
  return '<div class="progress-track" role="progressbar" aria-valuenow="' + percent +
    '" aria-valuemin="0" aria-valuemax="100">' +
    '<div class="progress-fill" style="width:' + percent + '%"></div></div>';
}

function optionButton(action, index, label) {
  return '<button class="btn btn-option" type="button" data-action="' + action +
    '" data-value="' + index + '">' + escapeHtml(label) + '</button>';
}

// Small inline-SVG mark for the entry hero — three overlapping shapes,
// echoing the pattern-recognition question type without being a mascot
// (write-up.md rules those out). Inline, no asset file, no CDN.
function heroMark() {
  return (
    '<svg class="entry-icon" viewBox="0 0 64 64" width="48" height="48" aria-hidden="true">' +
      '<circle cx="24" cy="24" r="14" fill="var(--color-primary)" opacity="0.85"/>' +
      '<rect x="30" y="30" width="24" height="24" rx="4" fill="var(--color-primary)" opacity="0.55"/>' +
      '<polygon points="16,52 28,52 22,40" fill="var(--color-primary)" opacity="0.7"/>' +
    '</svg>'
  );
}

// Percentile teaser for partialResult: a bell curve with a single "you are
// here" marker, no exact number rendered anywhere — the curve position
// does the teasing, the real percentile stays behind the email gate.
// Colors come from tokens.css via var(), same pattern as heroMark/svgGrid.
function percentileCurve(percentile, markerLabel) {
  var width = 320;
  var height = 120;
  var baseline = 96;
  var amplitude = 76;
  var sigma = 18;

  function curveY(x) {
    var exponent = -((x - 50) * (x - 50)) / (2 * sigma * sigma);
    return baseline - amplitude * Math.exp(exponent);
  }

  var points = [];
  for (var x = 0; x <= 100; x += 2.5) {
    points.push(((x / 100) * width).toFixed(1) + ',' + curveY(x).toFixed(1));
  }
  var linePath = 'M' + points.join(' L');
  var areaPath = linePath + ' L' + width + ',' + baseline + ' L0,' + baseline + ' Z';

  var markerX = (percentile / 100) * width;
  var markerY = curveY(percentile);
  // Keeps the "You" text on-canvas even when the marker sits near either
  // edge (a percentile near 1 or 99) — the marker itself stays accurate.
  var labelX = Math.max(24, Math.min(width - 24, markerX));

  return (
    '<svg class="percentile-curve" viewBox="0 0 ' + width + ' ' + height +
      '" width="100%" height="auto" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
      '<line x1="0" y1="' + baseline + '" x2="' + width + '" y2="' + baseline +
        '" stroke="var(--color-border)" stroke-width="1"/>' +
      '<path d="' + areaPath + '" fill="var(--color-surface)"/>' +
      '<path d="' + linePath + '" fill="none" stroke="var(--color-primary)" stroke-width="2"/>' +
      '<line x1="' + markerX.toFixed(1) + '" y1="' + markerY.toFixed(1) + '" x2="' + markerX.toFixed(1) +
        '" y2="' + baseline + '" stroke="var(--color-primary)" stroke-width="1" stroke-dasharray="2,3"/>' +
      '<circle cx="' + markerX.toFixed(1) + '" cy="' + markerY.toFixed(1) +
        '" r="6" fill="var(--color-primary)" stroke="var(--color-bg)" stroke-width="2"/>' +
      '<text x="' + labelX.toFixed(1) + '" y="' + (markerY - 12).toFixed(1) +
        '" text-anchor="middle" font-size="11" font-weight="600" fill="var(--color-primary)">' +
        escapeHtml(markerLabel) +
      '</text>' +
    '</svg>'
  );
}

// Shared by the emailGate screen (mid-quiz / full-reveal-before-result
// paths) and the inline field on partialResult (baseline path) — same
// markup, same data-role hooks, so render.js's handleEmailSubmit() works
// unmodified regardless of which screen it's rendered into.
function emailForm(copy) {
  return (
    '<form class="field" data-role="email-form">' +
      '<input type="email" name="email" placeholder="' + escapeHtml(copy.emailPlaceholder) +
        '" data-role="email-input" autocomplete="email" required />' +
      '<p class="field-error text-muted" data-role="email-error" hidden>' +
        escapeHtml(copy.invalidEmail) +
      '</p>' +
      '<button class="btn btn-primary" type="button" data-action="submit-email">' +
        escapeHtml(copy.cta) +
      '</button>' +
    '</form>'
  );
}

IQLY.screens = {
  entry: function () {
    var copy = IQLY.CONFIG.copy.entry;
    var q0 = IQLY.SOFT_ENTRY_QUESTION;

    var options = q0.options.map(function (opt, i) {
      return optionButton('soft-entry', i, opt);
    }).join('');

    return (
      // No progress bar here — it's always 0% pre-answer (no information
      // value) and its presence made this screen read as "question 1 of
      // 8" instead of a landing moment. It appears from the first real
      // quiz screen onward instead (state.getProgressPercent()).
      '<div class="screen screen-entry">' +
        '<div class="entry-hero">' +
          heroMark() +
          '<h1>' + escapeHtml(copy.headline) + '</h1>' +
          '<p class="text-muted">' + escapeHtml(copy.subheadline) + '</p>' +
          '<p class="text-muted trust-cue">' + escapeHtml(copy.trustCue) + '</p>' +
        '</div>' +
        // Q0 sits in its own card, visually separated from the hero above
        // it, so it reads as "the quiz is about to begin" rather than
        // being indistinguishable from the hero copy — while still being
        // the de facto CTA (no separate Start button).
        '<div class="card entry-question-card">' +
          '<p class="question-prompt">' + escapeHtml(q0.prompt) + '</p>' +
          '<div class="option-list">' + options + '</div>' +
        '</div>' +
      '</div>'
    );
  },

  quiz: function () {
    var copy = IQLY.CONFIG.copy.quiz;
    var question = IQLY.state.getCurrentQuestion();
    var answered = IQLY.state.getAnswers().length;
    var total = IQLY.CONFIG.flow.questionCount;
    var percent = IQLY.state.getProgressPercent();
    var streak = IQLY.state.getStreak();

    var label = formatCopy(copy.questionLabel, { current: answered + 1, total: total });
    var visual = question.render ? question.render() : '';

    var options = question.options.map(function (opt, i) {
      return optionButton('answer', i, opt);
    }).join('');

    var streakChip = IQLY.CONFIG.progress.showStreak && streak > 0
      ? '<div class="streak-chip">🔥 ' + streak + '</div>'
      : '';

    return (
      '<div class="screen screen-quiz">' +
        progressBar(percent) +
        // Fixed-height slot, always rendered — render.js fills/clears the
        // text and toggles visibility, but the reserved space never
        // changes, so the toast can never overlap the question or options
        // below it (it used to be a floating overlay; not anymore).
        '<div class="toast-slot"><span class="toast-slot-text" data-role="toast-slot-text"></span></div>' +
        '<div class="quiz-header">' +
          '<span class="question-label text-muted">' + escapeHtml(label) + '</span>' +
          streakChip +
        '</div>' +
        // Fixed-min-height wrapper: prompt length and visual-vs-no-visual
        // both vary per question, and without a reserved height the option
        // buttons below would shift position between questions — a real
        // mis-tap risk on mobile, not just a visual nicety.
        '<div class="question-content">' +
          '<p class="question-prompt">' + escapeHtml(question.prompt) + '</p>' +
          (visual ? '<div class="question-visual">' + visual + '</div>' : '') +
        '</div>' +
        '<div class="option-list">' + options + '</div>' +
      '</div>'
    );
  },

  analyzing: function () {
    var copy = IQLY.CONFIG.copy.analyzing;
    var steps = IQLY.CONFIG.analyzing.steps;

    var stepItems = steps.map(function (key, i) {
      return '<li class="analyzing-step" data-step="' + i + '">' + escapeHtml(copy[key]) + '</li>';
    }).join('');

    return (
      '<div class="screen screen-analyzing">' +
        '<div class="spinner" aria-hidden="true"></div>' +
        '<ul class="analyzing-steps">' + stepItems + '</ul>' +
      '</div>'
    );
  },

  partialResult: function () {
    var copy = IQLY.CONFIG.copy.partialResult;
    var gateCopy = IQLY.CONFIG.copy.emailGate;
    var result = IQLY.state.getResult();
    var standoutLabel = result.standout
      ? result.standout.charAt(0).toUpperCase() + result.standout.slice(1)
      : '';

    var secondary = Object.keys(result.categories)
      .filter(function (cat) { return cat !== result.standout; })
      .map(function (cat) {
        var pct = result.categories[cat];
        return '<div class="category-row">' +
          '<span class="category-name">' + escapeHtml(cat) + '</span>' +
          '<div class="category-bar-track"><div class="category-bar-fill" style="width:' + pct + '%"></div></div>' +
        '</div>';
      }).join('');

    return (
      '<div class="screen screen-partial-result">' +
        '<div class="card standout-card">' +
          '<span class="text-muted">' + escapeHtml(copy.standoutLabel) + '</span>' +
          '<h2>' + escapeHtml(standoutLabel) + '</h2>' +
        '</div>' +
        '<div class="category-list">' + secondary + '</div>' +
        '<div class="percentile-teaser">' +
          '<span class="text-muted">' + escapeHtml(copy.percentileTeaserLabel) + '</span>' +
          percentileCurve(result.percentile, copy.percentileMarkerLabel) +
        '</div>' +
        '<p class="trust-badge text-muted">' + escapeHtml(copy.trustBadge) + '</p>' +
        // Email captured inline, right here — this is the steepest
        // modeled drop-off in the funnel (write-up.md: Result -> Account),
        // so it doesn't earn an extra click through an intermediate screen.
        '<div class="inline-gate">' +
          '<h2>' + escapeHtml(gateCopy.headline) + '</h2>' +
          '<p class="text-muted">' + escapeHtml(gateCopy.subheadline) + '</p>' +
          emailForm(gateCopy) +
        '</div>' +
      '</div>'
    );
  },

  // Still used for a gate that fires mid-quiz (Test 1) or before a full,
  // ungated reveal — those cases have no result content to merge into, so
  // they keep this as a standalone screen. The baseline post-quiz gate is
  // inlined into partialResult instead (see above).
  emailGate: function () {
    var copy = IQLY.CONFIG.copy.emailGate;

    return (
      '<div class="screen screen-email-gate">' +
        '<div>' +
          '<h1>' + escapeHtml(copy.headline) + '</h1>' +
          '<p class="text-muted">' + escapeHtml(copy.subheadline) + '</p>' +
        '</div>' +
        emailForm(copy) +
      '</div>'
    );
  },

  fullResult: function () {
    var copy = IQLY.CONFIG.copy.fullResult;
    var result = IQLY.state.getResult();

    var percentileText = formatCopy(copy.percentileLabel, { percentile: result.percentile });

    var categoryRows = Object.keys(result.categories).map(function (cat) {
      var pct = result.categories[cat];
      // Qualitative tier, not a raw percentage — ~1-2 questions/category
      // makes anything more precise than "Strong/Average/Needs practice"
      // read as false confidence rather than insight.
      var tierKey = IQLY.scoring.categoryLabel(pct);
      var tierLabel = IQLY.CONFIG.copy.categoryLabels[tierKey];
      return '<div class="category-row">' +
        '<span class="category-name">' + escapeHtml(cat) + '</span>' +
        '<div class="category-bar-track"><div class="category-bar-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="category-tier text-muted">' + escapeHtml(tierLabel) + '</span>' +
      '</div>';
    }).join('');

    return (
      '<div class="screen screen-full-result">' +
        '<div class="card score-card">' +
          '<span class="text-muted">' + escapeHtml(copy.scoreLabel) + '</span>' +
          '<div class="score-value">' + result.score + '</div>' +
          '<p>' + escapeHtml(percentileText) + '</p>' +
        '</div>' +
        '<div class="archetype-badge">' +
          '<span class="archetype-icon" aria-hidden="true">' + result.archetype.icon + '</span>' +
          '<div>' +
            '<span class="text-muted">' + escapeHtml(copy.archetypeLabel) + '</span>' +
            '<h3>' + escapeHtml(result.archetype.label) + '</h3>' +
          '</div>' +
        '</div>' +
        '<div class="category-list">' + categoryRows + '</div>' +
        '<button class="btn btn-secondary" type="button" data-action="share">' +
          escapeHtml(copy.shareCta) +
        '</button>' +
      '</div>'
    );
  },
};

window.IQLY = IQLY;

})();
