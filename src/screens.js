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

// Sequence-type prompts ("What comes next in the sequence? 2, 4, 6, 8, __")
// were wrapping mid-number-list on narrow/wide layouts alike, and "__" read
// as plain text easy to miss (docs/fixes.md Tier 1). Keeps the number list
// + blank together on one line via white-space:nowrap and gives the blank
// a distinct chip instead of two underscores. No-op (plain escaped text)
// for every other question type.
function formatQuestionPrompt(question) {
  if (question.type !== 'sequence') return escapeHtml(question.prompt);

  var match = /^(.*?)([\d]+(?:\s*,\s*[\d]+)*\s*,)\s*__\s*$/.exec(question.prompt);
  if (!match) return escapeHtml(question.prompt);

  var intro = match[1];
  var sequence = match[2];
  return (
    escapeHtml(intro) +
    '<span class="sequence-line">' +
      escapeHtml(sequence) + ' ' +
      '<span class="sequence-blank" aria-label="missing number">?</span>' +
    '</span>'
  );
}

function progressBar(percent) {
  return '<div class="progress-track" role="progressbar" aria-valuenow="' + percent +
    '" aria-valuemin="0" aria-valuemax="100">' +
    '<div class="progress-fill" style="width:' + percent + '%"></div></div>';
}

function optionButton(action, index, label) {
  return '<button class="btn btn-option" type="button" data-action="' + action +
    '" data-value="' + index + '">' +
    '<span class="option-label">' + escapeHtml(label) + '</span></button>';
}

// Grid variant for questions with optionShapes (questions.js): icon +
// small text label, laid out as a 2x2 grid (see .option-grid /
// .btn-option-grid in components.css) rather than the text options'
// single column — these compare naturally side by side, not top-to-bottom.
function shapeOptionButton(action, index, label, iconSvg) {
  return '<button class="btn btn-option-grid" type="button" data-action="' +
    action + '" data-value="' + index + '">' +
    '<span class="option-icon-wrap">' + iconSvg + '</span>' +
    '<span class="option-label">' + escapeHtml(label) + '</span>' +
  '</button>';
}

// Inline-SVG mark — a two-lobe brain glyph (silhouette + single center
// seam), replacing the earlier abstract circle/rect/triangle mark
// (see docs/AI_WORKFLOW.md's 2026-09-25 entry for why). Deliberately
// reduced to one bold seam line and no interior fold detail: this is
// the version that survives being rendered at 20px (creative-320x50's
// banner mark) without collapsing into a smudge — checked at 20/22/24/
// 48/60px before wiring in, not approved off the large export alone.
// Inline, no asset file, no CDN. Shared by the entry hero (large) and
// the quiz header's persistent brand mark (small, see
// CONFIG.quiz.showLogo) — same SVG, sized/classed per call site so a
// single source stays the one place this mark is drawn.
function logoMark(size, extraClass) {
  return (
    '<svg class="logo-mark' + (extraClass ? ' ' + extraClass : '') +
      '" viewBox="0 0 64 64" width="' + size + '" height="' + size + '" aria-hidden="true">' +
      '<path d="M32 6 C21 6 15 13 17 21 C8 23 6 33 15 37 C13 45 21 53 30 51 C31 56 33 56 34 51 C43 53 51 45 49 37 C58 33 56 23 47 21 C49 13 43 6 32 6 Z" fill="var(--color-primary)"/>' +
      '<path d="M32 9 C30.5 20 30.5 44 32 53" stroke="var(--color-bg)" stroke-width="5" stroke-linecap="round"/>' +
    '</svg>'
  );
}

// Icon + wordmark lockup shared by every screen that shows the brand: the
// entry hero (large, centered) and every screen from the quiz onward
// (small, top-left) — one helper so the pairing/gap is defined once
// (.brand-row in components.css) instead of re-built per call site.
function brandMark(size, extraClass) {
  return (
    '<div class="brand-row' + (extraClass ? ' ' + extraClass : '') + '">' +
      logoMark(size, 'brand-logo') +
      '<span class="brand-wordmark">' + escapeHtml(IQLY.CONFIG.brand.name) + '</span>' +
    '</div>'
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

function lockIcon() {
  return (
    '<svg class="lock-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">' +
      '<rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M8 11V7a4 4 0 0 1 8 0v4" fill="none" stroke="currentColor" stroke-width="2"/>' +
    '</svg>'
  );
}

// Locked category-report teaser (docs/fixes.md item 4) — fullResult only,
// post-signup. Blurs the REAL per-category right/wrong counts already
// computed by scoring.js's computeResult() (categoryDetails), not
// placeholder text: a real number blurred reads as a genuine premium
// teaser, a fake one reads as fabricated the moment anyone inspects it.
//
// The pill row and its detail panel are two separate elements, not one
// pill's content inline-injected next to itself: an *inline* per-pill
// panel (the first version of this) pushes every later pill onto a new
// line the moment one opens, and relocates the panel's DOM position
// every time a different pill is picked — both read as the layout
// jumping around. Instead there is exactly one panel, rendered once,
// directly below the (always single-row) pill row; render.js owns which
// category is selected (ephemeral UI state, not part of the quiz funnel,
// so it doesn't belong in state.js) and swaps only the panel's content —
// see render.js's selectedCategoryId/renderCategoryPanel().
function categoryReportPills(result, copy) {
  var pills = Object.keys(result.categoryDetails).map(function (cat) {
    return '<button class="category-report-pill" type="button" data-action="select-category" data-value="' +
      cat + '">' + escapeHtml(cat) + '</button>';
  }).join('');

  return (
    '<div class="category-report">' +
      '<span class="category-report-label text-muted">' + escapeHtml(copy.categoryReportToggle) + '</span>' +
      '<div class="category-report-pill-row">' + pills + '</div>' +
      '<div class="category-report-panel-wrap" data-role="category-report-panel-wrap">' +
        '<div class="category-report-panel" data-role="category-report-panel"></div>' +
      '</div>' +
    '</div>'
  );
}

// Solid-filled (not a pale tint + thin stroke) so the color survives the
// panel's blur(6px) as a visible color blob — a light background tint
// behind a 2px stroke averages out to almost nothing once blurred, which
// is what made these too faint to read at a glance.
function checkIcon() {
  return (
    '<svg class="qrow-icon qrow-icon-correct" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">' +
      '<circle cx="10" cy="10" r="10" fill="var(--color-success)"/>' +
      '<path d="M5.5 10.5l2.8 2.8 6.2-6.8" fill="none" stroke="var(--color-success-bg)" stroke-width="2.5" ' +
        'stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>'
  );
}

function crossIcon() {
  return (
    '<svg class="qrow-icon qrow-icon-incorrect" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">' +
      '<circle cx="10" cy="10" r="10" fill="var(--color-danger)"/>' +
      '<path d="M6.5 6.5l7 7M13.5 6.5l-7 7" fill="none" stroke="var(--color-danger-bg)" stroke-width="2.5" ' +
        'stroke-linecap="round"/>' +
    '</svg>'
  );
}

// Pure function of (categoryId, state, CONFIG) -> the panel's inner HTML —
// called directly by render.js's renderCategoryPanel() to fill the single
// shared panel slot above, not part of a full screen mount. Renders the
// REAL per-question right/wrong rows (scoring.js's categoryDetails[cat]
// .items — actual prompts, actual correctness), not placeholder text, so
// the blur genuinely reads as "real content, obscured" rather than a
// fabricated teaser. The blurred rows and the lock/CTA overlay are two
// separate layers (.category-report-blurred underneath,
// .category-report-lock positioned on top) so the CSS blur filter never
// touches the overlay itself — it stays crisp and clickable.
IQLY.categoryReportPanelHtml = function (categoryId) {
  var copy = IQLY.CONFIG.copy.fullResult;
  var result = IQLY.state.getResult();
  var detail = result.categoryDetails[categoryId];
  if (!detail) return '';

  var rows = detail.items.map(function (item) {
    return (
      '<div class="category-report-qrow">' +
        (item.isCorrect ? checkIcon() : crossIcon()) +
        '<span class="qrow-label">' + escapeHtml(item.prompt) + '</span>' +
      '</div>'
    );
  }).join('');

  return (
    '<div class="category-report-locked" data-action="view-upsell">' +
      '<div class="category-report-blurred">' + rows + '</div>' +
      '<span class="category-report-lock">' + lockIcon() + ' ' +
        escapeHtml(copy.categoryReportUnlockLabel) +
      '</span>' +
    '</div>'
  );
};

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
          brandMark(48, 'brand-row-hero') +
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
    var hasShapeOptions = !!question.optionShapes;

    // Shared across every option's icon for this question — sized to fit
    // the largest option count — so a 1-shape option renders its shape at
    // the same absolute size as one shape within a 3-shape option, rather
    // than each option's icon being cropped to its own count and then
    // stretched to fill the same cell (see optionIcon()'s comment).
    var iconCanvasSize = hasShapeOptions
      ? IQLY.iconCanvasSize(Math.max.apply(null, question.optionShapes.map(function (s) { return s.count; })))
      : null;

    var options = question.options.map(function (opt, i) {
      if (hasShapeOptions) {
        var shapeSpec = question.optionShapes[i];
        var icon = IQLY.optionIcon(shapeSpec.shape, shapeSpec.count, iconCanvasSize);
        return shapeOptionButton('answer', i, opt, icon);
      }
      return optionButton('answer', i, opt);
    }).join('');

    // optionShapes questions get the 2x2 icon grid; every other question
    // type keeps the existing single-column text list, untouched. See
    // .option-grid / .btn-option-grid in components.css.
    var optionListClass = hasShapeOptions ? 'option-grid' : 'option-list';

    var streakChip = IQLY.CONFIG.progress.showStreak && streak > 0
      ? '<div class="streak-chip">🔥 ' + streak + '</div>'
      : '';

    return (
      '<div class="screen screen-quiz">' +
        // Persistent brand mark — keeps IQly visible through the whole
        // quiz (previously only shown on the entry screen, before the quiz
        // screens replace it entirely). Its own row above everything else,
        // including the progress bar, not sharing a line with "Question X
        // of Y" — top-left of the screen, full stop. Same brandMark() every
        // post-entry screen uses, so the lockup is identical start to finish.
        brandMark(24) +
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
          '<p class="question-prompt">' + formatQuestionPrompt(question) + '</p>' +
          (visual ? '<div class="question-visual">' + visual + '</div>' : '') +
        '</div>' +
        '<div class="' + optionListClass + '">' + options + '</div>' +
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
        brandMark(24) +
        '<div class="spinner" aria-hidden="true"></div>' +
        '<ul class="analyzing-steps">' + stepItems + '</ul>' +
      '</div>'
    );
  },

  // Rendered directly by render.js's handleEmailSubmit() between the email
  // submit click and the result mount — not a state.js screen (email
  // submission doesn't change what "current screen" means to the resolver,
  // it's a brief in-place transition), so it's never reached via mount()
  // or persisted. Same spinner + single-message shape as `analyzing`.
  processingResult: function () {
    var copy = IQLY.CONFIG.copy.processingResult;

    return (
      '<div class="screen screen-processing-result">' +
        brandMark(24) +
        '<div class="spinner" aria-hidden="true"></div>' +
        '<p class="processing-message">' + escapeHtml(copy.message) + '</p>' +
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

    // Part 2 Test 3: which motivation the headline card leads with —
    // self-understanding (standout strength, baseline) or social
    // comparison (percentile rank) — see docs/part2-spec.md.
    var leadWithPercentile = IQLY.CONFIG.result.leadWith === 'percentileRank';
    var leadLabel = leadWithPercentile ? copy.percentileLeadLabel : copy.standoutLabel;
    var leadHeadline = leadWithPercentile
      ? formatCopy(copy.percentileLeadHeadline, { percentile: result.percentile })
      : standoutLabel;

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
        brandMark(24) +
        '<div class="card standout-card">' +
          '<span class="text-muted">' + escapeHtml(leadLabel) + '</span>' +
          '<h2>' + escapeHtml(leadHeadline) + '</h2>' +
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

    // Only true mid-quiz (Test 1): a post-quiz gate (full-reveal variant)
    // has already answered every question, so there's no remaining-effort
    // claim left to make and this block is skipped rather than shown false.
    var answered = IQLY.state.getAnswers().length;
    var total = IQLY.CONFIG.flow.questionCount;
    var isMidQuiz = answered < total;

    var momentum = isMidQuiz
      ? '<div class="gate-momentum">' +
          progressBar(IQLY.state.getProgressPercent()) +
          '<p class="text-muted">' +
            escapeHtml(formatCopy(IQLY.CONFIG.copy.quiz.questionLabel, { current: answered + 1, total: total })) +
          '</p>' +
          '<p class="text-muted">' + escapeHtml(copy.reassurance) + '</p>' +
        '</div>'
      : '';

    return (
      '<div class="screen screen-email-gate">' +
        brandMark(24) +
        '<div class="gate-content">' +
          '<h1>' + escapeHtml(copy.headline) + '</h1>' +
          '<p class="text-muted">' + escapeHtml(copy.subheadline) + '</p>' +
          momentum +
          emailForm(copy) +
        '</div>' +
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
        brandMark(24) +
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
        categoryReportPills(result, copy) +
        '<button class="btn btn-secondary" type="button" data-action="share">' +
          escapeHtml(copy.shareCta) +
        '</button>' +
        // Post-signup only — the account already exists, so this can't
        // dilute the measured funnel (account creations / page visits).
        // Styled to stand out (accent border, not solid — that's reserved
        // for the core flow's own CTAs) so it reads as a real offer, not
        // an afterthought link.
        '<button class="btn btn-accent" type="button" data-action="view-upsell">' +
          escapeHtml(copy.unlockMoreCta) +
        '</button>' +
      '</div>'
    );
  },

  // Post-signup upsell teaser — not a real payment flow (render.js's
  // handleSelectPlan just tracks interest and shows a static "coming
  // soon" state). "Maybe later" is styled identically to the two paid
  // CTAs — this whole screen is optional, and declining it should feel
  // exactly as easy as accepting one of the offers.
  upsell: function () {
    var copy = IQLY.CONFIG.copy.upsell;
    var planKeys = Object.keys(copy.plans);

    var cards = planKeys.map(function (key) {
      var plan = copy.plans[key];
      var isPremium = key === 'coach'; // the more aspirational tier
      return (
        '<div class="card upsell-card' + (isPremium ? ' upsell-card-premium' : '') + '">' +
          (plan.badge ? '<span class="upsell-badge">' + escapeHtml(plan.badge) + '</span>' : '') +
          '<h3>' + escapeHtml(plan.title) + '</h3>' +
          '<p class="text-muted">' + escapeHtml(plan.description) + '</p>' +
          '<div class="upsell-price">' + escapeHtml(plan.price) + '</div>' +
          '<button class="btn btn-primary" type="button" data-action="select-plan" data-value="' + key + '">' +
            escapeHtml(plan.cta) +
          '</button>' +
        '</div>'
      );
    }).join('');

    return (
      '<div class="screen screen-upsell">' +
        brandMark(24) +
        '<div>' +
          '<h1>' + escapeHtml(copy.headline) + '</h1>' +
          '<p class="text-muted">' + escapeHtml(copy.subheadline) + '</p>' +
        '</div>' +
        '<div class="upsell-grid">' + cards + '</div>' +
        '<button class="btn btn-secondary" type="button" data-action="dismiss-upsell">' +
          escapeHtml(copy.maybeLater) +
        '</button>' +
      '</div>'
    );
  },
};

window.IQLY = IQLY;

})();
