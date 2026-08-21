import { STATUS_LABELS } from "../statusLabels.js";
import { PinIcon, PlayIcon, CheckIcon, UndoIcon, MessageIcon, SpinnerIcon } from "./Icons.jsx";

const BADGE_COLORS = {
  new: "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/15",
  picked: "bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-500/30",
  working: "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/30",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
};

const BTN_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50";

const BTN_VARIANTS = {
  pick: "bg-cyan-600 text-white hover:bg-cyan-500 focus:ring-cyan-500/20",
  work: "bg-orange-500 text-white hover:bg-orange-400 focus:ring-orange-500/20",
  resolve: "bg-emerald-600 text-white hover:bg-emerald-500 focus:ring-emerald-500/20",
  neutral:
    "border border-zinc-200 bg-white text-zinc-700 hover:border-cyan-300 hover:text-cyan-700 focus:ring-cyan-500/10 dark:border-white/10 dark:bg-neutral-900 dark:text-zinc-300 dark:hover:border-cyan-500/50 dark:hover:text-cyan-300",
};

export default function WorkflowControls({ ticket, currentUser, onStatusChange, onCommentClick, compact, pending }) {
  const workStatus = ticket.workStatus || "new";
  const isMine = ticket.assigneeUsername === currentUser.username;
  const iconSize = compact ? 11 : 13;
  const size = compact ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs";

  function change(status) {
    if (pending) return;
    onStatusChange(ticket.id, status);
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : "mt-4 border-t border-zinc-200 pt-3 dark:border-white/10"}`}>
      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${BADGE_COLORS[workStatus]}`}>
        {STATUS_LABELS[workStatus]}
      </span>

      {pending && (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
          <SpinnerIcon width={12} height={12} /> Updating...
        </span>
      )}

      {!pending && ticket.assigneeUsername && (
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {isMine ? "Picked by you" : `Picked by ${ticket.assignee}`}
        </span>
      )}

      {!ticket.assigneeUsername && (
        <button
          type="button"
          disabled={pending}
          className={`${BTN_BASE} ${BTN_VARIANTS.pick} ${size}`}
          onClick={() => change("picked")}
        >
          {pending ? <SpinnerIcon width={iconSize} height={iconSize} /> : <PinIcon width={iconSize} height={iconSize} />} Pick Up
        </button>
      )}

      {onCommentClick && !compact && (
        <button
          type="button"
          className={`${BTN_BASE} ${BTN_VARIANTS.neutral} ${size}`}
          onClick={onCommentClick}
        >
          <MessageIcon width={iconSize} height={iconSize} /> Comment
        </button>
      )}

      {isMine && workStatus === "picked" && (
        <>
          <button
            type="button"
            disabled={pending}
            className={`${BTN_BASE} ${BTN_VARIANTS.work} ${size}`}
            onClick={() => change("working")}
          >
            <PlayIcon width={iconSize} height={iconSize} /> Start
          </button>
          <button
            type="button"
            disabled={pending}
            className={`${BTN_BASE} ${BTN_VARIANTS.resolve} ${size}`}
            onClick={() => change("resolved")}
          >
            <CheckIcon width={iconSize} height={iconSize} /> Resolved
          </button>
          <button
            type="button"
            disabled={pending}
            className={`${BTN_BASE} ${BTN_VARIANTS.neutral} ${size}`}
            onClick={() => change("new")}
          >
            <UndoIcon width={iconSize} height={iconSize} /> Release
          </button>
        </>
      )}

      {isMine && workStatus === "working" && (
        <>
          <button
            type="button"
            disabled={pending}
            className={`${BTN_BASE} ${BTN_VARIANTS.resolve} ${size}`}
            onClick={() => change("resolved")}
          >
            <CheckIcon width={iconSize} height={iconSize} /> Resolved
          </button>
          <button
            type="button"
            disabled={pending}
            className={`${BTN_BASE} ${BTN_VARIANTS.neutral} ${size}`}
            onClick={() => change("new")}
          >
            <UndoIcon width={iconSize} height={iconSize} /> Release
          </button>
        </>
      )}

      {isMine && workStatus === "resolved" && (
        <button
          type="button"
          disabled={pending}
          className={`${BTN_BASE} ${BTN_VARIANTS.neutral} ${size}`}
          onClick={() => change("picked")}
        >
          <UndoIcon width={iconSize} height={iconSize} /> Reopen
        </button>
      )}
    </div>
  );
}
