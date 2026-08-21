import { useState } from "react";
import { login } from "../api.js";
import { AlertIcon, SpinnerIcon } from "./Icons.jsx";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const user = await login(username, password);
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(8,145,178,0.14),transparent_34rem),linear-gradient(180deg,#f4f4f5,#e4e4e7)] p-5 text-zinc-950 dark:bg-[radial-gradient(circle_at_top_left,rgba(8,145,178,0.18),transparent_34rem),linear-gradient(180deg,#09090b,#171717)] dark:text-zinc-100">
      <form onSubmit={handleSubmit} className="app-surface w-full max-w-sm rounded-lg p-7">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-950 font-mono text-base font-bold text-white shadow-glow dark:bg-white dark:text-zinc-950">
            AZ
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-zinc-950 dark:text-white">Technical Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Azm Digital</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              className="field"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="field"
            />
          </label>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              <AlertIcon width={15} height={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={submitting} className="primary-button mt-1 w-full py-2.5">
            {submitting && <SpinnerIcon width={14} height={14} />}
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </form>
    </div>
  );
}
