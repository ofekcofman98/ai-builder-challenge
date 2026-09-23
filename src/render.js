/*
  render.js — IQLY.render: mounts whatever IQLY.screens produces into the
  DOM and binds its events. This is the only file that touches #app
  directly, keeping screens.js pure and state.js DOM-free.
*/

var IQLY = window.IQLY || {};

IQLY.render = {
  mount: function () {
    var screenName = IQLY.state.getCurrentScreen();
    var renderFn = IQLY.screens[screenName];
    var appEl = document.getElementById('app');

    if (!renderFn) {
      appEl.innerHTML = '<div class="screen">Unknown screen: ' + screenName + '</div>';
      return;
    }

    appEl.innerHTML = renderFn();
    // Event binding for interactive elements is added alongside each real
    // screen implementation once the structure is approved.
  },
};

window.IQLY = IQLY;
