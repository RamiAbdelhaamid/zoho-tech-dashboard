import { useMemo } from "react";
import { STATUS_LABELS } from "../statusLabels.js";
import WorkflowControls from "./WorkflowControls.jsx";
import { ExternalLinkIcon } from "./Icons.jsx";

const STATUS_BADGE_COLORS = {
  new: "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/15",
  picked: "bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-500/30",
  working: "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/30",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
};

function allTickets(data) {
  if (!data) return [];
  return [...(data.tickets || []), ...(data.resolvedList || [])];
}

function CountChip({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/15",
    cyan: "bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-500/30",
    orange: "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/30",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
  };
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${tones[tone]}`}>{children}</span>;
}

export default function TeamOverview({ teamMembers, data, currentUser, onStatusChange, pendingIds }) {
  const tickets = useMemo(() => allTickets(data), [data]);

  const stats = useMemo(() => {
    return teamMembers
      .map((m) => {
        const mine = tickets
          .filter((t) => t.assigneeUsername === m.username)
          .sort((a, b) => new Date(b.pickedAt || 0) - new Date(a.pickedAt || 0));
        const picked = mine.filter((t) => t.workStatus === "picked").length;
        const working = mine.filter((t) => t.workStatus === "working").length;
        const resolved = mine.filter((t) => t.workStatus === "resolved").length;
        const active = mine.filter((t) => t.workStatus !== "resolved");
        return { ...m, picked, working, resolved, active: picked + working, total: mine.length, tickets: active };
      })
      .sort((a, b) => b.active - a.active || b.total - a.total);
  }, [teamMembers, tickets]);

  const unassignedCount = useMemo(() => tickets.filter((t) => !t.assigneeUsername).length, [tickets]);

  return (
    <div className="flex flex-col gap-4">
      <div className="soft-panel flex items-center justify-between gap-3 px-4 py-3 text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">Unassigned tickets</span>
        <span className="font-mono text-lg font-semibold text-zinc-950 dark:text-white">{unassignedCount}</span>
      </div>

      {stats.map((m) => (
        <section key={m.username} className="soft-panel overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-4 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-base font-semibold text-zinc-950 dark:text-white">{m.name}</div>
              <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{m.total} total assigned</div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <CountChip tone="cyan">{m.active} active</CountChip>
              <CountChip>Picked {m.picked}</CountChip>
              <CountChip tone="orange">Working {m.working}</CountChip>
              <CountChip tone="green">Resolved {m.resolved}</CountChip>
            </div>
          </div>

          {m.tickets.length === 0 ? (
            <div className="px-4 py-8 text-sm text-zinc-500 dark:text-zinc-400">
              {m.total === 0 ? "No tickets picked up yet." : "No active tickets. See the Resolved tab."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
                    <th className="px-4 py-3 text-left font-semibold">Ticket</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Picked</th>
                  </tr>
                </thead>
                <tbody>
                  {m.tickets.map((t) => {
                    const isMine = currentUser && t.assigneeUsername === currentUser.username;
                    return (
                      <tr key={t.id} className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5">
                        <td className="min-w-[18rem] px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-zinc-950 dark:text-white">
                              <span className="mr-1 rounded-full bg-zinc-100 px-1.5 py-0.5 font-mono text-[10.5px] font-medium text-zinc-500 ring-1 ring-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/10">
                                #{t.num}
                              </span>
                              {t.subject}
                            </span>
                            <a
                              href={t.url}
                              target="_blank"
                              rel="noreferrer"
                              title="Open in Zoho"
                              aria-label="Open in Zoho"
                              className="shrink-0 text-zinc-400 hover:text-cyan-700 dark:text-zinc-500 dark:hover:text-cyan-300"
                            >
                              <ExternalLinkIcon width={13} height={13} />
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {isMine ? (
                            <WorkflowControls ticket={t} currentUser={currentUser} onStatusChange={onStatusChange} compact pending={pendingIds?.has(t.id)} />
                          ) : (
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${STATUS_BADGE_COLORS[t.workStatus] || STATUS_BADGE_COLORS.new}`}>
                              {STATUS_LABELS[t.workStatus] || t.workStatus}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-zinc-500 dark:text-zinc-400">{t.pickedAt ? new Date(t.pickedAt).toLocaleString("en-GB") : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
