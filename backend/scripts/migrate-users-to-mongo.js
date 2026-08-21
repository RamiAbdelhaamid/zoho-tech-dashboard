// One-time migration: import the hardcoded accounts from src/auth/users.js
// into MongoDB Atlas. Run with: node scripts/migrate-users-to-mongo.js
const users = require("../src/auth/users");
const { getDb } = require("../src/db");

async function main() {
  if (users.length === 0) {
    console.log("[migrate] src/auth/users.js is empty — nothing to migrate");
    return;
  }

  const db = await getDb();
  const col = db.collection("users");

  const ops = users.map((u) => ({
    updateOne: {
      filter: { _id: u.username },
      update: { $set: { username: u.username, name: u.name, passwordHash: u.passwordHash } },
      upsert: true,
    },
  }));

  const result = await col.bulkWrite(ops);
  console.log(
    `[migrate] upserted ${result.upsertedCount} new, matched ${result.matchedCount} existing (${users.length} total accounts)`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("[migrate] failed:", err.message);
  process.exit(1);
});
