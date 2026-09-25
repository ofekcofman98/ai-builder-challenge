/*
  persistence.js — IQLY.persistence: saves/loads/clears the in-progress
  quiz snapshot in localStorage, so a mid-quiz refresh resumes instead of
  dropping the user back to the entry screen. Reuses tracking.js's
  try/catch-wrapped read/write convention (separate storage key — this one
  is read back and validated to resume a session, not just appended to as
  an event log) so a blocked/full localStorage never breaks the flow.
*/

var IQLY = window.IQLY || {};

IQLY.persistence = (function () {
  function storageKey() {
    return IQLY.CONFIG.persistence.storageKey;
  }

  function save(snapshot) {
    try {
      localStorage.setItem(storageKey(), JSON.stringify(snapshot));
    } catch (e) {
      // localStorage can be unavailable (private browsing, quota) —
      // persistence must never break the flow it's trying to resume.
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem(storageKey());
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clear() {
    try {
      localStorage.removeItem(storageKey());
    } catch (e) {
      // no-op
    }
  }

  return {
    save: save,
    load: load,
    clear: clear,
  };
})();

window.IQLY = IQLY;
