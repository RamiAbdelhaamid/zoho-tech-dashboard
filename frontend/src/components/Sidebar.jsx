import { SunIcon, MoonIcon, UserIcon, TicketIcon, TeamIcon, AlertIcon, RefreshIcon, CheckIcon, SpinnerIcon } from "./Icons.jsx";

const navBtn = (active) =>
  `flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
    active
      ? "bg-zinc-950 text-white shadow-sm dark:bg-white dark:text-zinc-950"
      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
  }`;

export default function Sidebar({
  data,
  connected,
  error,
  onRefresh,
  refreshing,
  theme,
  onToggleTheme,
  user,
  onLogout,
  view,
  onViewChange,
}) {
  const statusBreakdown = data?.statusBreakdown || [];
  const pollerStatus = data?.pollerStatus;
  const pollerFailing =
    pollerStatus?.lastErrorAt &&
    (!pollerStatus.lastSuccessAt || new Date(pollerStatus.lastErrorAt) > new Date(pollerStatus.lastSuccessAt));

  return (
    <aside className="z-20 w-full border-b border-zinc-200/80 bg-white/85 p-4 backdrop-blur dark:border-white/10 dark:bg-neutral-950/85 md:sticky md:top-0 md:h-screen md:w-80 md:min-w-80 md:overflow-y-auto md:border-b-0 md:border-r">
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-950 font-mono text-sm font-bold text-white shadow-glow dark:bg-white dark:text-zinc-950">
              AZ
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-tight text-zinc-950 dark:text-white">Technical Dashboard</h1>
              <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Azm Digital</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleTheme}
            title="Toggle theme"
            aria-label="Toggle theme"
            className="icon-button"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>

        <nav className="grid grid-cols-2 gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-white/10 dark:bg-white/5 md:grid-cols-1">
          <button type="button" className={navBtn(view === "tickets")} onClick={() => onViewChange("tickets")}>
            <TicketIcon width={15} height={15} /> Tickets
          </button>
          <button type="button" className={navBtn(view === "my")} onClick={() => onViewChange("my")}>
            <UserIcon width={15} height={15} /> My Work
          </button>
          <button type="button" className={navBtn(view === "team")} onClick={() => onViewChange("team")}>
            <TeamIcon width={15} height={15} /> Team
          </button>
          <button type="button" className={navBtn(view === "resolved")} onClick={() => onViewChange("resolved")}>
            <CheckIcon width={15} height={15} /> Resolved
          </button>
        </nav>

        <div className="soft-panel p-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-500" : "bg-rose-500"}`} />
            <span className="font-semibold text-zinc-700 dark:text-zinc-200">{connected ? "Live connection" : "Offline"}</span>
          </div>
          <div className="mt-2 text-zinc-500 dark:text-zinc-400">
            Last refresh:{" "}
            <span className="font-mono text-zinc-700 dark:text-zinc-200">
              {data?.updatedAt ? new Date(data.updatedAt).toLocaleString("en-GB") : "No sync yet"}
            </span>
          </div>
          <div className="mt-1 text-zinc-500 dark:text-zinc-400">Tickets are fetched automatically every 5 seconds.</div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            <AlertIcon width={15} height={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {pollerFailing && (
          <div
            className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
            title={pollerStatus.lastError || ""}
          >
            <AlertIcon width={15} height={15} className="mt-0.5 shrink-0" />
            <span>
              Zoho fetch failing since {new Date(pollerStatus.lastErrorAt).toLocaleTimeString("en-GB")}
              {pollerStatus.consecutiveFailures > 1 ? ` (${pollerStatus.consecutiveFailures} in a row)` : ""}:{" "}
              {pollerStatus.lastError}
            </span>
          </div>
        )}

        <button onClick={onRefresh} disabled={refreshing} className="primary-button w-full">
          {refreshing ? <SpinnerIcon width={14} height={14} /> : <RefreshIcon width={14} height={14} />}
          {refreshing ? "Refreshing..." : "Refresh Now"}
        </button>

        {view === "tickets" && (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
            {statusBreakdown.map(({ status, count }) => (
              <div key={status} className="soft-panel flex items-center justify-between gap-3 px-3 py-2">
                <div className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">{status}</div>
                <div className="font-mono text-base font-semibold">{count}</div>
              </div>
            ))}
          </div>
        )}

        <div className="soft-panel mt-auto p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                <UserIcon width={15} height={15} />
              </div>
              <div className="min-w-0">
                <div className="truncate font-semibold text-zinc-900 dark:text-white">{user.name}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Signed in</div>
              </div>
            </div>
            <button type="button" onClick={onLogout} className="ghost-button px-2.5 py-1.5 text-xs">
              Log out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
