import { io } from "socket.io-client";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4001";

const TOKEN_KEY = "zoho-tech-dashboard-token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function authedFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401) {
    setToken(null);
    const err = new Error("Session expired, please log in again");
    err.unauthorized = true;
    throw err;
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `${options.method || "GET"} ${path} failed: ${res.status}`);
  return body;
}

export async function login(username, password) {
  const res = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Login failed");
  setToken(body.token);
  return { name: body.name, username: body.username };
}

export function logout() {
  setToken(null);
}

export function fetchTickets() {
  return authedFetch("/api/tickets");
}

export function fetchTicketThreads(id) {
  return authedFetch(`/api/tickets/${id}/threads`).then((body) => body.threads || []);
}

export function fetchTeamMembers() {
  return authedFetch("/api/team-members").then((body) => body.team);
}

export function refreshNow() {
  return authedFetch("/api/refresh", { method: "POST" });
}

export function setTicketStatus(id, status) {
  return authedFetch(`/api/tickets/${id}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export function addTicketComment(id, body, parentId = null, attachments = []) {
  return authedFetch(`/api/tickets/${id}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body, parentId, attachments }),
  });
}

export function editTicketComment(id, commentId, body) {
  return authedFetch(`/api/tickets/${id}/comments/${commentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
}

export function deleteTicketComment(id, commentId) {
  return authedFetch(`/api/tickets/${id}/comments/${commentId}`, {
    method: "DELETE",
  });
}

export function connectSocket(onUpdate) {
  const socket = io(API_URL, {
    transports: ["websocket", "polling"],
    auth: { token: getToken() },
  });
  socket.on("tickets:update", onUpdate);
  return socket;
}
