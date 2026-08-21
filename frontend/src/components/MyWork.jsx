import TicketCard from "./TicketCard.jsx";
import { getAllTickets } from "../ticketUtils.js";

const GROUPS = [
  { key: "working", title: "In Progress" },
  { key: "picked", title: "Picked Up" },
  { key: "resolved", title: "Resolved" },
];

export default function MyWork({
  data,
  currentUser,
  onStatusChange,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onOpenTicket,
  pendingIds,
}) {
  const mine = getAllTickets(data)
    .filter((ticket) => ticket.assigneeUsername === currentUser.username)
    .sort((a, b) => new Date(b.pickedAt || b.createdTime || 0) - new Date(a.pickedAt || a.createdTime || 0));

  if (mine.length === 0) {
    return <p className="soft-panel py-16 text-center text-zinc-500 dark:text-zinc-400">No tickets picked up by you yet.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      {GROUPS.map((group) => {
        const tickets = mine.filter((ticket) => (ticket.workStatus || "new") === group.key);
        if (!tickets.length) return null;

        return (
          <section key={group.key} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">{group.title}</h2>
              <span className="rounded-full bg-white px-2.5 py-1 font-mono text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/10">
                {tickets.length}
              </span>
            </div>
            <div className="grid gap-3">
              {tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  currentUser={currentUser}
                  onStatusChange={onStatusChange}
                  onAddComment={onAddComment}
                  onEditComment={onEditComment}
                  onDeleteComment={onDeleteComment}
                  onOpenTicket={onOpenTicket}
                  pending={pendingIds?.has(ticket.id)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
