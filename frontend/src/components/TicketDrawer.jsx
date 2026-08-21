import { useEffect, useState } from "react";
import { fetchTicketThreads } from "../api.js";
import TicketComments from "./TicketComments.jsx";
import TicketHistory from "./TicketHistory.jsx";
import TicketLinkCopy from "./TicketLinkCopy.jsx";
import WorkflowControls from "./WorkflowControls.jsx";
import { ExternalLinkIcon, MessageIcon, SpinnerIcon } from "./Icons.jsx";

// Real Zoho thread bodies are raw Outlook/Word HTML — deeply nested spans,
// MSO conditional comments, and dozens of entity types (&quot;, &rsquo;,
// numeric refs, ...). A handwritten tag-stripping regex can only decode the
// handful of entities it happens to list and breaks on anything else,
// leaving literal "&quot;"/"&nbsp;" junk and mangled fragments in the
// output. The browser's own HTML parser handles every entity and tag
// correctly; parsing into a detached document (never attached to the live
// DOM, never used as innerHTML) keeps this safe from remote HTML/scripts.
function stripHtml(value) {
  const raw = String(value || "");
  if (!raw) return "";

  const withBreaks = raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n");

  const doc = new DOMParser().parseFromString(withBreaks, "text/html");
  doc.querySelectorAll("style, script, head").forEach((el) => el.remove());

  const BOM = String.fromCharCode(0xfeff);
  const NBSP = String.fromCharCode(0xa0);
  return (doc.body?.textContent || "")
    .split(BOM)
    .join("")
    .split(NBSP)
    .join(" ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const THREAD_PREVIEW_LIMIT = 3000;

function threadAuthor(thread) {
  return (
    thread.author?.name ||
    thread.author?.email ||
    thread.fromEmailAddress ||
    thread.sender?.name ||
    thread.channelRelatedInfo?.from ||
    "Unknown"
  );
}

function threadDate(thread) {
  return thread.createdTime || thread.sendDateTime || thread.sentTime || thread.modifiedTime;
}

function threadText(thread) {
  return stripHtml(
    thread.content ||
      thread.plainText ||
      thread.description ||
      thread.body ||
      thread.message ||
      thread.htmlBody ||
      thread.summary ||
      ""
  );
}

// Real thread bodies can run to hundreds of KB (quoted history, embedded
// signature images turned to text, etc.) — rendering that much text inline
// makes the drawer feel broken (huge scroll, sluggish). Preview + expand
// keeps it readable without losing anything.
function ThreadMessage({ text }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > THREAD_PREVIEW_LIMIT;
  const shown = expanded || !isLong ? text : `${text.slice(0, THREAD_PREVIEW_LIMIT)}…`;

  return (
    <>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
        {shown || "(No readable message body returned by Zoho.)"}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs font-semibold text-cyan-700 hover:text-cyan-600 dark:text-cyan-300 dark:hover:text-cyan-200"
        >
          {expanded ? "Show less" : `Show full message (${text.length.toLocaleString()} chars)`}
        </button>
      )}
    </>
  );
}

function TicketThreads({ ticketId }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ticketId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchTicketThreads(ticketId)
      .then((items) => {
        if (!cancelled) setThreads(items);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  return (
    <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
          <MessageIcon width={15} height={15} /> Zoho Threads
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 font-mono text-xs font-semibold text-zinc-500 ring-1 ring-zinc-200 dark:bg-neutral-950 dark:text-zinc-300 dark:ring-white/10">
          {loading ? "..." : threads.length}
        </span>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-4 text-sm text-zinc-500 dark:text-zinc-400">
          <SpinnerIcon width={14} height={14} /> Loading threads...
        </div>
      )}
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}
      {!loading && !error && threads.length === 0 && (
        <div className="py-4 text-sm text-zinc-500 dark:text-zinc-400">No Zoho threads found.</div>
      )}
      {!loading && !error && threads.length > 0 && (
        <div className="flex flex-col gap-2">
          {threads.map((thread, index) => {
            const text = threadText(thread);
            return (
              <article key={thread.id || index} className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-neutral-950">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-zinc-950 dark:text-white">
                    {thread.direction === "out" ? "Agent" : "Customer"}: {threadAuthor(thread)}
                  </span>
                  {threadDate(thread) && (
                    <>
                      <span className="text-zinc-300 dark:text-zinc-700">/</span>
                      <span className="font-mono text-zinc-500 dark:text-zinc-400">{new Date(threadDate(thread)).toLocaleString("en-GB")}</span>
                    </>
                  )}
                </div>
                <ThreadMessage text={text} />
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function TicketDrawer({
  ticket,
  currentUser,
  onClose,
  onStatusChange,
  onAddComment,
  onEditComment,
  onDeleteComment,
  focusComment,
  pending,
}) {
  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close ticket details" onClick={onClose} className="absolute inset-0 bg-zinc-950/45 backdrop-blur-sm" />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-white shadow-2xl dark:bg-neutral-950">
        <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 px-5 py-4 backdrop-blur dark:border-white/10 dark:bg-neutral-950/90">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-mono text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/10">
                  #{ticket.num}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">{ticket.subject}</h2>
            </div>
            <button type="button" onClick={onClose} className="ghost-button px-3 py-2 text-xs">
              Close
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="grid gap-2 text-xs text-zinc-500 dark:text-zinc-400 sm:grid-cols-2">
            <span>Requester: {ticket.requester}</span>
            <span>Status: {ticket.status}</span>
            <span className="font-mono">Created: {new Date(ticket.createdTime).toLocaleString("en-GB")}</span>
            <span>Assignee: {ticket.assignee || "Unassigned"}</span>
            <div className="flex flex-wrap items-center gap-2">
              <a href={ticket.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-cyan-700 hover:text-cyan-600 dark:text-cyan-300">
                Open in Zoho <ExternalLinkIcon width={12} height={12} />
              </a>
              <TicketLinkCopy ticket={ticket} compact />
            </div>
          </div>

          <WorkflowControls ticket={ticket} currentUser={currentUser} onStatusChange={onStatusChange} pending={pending} />

          <TicketThreads ticketId={ticket.id} />

          <TicketComments
            ticket={ticket}
            currentUser={currentUser}
            onAddComment={onAddComment}
            onEditComment={onEditComment}
            onDeleteComment={onDeleteComment}
            allowComposer
            autoFocusComment={focusComment}
          />
          <TicketHistory history={ticket.history} />
        </div>
      </aside>
    </div>
  );
}
