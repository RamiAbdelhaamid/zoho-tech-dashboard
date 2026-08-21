import { buildActivity } from "../ticketUtils.js";
import { ClockIcon, MessageIcon } from "./Icons.jsx";

export default function ActivityFeed({ data, onOpenTicket }) {
  const items = buildActivity(data).slice(0, 14);

  return (
    <aside className="soft-panel overflow-hidden">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-white/10">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-white">
          <ClockIcon width={15} height={15} /> Activity
        </div>
      </div>
      {items.length === 0 ? (
        <div className="px-4 py-8 text-sm text-zinc-500 dark:text-zinc-400">No activity yet.</div>
      ) : (
        <div className="flex max-h-[42rem] flex-col overflow-y-auto">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpenTicket(item.ticket)}
              className="flex gap-3 border-b border-zinc-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
            >
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                <MessageIcon width={14} height={14} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-zinc-950 dark:text-white">{item.byName || "System"}</span>
                <span className="mt-0.5 block text-xs leading-5 text-zinc-600 dark:text-zinc-300">{item.text}</span>
                <span className="mt-1 block font-mono text-[10.5px] text-zinc-400">{new Date(item.at).toLocaleString("en-GB")}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
