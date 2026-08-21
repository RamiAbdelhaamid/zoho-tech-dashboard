const config = require("./config");
const zoho = require("./zoho/zohoClient");
const store = require("./store");
const { buildGroupedPayload } = require("./grouping");
const pollerStatus = require("./pollerStatus");

let polling = false;

async function fetchInScopeTickets() {
  const raw = await zoho.getRecentTickets({ limit: config.poll.scanLimit, from: 0 });
  const deptSet = new Set(config.zoho.departmentIds);
  return raw.filter(
    (t) =>
      deptSet.has(String(t.departmentId)) &&
      t.statusType !== "Closed" &&
      t.status === "Pending Technical Team"
  );
}

async function pollOnce(io, { log = console.log } = {}) {
  if (polling) {
    log("[poller] previous run still in progress, skipping this tick");
    return null;
  }
  polling = true;
  const startedAt = Date.now();

  try {
    let tickets;
    try {
      tickets = await fetchInScopeTickets();
    } catch (err) {
      // Zoho itself is unreachable/erroring (already retried with backoff
      // in zohoClient) — surface it instead of failing silently into the
      // console. Whatever tickets are already in the store stay visible.
      log(`[poller] failed to fetch tickets from Zoho: ${err.message}`);
      pollerStatus.recordError(err);
      const payload = pollerStatus.attach(buildGroupedPayload(await store.loadAll()));
      if (io) io.emit("tickets:update", payload);
      return payload;
    }

    // One write per ticket, flushed in a single Atlas round-trip — no AI
    // analysis anymore, so this is just a plain field refresh from Zoho.
    const pending = tickets.map((ticket) => {
      const id = ticket.id;
      return {
        id,
        data: {
          id,
          num: ticket.ticketNumber,
          subject: ticket.subject,
          dept: ticket.departmentId,
          requester: ticket.email || "(no email on file)",
          status: ticket.status,
          statusType: ticket.statusType,
          threadCount: Number(ticket.threadCount) || 0,
          createdTime: ticket.createdTime,
          url: ticket.webUrl || zoho.ticketUrl(id),
        },
      };
    });

    await store.bulkUpsert(pending);

    // Don't let already-resolved tickets get purged just because Zoho moved
    // their status on once they were handled — the Resolved tab is meant to
    // keep that history even after the ticket falls out of the narrower
    // "Pending Technical Team" fetch scope above.
    const stored = await store.loadAll();
    const resolvedIds = Object.entries(stored)
      .filter(([, t]) => t.workStatus === "resolved")
      .map(([id]) => id);
    const keepIds = new Set([...tickets.map((t) => t.id), ...resolvedIds]);
    await store.replaceAllKeys([...keepIds]);

    pollerStatus.recordSuccess();
    const payload = pollerStatus.attach(buildGroupedPayload(await store.loadAll()));
    if (io) io.emit("tickets:update", payload);

    log(
      `[poller] done in ${Date.now() - startedAt}ms — ${tickets.length} in-scope tickets`
    );
    return payload;
  } finally {
    polling = false;
  }
}

function start(io) {
  pollOnce(io).catch((err) => console.error("[poller] initial run failed:", err.message));
  if (config.poll.intervalMs <= 0) {
    console.log("[poller] automatic polling disabled (POLL_INTERVAL_MS<=0) — use the Update Now button / POST /api/refresh to poll manually");
    return null;
  }
  return setInterval(() => {
    pollOnce(io).catch((err) => console.error("[poller] run failed:", err.message));
  }, config.poll.intervalMs);
}

module.exports = { start, pollOnce };
