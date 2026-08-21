const axios = require("axios");
const config = require("../config");

// In-memory access-token cache. Zoho access tokens are short-lived (~1h),
// so we refresh proactively a little before they actually expire.
let cachedToken = null; // { accessToken, expiresAt }

// If a token refresh just failed, don't immediately hammer the OAuth
// endpoint again on the next call — with polling every few seconds and
// several Zoho requests per poll (ticket list + one per changed ticket's
// threads), a sustained auth failure can otherwise fire dozens of token
// requests a minute and get the client rate-limited by Zoho itself
// ("You have made too many requests continuously"), which only makes the
// outage last longer.
let authCooldownUntil = 0;
const AUTH_COOLDOWN_MS = 30_000;

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.accessToken;
  }

  if (Date.now() < authCooldownUntil) {
    const waitSec = Math.ceil((authCooldownUntil - Date.now()) / 1000);
    throw new Error(`Zoho auth is cooling down after a recent failure — retrying in ~${waitSec}s`);
  }

  const { clientId, clientSecret, refreshToken, accountsBase } = config.zoho;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Zoho OAuth is not configured — set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET and ZOHO_REFRESH_TOKEN in .env"
    );
  }

  try {
    const resp = await axios.post(
      `${accountsBase}/oauth/v2/token`,
      null,
      {
        params: {
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
        },
      }
    );

    const { access_token, expires_in } = resp.data;
    if (!access_token) {
      throw new Error(
        `Zoho token refresh failed: ${JSON.stringify(resp.data)}`
      );
    }

    cachedToken = {
      accessToken: access_token,
      expiresAt: Date.now() + (expires_in || 3600) * 1000,
    };
    authCooldownUntil = 0;
    return cachedToken.accessToken;
  } catch (err) {
    authCooldownUntil = Date.now() + AUTH_COOLDOWN_MS;
    throw err;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries transient failures (network errors, 5xx, 429) with exponential
 * backoff + jitter. Doesn't retry 4xx auth/validation errors — those need a
 * human, not a retry.
 */
async function withRetry(fn, { attempts = 3, baseDelayMs = 500 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err.response?.status;
      const retriable = !status || status >= 500 || status === 429;
      if (!retriable || i === attempts - 1) throw err;
      await sleep(baseDelayMs * 2 ** i + Math.random() * 200);
    }
  }
  throw lastErr;
}

async function zohoGet(path, params = {}) {
  return withRetry(async () => {
    const token = await getAccessToken();
    const resp = await axios.get(`${config.zoho.apiBase}${path}`, {
      params,
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        orgId: config.zoho.orgId,
      },
    });
    return resp.data;
  });
}

/**
 * Fetch the most recently created tickets across the whole helpdesk.
 * The Desk API's departmentId/departmentIds filter is unreliable in
 * practice, so we scan a window of recent tickets and filter client-side
 * in poller.js against config.zoho.departmentIds instead.
 */
async function getRecentTickets({ limit = 100, from = 0 } = {}) {
  const data = await zohoGet("/tickets", {
    sortBy: "-createdTime",
    limit,
    from,
  });
  return data?.data || [];
}

/**
 * Fetch the latest threads (messages) for a ticket, newest first.
 */
async function getThreads(ticketId, { limit = 5, from = 0 } = {}) {
  const data = await zohoGet(`/tickets/${ticketId}/threads`, {
    limit,
    from,
    sortBy: "-sendDateTime",
  });
  return data?.data || [];
}

async function getThread(ticketId, threadId) {
  return zohoGet(`/tickets/${ticketId}/threads/${threadId}`);
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = [];
  for (let i = 0; i < items.length; i += limit) {
    const chunk = items.slice(i, i + limit);
    results.push(...(await Promise.all(chunk.map(mapper))));
  }
  return results;
}

async function getAllThreads(ticketId, { pageSize = 100, max = 500, includeContent = false } = {}) {
  const all = [];
  for (let from = 0; from < max; from += pageSize) {
    const page = await getThreads(ticketId, { limit: pageSize, from });
    all.push(...page);
    if (page.length < pageSize) break;
  }

  if (!includeContent) return all;

  return mapWithConcurrency(all, 5, async (thread) => {
    if (!thread.id) return thread;
    try {
      const detail = await getThread(ticketId, thread.id);
      return { ...thread, ...detail };
    } catch {
      return thread;
    }
  });
}

function ticketUrl(ticketId) {
  return `${config.zoho.portalUrl}/all/tickets/details/${ticketId}`;
}

module.exports = { getAccessToken, getRecentTickets, getThreads, getThread, getAllThreads, ticketUrl };
