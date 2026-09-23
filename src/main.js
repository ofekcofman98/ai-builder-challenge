/*
  main.js — IQLY.init: wires config/state/render together and starts the
  flow. Must load last, after every other src/ script.
*/

var IQLY = window.IQLY || {};

IQLY.init = function () {
  IQLY.track('page_view', {});
  IQLY.render.mount();
};

document.addEventListener('DOMContentLoaded', IQLY.init);

window.IQLY = IQLY;
