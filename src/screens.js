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

IQLY.screens = {
  entry: function () {
    var copy = IQLY.CONFIG.copy.entry;
    var q0 = IQLY.SOFT_ENTRY_QUESTION;
    var percent = IQLY.CONFIG.progress.initialPercent;

    var options = q0.options.map(function (opt, i) {
      return optionButton('soft-entry', i, opt);
    }).join('');

    return (
      '<div class="screen screen-entry">' +
        progressBar(percent) +
        '<div>' +
          '<h1>' + escapeHtml(copy.headline) + '</h1>' +
          '<p class="text-muted">' + escapeHtml(copy.subheadline) + '</p>' +
        '</div>' +
        '<p class="text-muted trust-cue">' + escapeHtml(copy.trustCue) + '</p>' +
        '<div class="field">' +
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
        '<div class="quiz-header">' +
          '<span class="question-label text-muted">' + escapeHtml(label) + '</span>' +
          streakChip +
        '</div>' +
        '<p class="question-prompt">' + escapeHtml(question.prompt) + '</p>' +
        (visual ? '<div class="question-visual">' + visual + '</div>' : '') +
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
        '<div class="score-locked" aria-hidden="true">' +
          '<span class="score-locked-icon">🔒</span>' +
          '<span class="score-locked-value">???</span>' +
        '</div>' +
        '<p class="trust-badge text-muted">' + escapeHtml(copy.trustBadge) + '</p>' +
        '<button class="btn btn-primary" type="button" data-action="continue">' +
          escapeHtml(copy.cta) +
        '</button>' +
      '</div>'
    );
  },

  emailGate: function () {
    var copy = IQLY.CONFIG.copy.emailGate;

    return (
      '<div class="screen screen-email-gate">' +
        '<div>' +
          '<h1>' + escapeHtml(copy.headline) + '</h1>' +
          '<p class="text-muted">' + escapeHtml(copy.subheadline) + '</p>' +
        '</div>' +
        '<form class="field" data-role="email-form">' +
          '<input type="email" name="email" placeholder="' + escapeHtml(copy.emailPlaceholder) +
            '" data-role="email-input" autocomplete="email" required />' +
          '<p class="field-error text-muted" data-role="email-error" hidden>' +
            escapeHtml(copy.invalidEmail) +
          '</p>' +
          '<button class="btn btn-primary" type="button" data-action="submit-email">' +
            escapeHtml(copy.cta) +
          '</button>' +
        '</form>' +
      '</div>'
    );
  },

  fullResult: function () {
    var copy = IQLY.CONFIG.copy.fullResult;
    var result = IQLY.state.getResult();

    var percentileText = formatCopy(copy.percentileLabel, { percentile: result.percentile });

    var categoryRows = Object.keys(result.categories).map(function (cat) {
      var pct = result.categories[cat];
      return '<div class="category-row">' +
        '<span class="category-name">' + escapeHtml(cat) + '</span>' +
        '<div class="category-bar-track"><div class="category-bar-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="category-pct text-muted">' + pct + '%</span>' +
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
