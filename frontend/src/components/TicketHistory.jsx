import { useState } from "react";
import { ClockIcon } from "./Icons.jsx";
import { BUCKET_META } from "../statusLabels.js";

const ACTION_VERBS = {
  picked: "picked up",
  working: "started working",
  resolved: "resolved",
  new: "released",
};

function describe(entry) {
  if (entry.action === "priority") {
    const from = BUCKET_META[entry.from]?.label || entry.from || "-";
    const to = BUCKET_META[entry.to]?.label || entry.to || "-";
    return `changed priority ${from} to ${to}`;
  }
  return ACTION_VERBS[entry.action] || entry.action;
}

export default function TicketHistory({ history }) {
  const [open, setOpen] = useState(false);
  if (!history || history.length === 0) return null;

  const sorted = [...history].sort((a, b) => new Date(b.at) - new Date(a.at));

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 transition hover:text-cyan-700 dark:text-zinc-400 dark:hover:text-cyan-300"
      >
        <ClockIcon width={12} height={12} />
        {open ? "Hide" : "Show"} history ({history.length})
      </button>
      {open && (
        <ul className="mt-2 flex list-none flex-col gap-1.5 p-0">
          {sorted.map((h, i) => (
            <li
              key={i}
              className="flex flex-wrap items-baseline gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
            >
              <span className="font-semibold text-zinc-950 dark:text-white">{h.byName || h.by}</span> {describe(h)}
              <span className="ml-auto whitespace-nowrap font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                {new Date(h.at).toLocaleString("en-GB")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
