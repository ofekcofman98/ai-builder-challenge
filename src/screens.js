/*
  screens.js — IQLY.screens: one pure render function per screen name.
  Each function takes the data it needs and returns an HTML string (or DOM
  node) — it must not mutate IQLY.state or call IQLY.track directly. All
  copy comes from IQLY.CONFIG.copy; no literal user-facing strings here,
  so copy tests are config edits, not code edits.
*/

var IQLY = window.IQLY || {};

IQLY.screens = {
  // Populated once the flow is built (post-approval). Stubbed now so
  // render.js/main.js have a real object to wire against.
  entry: function () {
    return '<div class="screen"><!-- entry screen: built after structure approval --></div>';
  },
  quiz: function () {
    return '<div class="screen"><!-- quiz screen --></div>';
  },
  analyzing: function () {
    return '<div class="screen"><!-- analyzing / labor-illusion screen --></div>';
  },
  partialResult: function () {
    return '<div class="screen"><!-- partial result screen --></div>';
  },
  emailGate: function () {
    return '<div class="screen"><!-- email gate screen --></div>';
  },
  fullResult: function () {
    return '<div class="screen"><!-- full result screen --></div>';
  },
};

window.IQLY = IQLY;
