/**
 * Turns the flat ticket store into the shape the React dashboard renders:
 * a flat, newest-first "tickets" list plus a separate "resolvedList" for
 * anything a tech has marked resolved (kept out of the active list and
 * stats, and only shown in the Resolved tab).
 */
function buildGroupedPayload(storeMap) {
  const all = Object.values(storeMap);
  const resolvedList = all
    .filter((t) => t.workStatus === "resolved")
    .sort((a, b) => new Date(b.resolvedAt || 0) - new Date(a.resolvedAt || 0));
  const tickets = all
    .filter((t) => t.workStatus !== "resolved")
    .sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));

  const stats = {
    total: tickets.length,
    resolved: resolvedList.length,
  };

  // Sidebar filter breakdown, straight from Zoho's own status field.
  const statusCounts = new Map();
  for (const t of tickets) {
    const status = t.status || "Unknown";
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
  }
  const statusBreakdown = [...statusCounts.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  return {
    updatedAt: new Date().toISOString(),
    stats,
    tickets,
    resolvedList,
    statusBreakdown,
  };
}

module.exports = { buildGroupedPayload };
