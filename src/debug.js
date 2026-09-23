/*
  debug.js — a QA-only panel proving the tracking layer works end-to-end
  without touching the real user's view. Active only behind ?debug=1, so
  it never appears for actual funnel traffic. Reads tracking.js's
  localStorage output directly; writes nothing back into the flow.
*/

var IQLY = window.IQLY || {};

(function () {

  function isDebugMode() {
    return /(?:^|[?&])debug=1(?:&|$)/.test(location.search);
  }

  function readEvents() {
    try {
      return JSON.parse(localStorage.getItem(IQLY.CONFIG.tracking.storageKey)) || [];
    } catch (e) {
      return [];
    }
  }

  function renderPanel() {
    var existing = document.getElementById('iqly-debug-panel');
    var events = readEvents();

    var rows = events.map(function (e) {
      return '<div class="debug-row">' +
        '<span class="debug-time">' + e.timestamp.slice(11, 19) + '</span>' +
        '<span class="debug-variant">' + e.variantId + '</span>' +
        '<span class="debug-name">' + e.name + '</span>' +
      '</div>';
    }).join('');

    var html =
      '<div class="debug-header">' +
        '<strong>Events (' + events.length + ')</strong>' +
        '<button type="button" data-debug-action="clear">Clear</button>' +
      '</div>' +
      '<div class="debug-rows">' + (rows || '<span class="text-muted">No events yet</span>') + '</div>';

    if (existing) {
      existing.innerHTML = html;
      return;
    }

    var panel = document.createElement('div');
    panel.id = 'iqly-debug-panel';
    panel.className = 'debug-panel';
    panel.innerHTML = html;
    document.body.appendChild(panel);

    panel.addEventListener('click', function (event) {
      if (event.target.getAttribute('data-debug-action') === 'clear') {
        localStorage.removeItem(IQLY.CONFIG.tracking.storageKey);
        renderPanel();
      }
    });
  }

  if (!isDebugMode()) return;

  document.addEventListener('DOMContentLoaded', function () {
    renderPanel();
    // Tracking events happen throughout the flow; poll on an interval
    // rather than instrumenting every call site, so this stays a
    // read-only observer that can't affect flow behavior.
    setInterval(renderPanel, 500);
  });

  window.IQLY = IQLY;

})();
