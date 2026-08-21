export const STATUS_LABELS = {
  new: "New",
  picked: "Picked Up",
  working: "In Progress",
  resolved: "Resolved",
};

export const BUCKET_META = {
  red: {
    label: "Immediate",
    badge: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
    bar: "border-l-rose-500",
    dot: "bg-rose-500",
  },
  orange: {
    label: "Escalation",
    badge: "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/30",
    bar: "border-l-orange-500",
    dot: "bg-orange-500",
  },
  yellow: {
    label: "Overdue",
    badge: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
    bar: "border-l-amber-500",
    dot: "bg-amber-500",
  },
  green: {
    label: "Normal",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
    bar: "border-l-emerald-500",
    dot: "bg-emerald-500",
  },
  compact: {
    label: "Waiting",
    badge: "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/15",
    bar: "border-l-zinc-400",
    dot: "bg-zinc-400",
  },
};
