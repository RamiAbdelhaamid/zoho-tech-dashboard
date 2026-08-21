---
name: run-zoho-tech-dashboard
description: Build, run, and drive zoho-tech-dashboard (Express/Socket.io backend + Vite/React frontend). Use when asked to start the dashboard, launch the backend or frontend dev server, take a screenshot of the ticket dashboard, log in and pick/resolve a ticket, or otherwise interact with the running app.
---

zoho-tech-dashboard is a two-part web app: an Express + Socket.io backend
(`backend/`, port 4001) backed by MongoDB Atlas and Zoho Desk, and a Vite/React
frontend (`frontend/`, port 5180) that logs in and renders it live. `chromium-cli`
is not available in this environment, so it's driven with a small raw-Playwright
script instead: `.claude/skills/run-zoho-tech-dashboard/driver.mjs`.

All paths below are relative to the repo root (`zoho-tech-dashboard/`).

## Prerequisites

Windows + Git Bash, verified with Node v24.19.0 (any reasonably recent Node
should work — nothing here uses bleeding-edge syntax). No OS packages needed;
Playwright downloads its own headless Chromium on first `npx playwright install`.

`backend/.env` must already exist with a working `MONGODB_URI` (Atlas),
`ZOHO_CLIENT_ID`/`ZOHO_CLIENT_SECRET`/`ZOHO_REFRESH_TOKEN`, and `JWT_SECRET` —
this checkout already has them configured. Without them the backend either
fails to start or comes up with an empty ticket list.

## Setup

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../.claude/skills/run-zoho-tech-dashboard && npm install
npx playwright install chromium   # downloads headless Chromium, ~115MB first run
```

## Build

No build step needed to run/drive it — both servers run in dev mode
(`frontend` via Vite, `backend` via plain `node`). `frontend` does have
`npm run build` for a production bundle, but nothing here depends on it.

## Run (agent path)

Start both dev servers in the background, wait for each to actually be
serving, then drive it:

```bash
# 1. Backend — port 4001. Wait for the ready line, not a fixed sleep.
cd backend
(nohup node src/index.js > backend.log 2>&1 &)
timeout 20 bash -c 'until grep -q "listening on" backend.log 2>/dev/null; do sleep 0.5; done'

# 2. Frontend — Vite is pinned to port 5180 in vite.config.js (strictPort: true).
cd ../frontend
(nohup npm run dev > frontend.log 2>&1 &)
timeout 20 bash -c 'until curl -sf http://localhost:5180 >/dev/null; do sleep 0.5; done'

# 3. Create a throwaway login (there is no self-serve signup — see Gotchas).
cd ../.claude/skills/run-zoho-tech-dashboard
node test-user.mjs create

# 4. Drive it.
node driver.mjs
# → logs in, walks Tickets / My Work / Team / Resolved tabs, picks up a
#   ticket, prints any browser console errors, exits non-zero if any.

# 5. Clean up the throwaway login (also releases anything it picked up).
node test-user.mjs delete
```

Screenshots land in `.claude/skills/run-zoho-tech-dashboard/screenshots/`:

| file | what it shows |
|---|---|
| `01-login.png` | Login screen |
| `02-tickets-tab.png` | Tickets tab, freshly logged in |
| `03-my-work.png` | My Work tab |
| `04-team.png` | Team tab |
| `05-resolved.png` | Resolved tab |
| `06-picked-ticket.png` | Tickets tab after picking up a ticket — workflow controls (Start / Resolved / Release) visible |

To stop the servers: find the PID on the port and kill it —
`netstat -ano | grep ':4001' | grep LISTENING` (same for `:5180`), then
`powershell -Command "Stop-Process -Id <pid> -Force"`.

`driver.mjs` also accepts a different frontend URL as its only arg
(`node driver.mjs http://localhost:5180`) if you're pointing it somewhere
other than the default dev server.

## Run (human path)

Same two `npm`/`node` launches above, then open `http://localhost:5180` in a
browser and log in with a real seeded account from `backend/src/auth/users.js`
(the actual passwords are only known as bcrypt hashes there — ask whoever set
up the account, or use `test-user.mjs create` for a throwaway one). Ctrl-C
each terminal to stop.

---

## Gotchas

- **`chromium-cli` isn't installed here.** `which chromium-cli` comes back
  empty. Use `driver.mjs` (raw Playwright: `chromium.launch()` +
  `page.goto()`) instead — same idea, no CLI wrapper.
- **No self-serve signup.** Real accounts live in MongoDB's `users`
  collection (seeded once from `backend/src/auth/users.js` via
  `backend/scripts/migrate-users-to-mongo.js`). Driving a login therefore
  needs either a real seeded account or a throwaway one —
  `test-user.mjs create`/`delete` does the latter directly against Atlas.
- **Restarting the backend needs the *previous* process killed first.**
  `node src/index.js &` inside this Bash tool doesn't get cleanly reaped —
  the old process keeps the port. Relaunching without killing it first fails
  with `EADDRINUSE: address already in use :::4001`. Find the PID with
  `netstat -ano | grep ':4001' | grep LISTENING` and
  `Stop-Process -Id <pid> -Force` before relaunching.
- **The first backend request after a fresh start takes a few seconds.**
  Startup does one full poll (Zoho fetch + MongoDB writes, ~2-4s with 3-50
  tickets depending on scope) before the first Socket.io payload goes out.
  `driver.mjs` waits for the sidebar's search input
  (`input[placeholder*="Search ticket"]`) to appear rather than sleeping a
  fixed amount — do the same in any script you add.
- **The frontend has no semantic CSS classes — it's Tailwind utility
  classes only** (no more `.card`, `.wf-btn`, `.login-card`, etc.). Selecting
  on class names will break the moment someone tweaks spacing/color.
  `driver.mjs` deliberately selects on text content, tags, and attributes
  (`button:has-text("Pick Up")`, `input[placeholder*=...]`, `form`) — follow
  that pattern in anything new.
- **There is no AI analysis anymore.** It was fully removed (backend
  `src/ai/` is gone, `bucket`/`context`/`techNote`/`rec` fields no longer
  exist) — the app is a plain Zoho-status-driven queue now: one flat ticket
  list, no priority groups, no AI-written summaries. Don't expect
  `techNote`/`context` fields or colored urgency badges anywhere; a ticket's
  only classification is its literal Zoho `status`.
- **Sidebar nav labels have already changed once** — "Team Overview" became
  "Team" and a "My Work" tab was added, which silently broke this driver
  until it was updated to match. Nav-tab clicks are scoped to `nav
  >> button:has-text(...)` rather than a bare page-wide text match, because
  the Activity Feed panel elsewhere on the page can contain the same words
  ("... Resolved on #262140") and cause a strict-mode multi-match once it
  has entries. If tab labels change again, update `driver.mjs` and this
  table together.
- **The ticket board can be empty.** `backend/src/poller.js` currently
  scopes fetches to Zoho tickets with `status === "Pending Technical Team"`
  only — if none exist right now, `driver.mjs`'s pick-up step logs "no
  unassigned ticket available to pick" and skips it rather than failing.

## Troubleshooting

- **`Error: listen EADDRINUSE: address already in use :::4001`**: a prior
  backend instance is still running. `netstat -ano | grep ':4001' | grep
  LISTENING`, then `powershell -Command "Stop-Process -Id <pid> -Force"`,
  then relaunch.
- **Login fails with `Invalid username or password`**: either the test
  account wasn't created (`node test-user.mjs create`) or the real `users`
  collection was never seeded — run `cd backend && node
  scripts/migrate-users-to-mongo.js` once.
- **`driver.mjs` hangs on `page.goto`**: the frontend dev server isn't up
  yet, or isn't on port 5180. Confirm with `curl -sf http://localhost:5180`
  before running the driver.
- **Playwright complains a browser isn't installed**: run `npx playwright
  install chromium` again from inside
  `.claude/skills/run-zoho-tech-dashboard/` — it's a separate download from
  the `npm install` step.
