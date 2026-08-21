import { useState } from "react";
import { CheckIcon, CopyIcon } from "./Icons.jsx";

const AGENT_TICKET_BASE = "https://support.azmfintech.sa/agent/saudiazmfintech/contracts/tickets/details";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function ticketUrl(ticket) {
  return `${AGENT_TICKET_BASE}/${ticket.id}`;
}

export function ticketLinkLabel(ticket) {
  return `#${ticket.num} - Azm Digital`;
}

export default function TicketLinkCopy({ ticket, compact }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = ticketUrl(ticket);
    const label = ticketLinkLabel(ticket);
    const html = `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;

    try {
      // Puts a real, clickable hyperlink on the clipboard for rich-text
      // targets (email, Word, Slack, Teams, ...) — pasting shows just the
      // label text, underlined and linked to the ticket, not raw
      // Markdown/URL text. text/plain is the fallback for plain-text-only
      // targets, kept as the label alone (no visible URL clutter).
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([label], { type: "text/plain" }),
        }),
      ]);
    } catch {
      // Older/unsupported browsers, or a denied rich-write permission.
      await navigator.clipboard.writeText(label);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copyLink}
      title="Copy ticket link"
      className={`inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white font-semibold text-zinc-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-neutral-900 dark:text-zinc-300 dark:hover:border-cyan-500/50 dark:hover:text-cyan-300 ${
        compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs"
      }`}
    >
      {copied ? <CheckIcon width={12} height={12} /> : <CopyIcon width={12} height={12} />}
      {copied ? "Copied" : "Copy Link"}
    </button>
  );
}
