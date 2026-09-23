/*
  scoring.js — IQLY.scoring: pure functions turning answers into a
  score/percentile/category breakdown. No DOM, no state mutation, no
  config reads beyond what's passed in — keeps it independently testable
  and reusable from both the partial-result and full-result screens.
*/

var IQLY = window.IQLY || {};

IQLY.scoring = {
  /**
   * @param {Array} answers - user's recorded answers
   * @returns {{score:number, percentile:number, categories:Object}}
   */
  computeResult: function (answers) {
    // Placeholder deterministic scoring — no real psychometric model here;
    // the product has no real benchmark data yet (write-up.md notes this
    // explicitly re: fabricated social proof).
    var score = 100 + (answers ? answers.length : 0);
    var percentile = 65;
    var categories = {
      pattern: 70,
      logic: 65,
      spatial: 60,
      memory: 68,
      sequence: 72,
    };
    return { score: score, percentile: percentile, categories: categories };
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
