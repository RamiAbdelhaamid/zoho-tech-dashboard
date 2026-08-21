# Technical Team Dashboard — Azm Digital

An internal ticket-triage console for Azm Digital's technical team: a Node
backend polls Zoho Desk for tickets sitting in **Pending Technical Team**
status, keeps them in MongoDB Atlas, and pushes live updates to a React
dashboard over Socket.io. Techs pick up tickets, work them through to
resolved, leave internal comments, and see the original Zoho email threads —
all without ever touching Zoho Desk directly.

**Nothing here sends anything to Zoho.** It only reads tickets and threads;
picking up a ticket, changing its status, and commenting are all tracked in
this app's own database, not written back to Zoho Desk.

## How it works

```
Zoho Desk  <--REST-->  backend (Express + poller)  <--Socket.io/REST-->  React dashboard (live)
                              |
                          MongoDB Atlas
                     (tickets, users, history, comments)
```

- `backend/src/poller.js` runs on an interval (`POLL_INTERVAL_MS`) and
  refreshes tickets from Zoho — raw fields only (status, thread count,
  etc.), nothing AI-driven. It's scoped to tickets with
  `status === "Pending Technical Team"` in the departments listed in
  `ZOHO_DEPARTMENT_IDS`.
- Zoho API calls retry transient failures (network errors, 5xx, 429) with
  backoff, and back off an OAuth token refresh for 30s after a failure so a
  sustained outage doesn't get the client rate-limited by Zoho itself. A
  failing poll surfaces as a banner in the sidebar instead of failing
  silently.
- Every ticket, status change, and comment lives in MongoDB Atlas — shared
  live across every device/login via Socket.io, not per-browser state.
- Team-member accounts are seeded into MongoDB from `backend/src/auth/users.js`
  (bcrypt-hashed passwords) via `backend/scripts/migrate-users-to-mongo.js`;
  MongoDB is the live source of truth for login after that.

## Features

- **Tickets** — flat, live-updating list of everything pending the technical
  team, searchable by ticket number or requester.
- **My Work** — tickets you've picked up, grouped by Picked Up / In Progress
  / Resolved.
- **Team** — per-technician workload breakdown (active/picked/working/resolved
  counts) for the whole team.
- **Resolved** — a searchable/filterable archive (assignee, date range) of
  everything closed out, with full audit history per ticket.
- **Ticket workflow** — Pick Up → Start Working → Resolved, or Release back
  to the queue; every transition is recorded with who/when.
- **Internal comments** — threaded, with @mentions and small file
  attachments — visible only inside this dashboard, never sent to Zoho.
- **Ticket detail drawer** — the original Zoho email thread (HTML safely
  parsed to clean readable text, with a preview/expand toggle for very long
  messages), plus the ticket's full comment and status history.
- **Copy Link / Open in Zoho** — copies a real clickable hyperlink (not
  Markdown syntax) to the ticket, or opens it directly in Zoho Desk.
- **Activity Feed** — a live feed of recent history and comments across the
  whole team.

## 1. Zoho Desk OAuth setup

You need a **Server-based Application** (or Self Client) in the
[Zoho API Console](https://api-console.zoho.com/) with the Desk scope, and a
refresh token — the backend mints its own short-lived access tokens from it,
so nobody has to log into Zoho interactively.

1. Go to the API Console → *Add Client* → *Server-based Applications*.
2. Set an authorized redirect URI (e.g. `https://localhost/callback` — you
   only need it once for the manual step below).
3. Note the **Client ID** and **Client Secret**.
4. Build an authorization URL and open it in a browser you're logged into
   Zoho Desk with:
   ```
   https://accounts.zoho.sa/oauth/v2/auth?scope=Desk.tickets.ALL,Desk.basic.ALL&client_id=YOUR_CLIENT_ID&response_type=code&access_type=offline&redirect_uri=YOUR_REDIRECT_URI
   ```
   (swap `.sa` for your Zoho data center's domain.)
5. After approving, Zoho redirects to your redirect URI with a `code=...`
   query param. Exchange it once for a refresh token:
   ```
   curl -X POST https://accounts.zoho.sa/oauth/v2/token \
     -d "grant_type=authorization_code" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "redirect_uri=YOUR_REDIRECT_URI" \
     -d "code=THE_CODE_FROM_STEP_4"
   ```
   The response includes `refresh_token` — put that, the client ID, and the
   client secret into `backend/.env`.
6. Find your department IDs (visible in each department's Zoho Desk URL, or
   via `GET /api/v1/departments`) and set `ZOHO_DEPARTMENT_IDS`.

## 2. Set up MongoDB Atlas

Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com),
grab its connection string, and put it in `backend/.env` as `MONGODB_URI`.

## 3. Configure environment variables

```bash
cd backend
cp .env.example .env
# fill in MONGODB_URI, ZOHO_*, and generate a JWT_SECRET

cd ../frontend
cp .env.example .env
# defaults to http://localhost:4001, only change if you deploy the backend elsewhere
```

## 4. Seed team accounts

Edit `backend/src/auth/users.js` with your team's usernames/names, generating
each password hash with:

```bash
cd backend
node src/auth/hash-password.js "the-password"
```

Then push the seed list into MongoDB:

```bash
node scripts/migrate-users-to-mongo.js
```

## 5. Run it

```bash
# terminal 1
cd backend
npm install
npm run dev        # nodemon, restarts on file changes
# or: npm start

# terminal 2
cd frontend
npm install
npm run dev         # opens on http://localhost:5180
```

Open http://localhost:5180, sign in with one of the seeded accounts, and the
board loads and updates live as the backend polls Zoho Desk. Use "Refresh
Now" to force an immediate poll instead of waiting for the interval.

## 6. Deploying

- The backend needs to run continuously (it's the thing polling Zoho Desk),
  so host it somewhere long-running: a small VPS, Railway, Render, Fly.io,
  etc.
- Build the frontend with `npm run build` in `frontend/` and serve the
  static `dist/` folder from any static host (Vercel, Netlify, S3+CloudFront,
  or the Express backend itself via `express.static`).
- Set `CORS_ORIGIN` in the backend `.env` to your deployed frontend's URL,
  and `VITE_API_URL` in the frontend `.env` to your deployed backend's URL
  before building.

## Project layout

```
backend/   Express + Socket.io API, Zoho poller, MongoDB access
frontend/  Vite + React + Tailwind dashboard
.claude/skills/run-zoho-tech-dashboard/   Playwright driver used to smoke-test the app
```
