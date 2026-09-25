/*
  scoring.js — IQLY.scoring: pure functions turning answers into a
  score/percentile/category/archetype result. No DOM, no state mutation —
  keeps it independently reusable from both the partial-result and
  full-result screens.
*/

var IQLY = window.IQLY || {};

// Draws `count` questions from IQLY.QUESTIONS proportionally across
// categories (round-robin in each category's first-appearance order),
// rather than a naive "first N" slice. Keeps CONFIG.flow.questionCount as
// the single source of truth for quiz length (Part 2 Test 2) without ever
// silently dropping a category from the result breakdown, and without
// requiring questions.js or state.js/scoring.js's category logic to change
// when the question bank grows.
IQLY.selectQuestions = function (count) {
  var questions = IQLY.QUESTIONS;
  if (count >= questions.length) return questions.slice();

  var byCategory = {};
  var categoryOrder = [];
  questions.forEach(function (q) {
    if (!byCategory[q.category]) {
      byCategory[q.category] = [];
      categoryOrder.push(q.category);
    }
    byCategory[q.category].push(q);
  });

  var selected = [];
  var round = 0;
  while (selected.length < count) {
    var addedThisRound = false;
    for (var i = 0; i < categoryOrder.length && selected.length < count; i++) {
      var q = byCategory[categoryOrder[i]][round];
      if (q) {
        selected.push(q);
        addedThisRound = true;
      }
    }
    if (!addedThisRound) break; // bank exhausted before reaching count
    round++;
  }
  return selected;
};

IQLY.scoring = {
  /**
   * @param {Array} answers - selected option indexes, in question order
   * @returns {{score:number, percentile:number, categories:Object,
   *            categoryDetails:Object (each {correct, total, items:
   *            [{prompt, isCorrect}]}), standout:string, archetype:Object}}
   */
  computeResult: function (answers) {
    answers = answers || [];
    var questions = IQLY.selectQuestions(IQLY.CONFIG.flow.questionCount);
    var byCategory = {}; // category -> {correct, total, items}

    questions.forEach(function (q, i) {
      var cat = q.category;
      if (!byCategory[cat]) byCategory[cat] = { correct: 0, total: 0, items: [] };
      var isCorrect = answers[i] === q.correctIndex;
      byCategory[cat].total++;
      if (isCorrect) byCategory[cat].correct++;
      // Per-question right/wrong rows, for the locked category-report
      // panel's blurred teaser (docs/fixes.md item 4 follow-up) — real
      // question prompts + real correctness, never fabricated rows.
      byCategory[cat].items.push({ prompt: q.prompt, isCorrect: isCorrect });
    });

    var correctCount = 0;
    answers.forEach(function (a, i) {
      if (questions[i] && a === questions[i].correctIndex) correctCount++;
    });

    var categories = {};
    // Raw right/wrong counts per category, alongside the rounded
    // percentages above — the locked category-breakdown teaser on
    // partialResult (docs/fixes.md item 4) blurs this real data rather
    // than fabricated placeholder text.
    var categoryDetails = {};
    for (var cat in byCategory) {
      var c = byCategory[cat];
      categories[cat] = c.total ? Math.round((c.correct / c.total) * 100) : 0;
      categoryDetails[cat] = { correct: c.correct, total: c.total, items: c.items };
    }

    // Deliberately bounded to a flattering-but-plausible range (90–135):
    // this screen's job is to convert, not clinically norm a score, and
    // there is no real benchmark population yet (write-up.md concedes
    // this). A demoralizing sub-average number would directly hurt the
    // completion->account-creation transition it exists to drive.
    var total = questions.length || 1;
    var ratio = correctCount / total;
    var score = Math.round(90 + ratio * 45);

    var percentile = this.scoreToPercentile(score);
    var standout = this.getStandoutCategory(categories);
    var archetype = IQLY.CONFIG.archetypes[standout] || IQLY.CONFIG.archetypes.pattern;

    return {
      score: score,
      percentile: percentile,
      categories: categories,
      categoryDetails: categoryDetails,
      standout: standout,
      archetype: archetype,
    };
  },

  // Rough normal-curve approximation centered at 100, sd 15 — enough to
  // make the percentile feel earned without needing a real reference
  // population.
  scoreToPercentile: function (score) {
    var z = (score - 100) / 15;
    var p = 1 / (1 + Math.exp(-1.702 * z)); // logistic approximation of Φ(z)
    return Math.max(1, Math.min(99, Math.round(p * 100)));
  },

  // With ~1-2 questions per category, a raw percentage only ever lands on
  // 0/50/100 — displaying that as "0%" or "100%" reads as statistically
  // precise when it isn't, undermining the "insightful result" framing.
  // A 3-tier qualitative label is honest about that resolution instead.
  // Returns a key into CONFIG.copy.categoryLabels — screens.js owns the
  // actual wording, this only owns the semantic tier.
  categoryLabel: function (pct) {
    if (pct >= 67) return 'strong';
    if (pct >= 34) return 'average';
    return 'needsPractice';
  },

  /**
   * Picks the category to lead with on the partial-result screen
   * (CONFIG.result.leadWith drives *that* it's shown; this picks *which*).
   */
  getStandoutCategory: function (categories) {
    var best = null;
    for (var key in categories) {
      if (!best || categories[key] > categories[best]) {
        best = key;
      }
    }
    return best;
  },
};

window.IQLY = IQLY;
