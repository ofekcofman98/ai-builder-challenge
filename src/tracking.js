/*
  tracking.js — IQLY.track(name, payload): writes funnel events to
  localStorage. There's no backend, but the flow must be instrumented as if
  it were going live (per task) — every screen transition and CTA click
  should call this so step-level funnel metrics (write-up.md's 4-transition
  model) are measurable once this ships behind real traffic.
*/

var IQLY = window.IQLY || {};

IQLY.track = function (name, payload) {
  var storageKey = IQLY.CONFIG.tracking.storageKey;
  var event = {
    name: name,
    payload: payload || {},
    variantId: IQLY.CONFIG.tracking.variantId,
    timestamp: new Date().toISOString(),
  };

  var existing = [];
  try {
    existing = JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch (e) {
    existing = [];
  }

  existing.push(event);

  try {
    localStorage.setItem(storageKey, JSON.stringify(existing));
  } catch (e) {
    // localStorage can be unavailable (private browsing, quota) — tracking
    // must never break the flow it's observing.
  }
};

window.IQLY = IQLY;
