# Zoho Desk AI Dashboard (React + Node.js)

Live version of the "Suggested Replies" board: a Node backend polls Zoho Desk for
active tickets in your configured departments, sends new/changed ones to an AI
provider (Claude, OpenAI, or Gemini — your choice, switchable via one env var) for
classification and drafted replies, and pushes live updates to a React dashboard
over Socket.io.

**This is suggest-only.** Nothing in this project sends replies, posts comments, or
modifies tickets in Zoho Desk. It only reads tickets/threads and writes AI-drafted
suggestions to its own local store, exactly like the manual dashboard it replaces.

## How it works

```
Zoho Desk  <--REST-->  backend (Express + poller)  --AI API-->  Claude/OpenAI/Gemini
                              |
                        Socket.io + REST
                              |
                          React dashboard (live)
```

- `backend/src/poller.js` runs on an interval (`POLL_INTERVAL_MS`, default 3 min).
  Each run fetches recent tickets, keeps only the ones in your configured
  departments and not Closed, and skips re-analyzing tickets that haven't
  changed (same `status` + `threadCount` as last time) — that's what keeps AI
  costs down.
- Fresh "Waiting for Customer" tickets (created within `RECENT_WAITING_DAYS`) skip
  the AI call entirely and just get listed — same shortcut used in the manual
  triage process.
- Everything else gets its last few messages pulled and sent to the active AI
  provider, which returns a priority bucket (red/orange/yellow/green) plus
  Arabic+English customer reply drafts, a tech note, and a recommendation.
- Results are cached in `backend/data/tickets.json` (swap for a real database if
  you outgrow a single JSON file) and pushed to every connected browser via
  Socket.io the moment they change.

## 1. Zoho Desk OAuth setup

You need a **Server-based Application** (or Self Client) in the
[Zoho API Console](https://api-console.zoho.com/) with the Desk scope, and a
refresh token — the backend uses it to mint short-lived access tokens itself, so
nobody has to log in interactively.

1. Go to the API Console → *Add Client* → *Server-based Applications*.
2. Set an authorized redirect URI (e.g. `https://localhost/callback` — you only
   need it once for the manual step below).
3. Note the **Client ID** and **Client Secret**.
4. Build an authorization URL and open it in a browser you're logged into Zoho
   Desk with:
   ```
   https://accounts.zoho.sa/oauth/v2/auth?scope=Desk.tickets.ALL,Desk.basic.ALL&client_id=YOUR_CLIENT_ID&response_type=code&access_type=offline&redirect_uri=YOUR_REDIRECT_URI
   ```
   (swap `.sa` for your data center — see the comment in `.env.example`).
5. After approving, Zoho redirects to your redirect URI with a `code=...` query
   param. Exchange it once for a refresh token:
   ```
   curl -X POST https://accounts.zoho.sa/oauth/v2/token \
     -d "grant_type=authorization_code" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "redirect_uri=YOUR_REDIRECT_URI" \
     -d "code=THE_CODE_FROM_STEP_4"
   ```
   The response includes `refresh_token` — put that, the client ID and secret
   into `backend/.env`.
6. Find your department IDs (visible in each department's Zoho Desk URL, or via
   `GET /api/v1/departments`) and set `ZOHO_DEPARTMENT_IDS`.

## 2. Configure environment variables

```bash
cd backend
cp .env.example .env
# fill in ZOHO_* values from step 1, and the AI_* keys you plan to use

cd ../frontend
cp .env.example .env
# defaults to http://localhost:4000, only change if you deploy the backend elsewhere
```

## 3. Choose your AI provider

Set `AI_PROVIDER` in `backend/.env` to `claude`, `openai`, or `gemini` — only that
provider's API key is required. All three implementations live in
`backend/src/ai/providers/` behind the same `analyzeTicket(ticket, threads)`
interface (`backend/src/ai/index.js` picks one at runtime), so switching is a
one-line env change, no code edits needed. Double-check the model name env vars
against each provider's current docs before deploying — model slugs change over
time.

## 4. Run it

```bash
# terminal 1
cd backend
npm install
npm run dev        # nodemon, restarts on file changes
# or: npm start

# terminal 2
cd frontend
npm install
npm run dev         # opens on http://localhost:5173
```

Open http://localhost:5173 — you should see the board load, then update live as
the backend polls Zoho Desk and calls the AI provider. Use the "حدّث الآن" button
to force an immediate poll instead of waiting for the interval.

## 5. Deploying

- The backend needs to run continuously (it's the thing polling Zoho Desk), so
  host it somewhere long-running: a small VPS, Railway, Render, Fly.io, etc.
- Build the frontend with `npm run build` in `frontend/` and serve the static
  `dist/` folder from any static host (Vercel, Netlify, S3+CloudFront, or even
  the Express backend itself with `express.static`).
- Set `CORS_ORIGIN` in the backend `.env` to your deployed frontend's URL, and
  `VITE_API_URL` in the frontend `.env` to your deployed backend's URL before
  building.

## Cost & rate-limit notes

- Zoho Desk API has per-org rate limits — the default 3-minute poll interval and
  the "skip unchanged tickets" logic keep well within typical limits, but tune
  `POLL_INTERVAL_MS` and `TICKETS_SCAN_LIMIT` for your ticket volume.
- Every AI call costs tokens. The store-and-diff approach means a ticket is only
  re-analyzed when its `status` or `threadCount` actually changes, not on every
  poll — this is the main cost control. If you have very high ticket volume,
  consider raising `POLL_INTERVAL_MS` further.

## Extending

- **Real-time via webhooks instead of polling:** Zoho Desk supports outgoing
  webhooks/instant notifications. You could add an `/api/webhooks/zoho` endpoint
  that triggers `pollOnce()` (or a targeted single-ticket refresh) the moment
  Zoho notifies you of a change, instead of waiting for the next interval.
- **One-click send:** if you ever want to go beyond suggest-only, you'd add a
  `sendReply`/`createTicketComment` call to `zohoClient.js` and a confirm-before-send
  step in the UI — deliberately left out of this scaffold since you chose
  suggest-only.
- **Swap the JSON store for a real database** (Postgres/Mongo) once you need
  multiple backend instances or historical reporting.
