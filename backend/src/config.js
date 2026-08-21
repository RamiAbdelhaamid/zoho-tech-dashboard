require("dotenv").config();

function csv(name, fallback = "") {
  const raw = process.env[name] ?? fallback;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function int(name, fallback) {
  const raw = process.env[name];
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

const config = {
  port: int("PORT", 4001),
  corsOrigins: csv("CORS_ORIGIN", "http://localhost:5173"),

  auth: {
    jwtSecret: process.env.JWT_SECRET || "",
  },

  mongo: {
    uri: process.env.MONGODB_URI || "",
    dbName: process.env.MONGODB_DB || "zoho_tech_dashboard",
  },

  zoho: {
    clientId: process.env.ZOHO_CLIENT_ID || "",
    clientSecret: process.env.ZOHO_CLIENT_SECRET || "",
    refreshToken: process.env.ZOHO_REFRESH_TOKEN || "",
    accountsBase: process.env.ZOHO_ACCOUNTS_BASE || "https://accounts.zoho.com",
    apiBase: process.env.ZOHO_API_BASE || "https://desk.zoho.com/api/v1",
    orgId: process.env.ZOHO_ORG_ID || "",
    portalUrl: process.env.ZOHO_PORTAL_URL || "",
    departmentIds: csv("ZOHO_DEPARTMENT_IDS"),
  },

  poll: {
    intervalMs: int("POLL_INTERVAL_MS", 180000),
    scanLimit: int("TICKETS_SCAN_LIMIT", 150),
    recentWaitingDays: int("RECENT_WAITING_DAYS", 5),
  },
};

module.exports = config;
