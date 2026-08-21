import { useState } from "react";
import WorkflowControls from "./WorkflowControls.jsx";
import TicketHistory from "./TicketHistory.jsx";
import TicketComments from "./TicketComments.jsx";
import TicketLinkCopy from "./TicketLinkCopy.jsx";
import { ExternalLinkIcon } from "./Icons.jsx";

export default function TicketCard({
  ticket: t,
  currentUser,
  onStatusChange,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onOpenTicket,
  pending,
}) {
  const [showInlineComment, setShowInlineComment] = useState(false);
  const [commentFocusSignal, setCommentFocusSignal] = useState(0);

  return (
    <article className="soft-panel p-4 transition hover:-translate-y-0.5 hover:shadow-panel">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 text-[15px] font-semibold text-zinc-950 dark:text-white">
          <span className="mr-2 inline-flex rounded-full bg-zinc-100 px-2 py-0.5 align-middle font-mono text-[11px] font-medium text-zinc-500 ring-1 ring-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/10">
            #{t.num}
          </span>
          <span className="align-middle">{t.subject}</span>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {onOpenTicket && (
            <button type="button" onClick={() => onOpenTicket(t)} className="ghost-button px-2.5 py-1.5 text-xs">
              Details
            </button>
          )}
          <TicketLinkCopy ticket={t} />
          <a
            href={t.url}
            target="_blank"
            rel="noreferrer"
            className="ghost-button inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs"
          >
            <ExternalLinkIcon width={12} height={12} /> Open in Zoho
          </a>
          <span className="w-fit rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/10">
            {t.status}
          </span>
        </div>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-zinc-500 dark:text-zinc-400 sm:grid-cols-2">
        <span className="truncate">Requester: {t.requester}</span>
        <span className="font-mono">{new Date(t.createdTime).toLocaleString("en-GB")}</span>
      </div>

      <WorkflowControls
        ticket={t}
        currentUser={currentUser}
        onStatusChange={onStatusChange}
        onCommentClick={() => {
          setShowInlineComment(true);
          setCommentFocusSignal((value) => value + 1);
        }}
        pending={pending}
      />
      <TicketComments
        ticket={t}
        currentUser={currentUser}
        onAddComment={onAddComment}
        onEditComment={onEditComment}
        onDeleteComment={onDeleteComment}
        allowComposer={Boolean(t.assigneeUsername) || showInlineComment}
        autoFocusComment={showInlineComment}
        focusSignal={commentFocusSignal}
      />
      <TicketHistory history={t.history} />
    </article>
  );
}
