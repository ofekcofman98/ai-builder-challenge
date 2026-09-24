/*
  scoring.js — IQLY.scoring: pure functions turning answers into a
  score/percentile/category/archetype result. No DOM, no state mutation —
  keeps it independently reusable from both the partial-result and
  full-result screens.
*/

var IQLY = window.IQLY || {};

IQLY.scoring = {
  /**
   * @param {Array} answers - selected option indexes, in question order
   * @returns {{score:number, percentile:number, categories:Object,
   *            standout:string, archetype:Object}}
   */
  computeResult: function (answers) {
    answers = answers || [];
    var questions = IQLY.QUESTIONS;
    var byCategory = {}; // category -> {correct, total}

    questions.forEach(function (q, i) {
      var cat = q.category;
      if (!byCategory[cat]) byCategory[cat] = { correct: 0, total: 0 };
      byCategory[cat].total++;
      if (answers[i] === q.correctIndex) byCategory[cat].correct++;
    });

    var correctCount = 0;
    answers.forEach(function (a, i) {
      if (questions[i] && a === questions[i].correctIndex) correctCount++;
    });

    var categories = {};
    for (var cat in byCategory) {
      var c = byCategory[cat];
      categories[cat] = c.total ? Math.round((c.correct / c.total) * 100) : 0;
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
