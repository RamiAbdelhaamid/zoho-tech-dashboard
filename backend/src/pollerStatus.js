// In-memory record of the poller's health, so a Zoho outage is visible in
// the UI instead of only sitting in server console logs. Attached to every
// payload the frontend receives (see grouping payload call sites).
let lastSuccessAt = null;
let lastErrorAt = null;
let lastError = null;
let consecutiveFailures = 0;

function recordSuccess() {
  lastSuccessAt = new Date().toISOString();
  lastError = null;
  lastErrorAt = null;
  consecutiveFailures = 0;
}

function recordError(err) {
  lastErrorAt = new Date().toISOString();
  lastError = err.message || String(err);
  consecutiveFailures += 1;
}

function getStatus() {
  return { lastSuccessAt, lastErrorAt, lastError, consecutiveFailures };
}

/** Mutates and returns the given payload with the current poller status attached. */
function attach(payload) {
  payload.pollerStatus = getStatus();
  return payload;
}

module.exports = { recordSuccess, recordError, getStatus, attach };
