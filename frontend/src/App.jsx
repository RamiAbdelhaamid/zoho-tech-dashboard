import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchTickets,
  fetchTeamMembers,
  refreshNow,
  setTicketStatus,
  addTicketComment,
  editTicketComment,
  deleteTicketComment,
  connectSocket,
  logout as apiLogout,
} from "./api.js";
import Sidebar from "./components/Sidebar.jsx";
import TicketCard from "./components/TicketCard.jsx";
import TeamOverview from "./components/TeamOverview.jsx";
import ResolvedTickets from "./components/ResolvedTickets.jsx";
import MyWork from "./components/MyWork.jsx";
import ActivityFeed from "./components/ActivityFeed.jsx";
import TicketDrawer from "./components/TicketDrawer.jsx";
import Login from "./components/Login.jsx";
import NewTicketToasts from "./components/NewTicketToasts.jsx";
import { CheckIcon, SearchIcon, SpinnerIcon, TeamIcon, TicketIcon } from "./components/Icons.jsx";
import { getAllTickets, getTicketById } from "./ticketUtils.js";
import { playChime, startTitleFlash, stopTitleFlash } from "./notifications.js";

const THEME_KEY = "zoho-tech-dashboard-theme";
const USER_KEY = "zoho-tech-dashboard-user";

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  });
  const [data, setData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("tickets");
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "dark");
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [focusDrawerComment, setFocusDrawerComment] = useState(false);
  const [toasts, setToasts] = useState([]);
  const seenTicketIdsRef = useRef(null);

  function applyPayload(payload) {
    const incoming = payload?.tickets || [];
    if (seenTicketIdsRef.current) {
      const newTickets = incoming.filter((t) => !seenTicketIdsRef.current.has(t.id));
      if (newTickets.length > 0) {
        playChime();
        setToasts((prev) =>
          [...prev, ...newTickets.map((t) => ({ key: `${t.id}-${Date.now()}`, id: t.id, num: t.num, subject: t.subject }))].slice(-4)
        );
        if (document.hidden) startTitleFlash(newTickets.length);
      }
    }
    seenTicketIdsRef.current = new Set(incoming.map((t) => t.id));
    setData(payload);
  }

  useEffect(() => {
    function onVisibilityChange() {
      if (!document.hidden) stopTitleFlash();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    if (!user) return;

    fetchTickets()
      .then(applyPayload)
      .catch((e) => {
        if (e.unauthorized) handleLogout();
        else setError(e.message);
      });

    fetchTeamMembers()
      .then(setTeamMembers)
      .catch((e) => {
        if (e.unauthorized) handleLogout();
      });

    const socket = connectSocket((payload) => {
      applyPayload(payload);
      setError(null);
    });
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => handleLogout());

    return () => socket.disconnect();
  }, [user]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  function handleLoginSuccess(loggedInUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  }

  function handleLogout() {
    apiLogout();
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setData(null);
    setTeamMembers([]);
    setToasts([]);
    seenTicketIdsRef.current = null;
    stopTitleFlash();
  }

  function dismissToast(key) {
    setToasts((prev) => prev.filter((t) => t.key !== key));
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const payload = await refreshNow();
      applyPayload(payload);
      setError(null);
    } catch (e) {
      if (e.unauthorized) handleLogout();
      else setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }

  function markPending(id, isPending) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (isPending) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleStatusChange(id, status) {
    markPending(id, true);
    try {
      const payload = await setTicketStatus(id, status);
      setData(payload);
      setError(null);
    } catch (e) {
      if (e.unauthorized) handleLogout();
      else setError(e.message);
    } finally {
      markPending(id, false);
    }
  }

  async function handleAddComment(id, body, parentId = null, attachments = []) {
    try {
      const payload = await addTicketComment(id, body, parentId, attachments);
      setData(payload);
      setError(null);
    } catch (e) {
      if (e.unauthorized) handleLogout();
      else setError(e.message);
      throw e;
    }
  }

  async function handleEditComment(id, commentId, body) {
    try {
      const payload = await editTicketComment(id, commentId, body);
      setData(payload);
      setError(null);
    } catch (e) {
      if (e.unauthorized) handleLogout();
      else setError(e.message);
      throw e;
    }
  }

  async function handleDeleteComment(id, commentId) {
    try {
      const payload = await deleteTicketComment(id, commentId);
      setData(payload);
      setError(null);
    } catch (e) {
      if (e.unauthorized) handleLogout();
      else setError(e.message);
      throw e;
    }
  }

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  function openTicket(ticket, options = {}) {
    setSelectedTicketId(ticket?.id || null);
    setFocusDrawerComment(Boolean(options.focusComment));
  }

  const searchTerm = search.trim().toLowerCase();
  function matchesSearch(t) {
    if (!searchTerm) return true;
    return (
      String(t.num || "").toLowerCase().includes(searchTerm) ||
      String(t.requester || "").toLowerCase().includes(searchTerm)
    );
  }

  const visibleTickets = useMemo(() => {
    if (!data?.tickets) return [];
    if (!searchTerm) return data.tickets;
    return data.tickets.filter(matchesSearch);
  }, [data, searchTerm]);

  if (!user) {
    return <Login onLogin={handleLoginSuccess} />;
  }

  const allTickets = getAllTickets(data);
  const activeCount = data?.tickets?.length || 0;
  const resolvedCount = data?.resolvedList?.length || 0;
  const pickedCount = allTickets.filter((t) => t.assigneeUsername && t.workStatus !== "resolved").length;
  const myCount = allTickets.filter((t) => t.assigneeUsername === user.username).length;
  const selectedTicket = getTicketById(data, selectedTicketId);
  const nothingToShow = data && visibleTickets.length === 0;

  const pageMeta = {
    tickets: {
      eyebrow: "Live Queue",
      title: "Support Tickets",
      subtitle: `${activeCount} active ticket${activeCount === 1 ? "" : "s"} pending technical team`,
    },
    my: {
      eyebrow: "My Queue",
      title: "My Work",
      subtitle: `${myCount} ticket${myCount === 1 ? "" : "s"} assigned to you`,
    },
    team: {
      eyebrow: "Team Load",
      title: "Team Overview",
      subtitle: `${teamMembers.length} technician${teamMembers.length === 1 ? "" : "s"} with assigned work`,
    },
    resolved: {
      eyebrow: "Closed Work",
      title: "Resolved Tickets",
      subtitle: `${resolvedCount} ticket${resolvedCount === 1 ? "" : "s"} completed`,
    },
  }[view];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(8,145,178,0.10),transparent_36rem),linear-gradient(180deg,#f4f4f5,#e4e4e7)] text-zinc-950 dark:bg-[radial-gradient(circle_at_top_left,rgba(8,145,178,0.16),transparent_34rem),linear-gradient(180deg,#09090b,#171717)] dark:text-zinc-100 md:flex">
      <Sidebar
        data={data}
        connected={connected}
        error={error}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        theme={theme}
        onToggleTheme={toggleTheme}
        user={user}
        onLogout={handleLogout}
        view={view}
        onViewChange={setView}
      />
      <main className="min-w-0 flex-1 px-4 py-5 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5">
          <header className="app-surface rounded-lg px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase text-cyan-700 dark:text-cyan-300">{pageMeta.eyebrow}</div>
                <h1 className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-white sm:text-3xl">
                  {pageMeta.title}
                </h1>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{pageMeta.subtitle}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:min-w-[28rem]">
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <TicketIcon width={13} height={13} /> Active
                  </div>
                  <div className="mt-1 font-mono text-xl font-semibold">{activeCount}</div>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <TeamIcon width={13} height={13} /> Picked
                  </div>
                  <div className="mt-1 font-mono text-xl font-semibold">{pickedCount}</div>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <CheckIcon width={13} height={13} /> Resolved
                  </div>
                  <div className="mt-1 font-mono text-xl font-semibold">{resolvedCount}</div>
                </div>
              </div>
            </div>
          </header>

          {view === "tickets" && data && (
            <div className="soft-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="field flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-zinc-500 dark:text-zinc-400">
                <SearchIcon width={16} height={16} className="shrink-0" />
                <input
                  type="search"
                  placeholder="Search ticket number or requester"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
                />
              </label>
              {search && (
                <button type="button" onClick={() => setSearch("")} className="ghost-button px-3 py-2 text-xs">
                  Clear
                </button>
              )}
            </div>
          )}

          {!data && !error && (
            <div className="soft-panel flex flex-col items-center gap-4 py-16 text-zinc-500 dark:text-zinc-400">
              <SpinnerIcon width={28} height={28} />
              Loading tickets...
            </div>
          )}

          {data && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="flex min-w-0 flex-col gap-5">
                {view === "my" && (
                  <MyWork
                    data={data}
                    currentUser={user}
                    onStatusChange={handleStatusChange}
                    onAddComment={handleAddComment}
                    onEditComment={handleEditComment}
                    onDeleteComment={handleDeleteComment}
                    onOpenTicket={openTicket}
                    pendingIds={pendingIds}
                  />
                )}

                {view === "team" && (
                  <TeamOverview
                    teamMembers={teamMembers}
                    data={data}
                    currentUser={user}
                    onStatusChange={handleStatusChange}
                    pendingIds={pendingIds}
                  />
                )}

                {view === "resolved" && (
                  <ResolvedTickets
                    data={data}
                    currentUser={user}
                    onStatusChange={handleStatusChange}
                    onOpenTicket={openTicket}
                    pendingIds={pendingIds}
                  />
                )}

                {view === "tickets" && (
                  <>
                    {nothingToShow && (
                      <p className="soft-panel py-16 text-center text-zinc-500 dark:text-zinc-400">No tickets match right now.</p>
                    )}
                    {visibleTickets.length > 0 && (
                      <section className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Pending Technical Team</h2>
                          <span className="rounded-full bg-white px-2.5 py-1 font-mono text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/10">
                            {visibleTickets.length}
                          </span>
                        </div>
                        <div className="grid gap-3">
                          {visibleTickets.map((t) => (
                            <TicketCard
                              key={t.id}
                              ticket={t}
                              currentUser={user}
                              onStatusChange={handleStatusChange}
                              onAddComment={handleAddComment}
                              onEditComment={handleEditComment}
                              onDeleteComment={handleDeleteComment}
                              onOpenTicket={openTicket}
                              pending={pendingIds?.has(t.id)}
                            />
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}
              </div>
              <ActivityFeed data={data} onOpenTicket={openTicket} />
            </div>
          )}
        </div>
      </main>
      <TicketDrawer
        ticket={selectedTicket}
        currentUser={user}
        onClose={() => {
          setSelectedTicketId(null);
          setFocusDrawerComment(false);
        }}
        onStatusChange={handleStatusChange}
        onAddComment={handleAddComment}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        focusComment={focusDrawerComment}
        pending={selectedTicket ? pendingIds.has(selectedTicket.id) : false}
      />
      <NewTicketToasts
        toasts={toasts}
        onDismiss={dismissToast}
        onOpen={(toast) => openTicket({ id: toast.id })}
      />
    </div>
  );
}
