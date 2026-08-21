import { useMemo, useState } from "react";
import { UndoIcon, SpinnerIcon, SearchIcon } from "./Icons.jsx";
import TicketHistory from "./TicketHistory.jsx";

export default function ResolvedTickets({ data, currentUser, onStatusChange, onOpenTicket, pendingIds }) {
  const resolved = data?.resolvedList || [];
  const [query, setQuery] = useState("");
  const [assignee, setAssignee] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const assignees = useMemo(() => {
    return [...new Set(resolved.map((ticket) => ticket.assignee).filter(Boolean))].sort();
  }, [resolved]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return resolved.filter((ticket) => {
      const resolvedAt = ticket.resolvedAt ? new Date(ticket.resolvedAt) : null;
      const matchesQuery =
        !term ||
        String(ticket.num || "").toLowerCase().includes(term) ||
        String(ticket.subject || "").toLowerCase().includes(term) ||
        String(ticket.requester || "").toLowerCase().includes(term);
      const matchesAssignee = assignee === "all" || ticket.assignee === assignee;
      const matchesFrom = !fromDate || (resolvedAt && resolvedAt >= new Date(`${fromDate}T00:00:00`));
      const matchesTo = !toDate || (resolvedAt && resolvedAt <= new Date(`${toDate}T23:59:59`));
      return matchesQuery && matchesAssignee && matchesFrom && matchesTo;
    });
  }, [resolved, query, assignee, fromDate, toDate]);

  if (resolved.length === 0) {
    return <p className="soft-panel py-16 text-center text-zinc-500 dark:text-zinc-400">No resolved tickets yet.</p>;
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="soft-panel grid gap-3 p-4 lg:grid-cols-[1fr_repeat(3,auto)]">
        <label className="field flex min-w-0 items-center gap-2 px-3 py-2 text-zinc-500 dark:text-zinc-400">
          <SearchIcon width={15} height={15} />
          <input
            type="search"
            placeholder="Search resolved tickets"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
          />
        </label>
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="field">
          <option value="all">All assignees</option>
          {assignees.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="field" />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="field" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Resolved Archive</h2>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 font-mono text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/10">
          {filtered.length} / {resolved.length}
        </span>
      </div>

      <div className="soft-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
                <th className="px-4 py-3 text-left font-semibold">Ticket</th>
                <th className="px-4 py-3 text-left font-semibold">Resolved by</th>
                <th className="px-4 py-3 text-left font-semibold">Resolved</th>
                <th className="px-4 py-3 text-left font-semibold">History</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const isMine = currentUser && t.assigneeUsername === currentUser.username;
                const pending = pendingIds?.has(t.id);
                return (
                  <tr key={t.id} className="border-b border-zinc-100 align-top last:border-b-0 hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5">
                    <td className="min-w-[18rem] px-4 py-3">
                      <button type="button" onClick={() => onOpenTicket?.(t)} className="text-left font-medium text-zinc-950 hover:text-cyan-700 dark:text-white dark:hover:text-cyan-300">
                        <span className="mr-1 rounded-full bg-zinc-100 px-1.5 py-0.5 font-mono text-[10.5px] font-medium text-zinc-500 ring-1 ring-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/10">
                          #{t.num}
                        </span>
                        {t.subject}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{t.assignee || "-"}</td>
                    <td className="px-4 py-3 font-mono text-zinc-500 dark:text-zinc-400">{t.resolvedAt ? new Date(t.resolvedAt).toLocaleString("en-GB") : "-"}</td>
                    <td className="px-4 py-3">
                      <TicketHistory history={t.history} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => onOpenTicket?.(t)} className="ghost-button px-2 py-1 text-[11px]">
                          Details
                        </button>
                        {isMine && (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => onStatusChange(t.id, "picked")}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-neutral-900 dark:text-zinc-300 dark:hover:border-cyan-500/50 dark:hover:text-cyan-300"
                          >
                            {pending ? <SpinnerIcon width={11} height={11} /> : <UndoIcon width={11} height={11} />} Reopen
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    No resolved tickets match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
