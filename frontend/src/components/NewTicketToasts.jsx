import { useEffect } from "react";
import { AlertIcon } from "./Icons.jsx";

export default function NewTicketToasts({ toasts, onDismiss, onOpen }) {
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((t) => (
        <ToastItem key={t.key} toast={t} onDismiss={onDismiss} onOpen={onOpen} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss, onOpen }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.key), 6000);
    return () => clearTimeout(timer);
  }, [toast.key, onDismiss]);

  return (
    <div className="pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-lg border border-cyan-500/30 bg-white p-3 shadow-lg ring-1 ring-black/5 dark:border-cyan-400/30 dark:bg-zinc-900 dark:ring-white/10">
      <span className="mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-400">
        <AlertIcon width={18} height={18} />
      </span>
      <button
        type="button"
        onClick={() => {
          onOpen(toast);
          onDismiss(toast.key);
        }}
        className="min-w-0 flex-1 text-left"
      >
        <span className="block text-sm font-semibold text-zinc-950 dark:text-white">New ticket #{toast.num}</span>
        <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">{toast.subject}</span>
      </button>
      <button
        type="button"
        onClick={() => onDismiss(toast.key)}
        className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
