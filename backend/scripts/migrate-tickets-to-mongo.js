// One-time migration: import the existing data/tickets.json snapshot into
// MongoDB Atlas. Run with: node scripts/migrate-tickets-to-mongo.js
const fs = require("fs");
const path = require("path");
const { getDb } = require("../src/db");

const FILE = path.join(__dirname, "..", "data", "tickets.json");

async function main() {
  if (!fs.existsSync(FILE)) {
    console.log("[migrate] no data/tickets.json found — nothing to migrate");
    return;
  }
  const all = JSON.parse(fs.readFileSync(FILE, "utf8"));
  const ids = Object.keys(all);
  if (ids.length === 0) {
    console.log("[migrate] data/tickets.json is empty — nothing to migrate");
    return;
  }

  const db = await getDb();
  const col = db.collection("tickets");

  const ops = ids.map((id) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: all[id] },
      upsert: true,
    },
  }));

  const result = await col.bulkWrite(ops);
  console.log(
    `[migrate] upserted ${result.upsertedCount} new, matched ${result.matchedCount} existing (${ids.length} total tickets)`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("[migrate] failed:", err.message);
  process.exit(1);
});
