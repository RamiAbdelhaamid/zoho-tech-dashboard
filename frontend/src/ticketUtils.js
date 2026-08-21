import { BUCKET_META, STATUS_LABELS } from "./statusLabels.js";

export function getAllTickets(data) {
  if (!data) return [];
  return [...(data.tickets || []), ...(data.resolvedList || [])];
}

export function getTicketById(data, id) {
  if (!id) return null;
  return getAllTickets(data).find((ticket) => ticket.id === id) || null;
}

function ticketLabel(ticket) {
  return `#${ticket.num || ticket.id}`;
}

function historyDescription(entry) {
  if (entry.action === "priority") {
    const from = BUCKET_META[entry.from]?.label || entry.from || "-";
    const to = BUCKET_META[entry.to]?.label || entry.to || "-";
    return `changed priority from ${from} to ${to}`;
  }
  return `${STATUS_LABELS[entry.action] || entry.action}`;
}

export function buildActivity(data) {
  const items = [];

  for (const ticket of getAllTickets(data)) {
    for (const entry of ticket.history || []) {
      items.push({
        id: `history-${ticket.id}-${entry.at}-${entry.action}`,
        at: entry.at,
        byName: entry.byName || entry.by,
        ticket,
        type: "history",
        text: `${historyDescription(entry)} on ${ticketLabel(ticket)}`,
      });
    }

    for (const comment of ticket.comments || []) {
      const isReply = Boolean(comment.parentId);
      const attachments = comment.attachments?.length || 0;
      const action = comment.deletedAt ? "deleted" : comment.editedAt ? "edited" : isReply ? "replied on" : "commented on";
      const attachmentText = attachments ? ` with ${attachments} attachment${attachments === 1 ? "" : "s"}` : "";
      items.push({
        id: `comment-${ticket.id}-${comment.id}-${comment.editedAt || comment.deletedAt || comment.at}`,
        at: comment.deletedAt || comment.editedAt || comment.at,
        byName: comment.byName || comment.by,
        ticket,
        type: "comment",
        text: `${action} ${ticketLabel(ticket)}${attachmentText}`,
      });
    }
  }

  return items.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
}
