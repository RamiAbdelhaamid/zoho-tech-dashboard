// Create or delete a throwaway login account directly in MongoDB Atlas.
// There is no self-serve signup — backend/src/auth/users.js is only a seed
// list migrated once via backend/scripts/migrate-users-to-mongo.js — so
// driving a real login requires an account, and inserting/removing one
// directly in the "users" collection is the fastest way to get one without
// touching real team-member data.
//
// Usage (run from anywhere, paths are relative to this file):
//   node test-user.mjs create   # upserts test.driver@azm.com / DriverPass123!
//   node test-user.mjs delete   # removes it again

import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", "..", "backend", ".env") });

const USERNAME = "test.driver@azm.com";
const PASSWORD = "DriverPass123!";
const NAME = "Test Driver";

async function main() {
  const action = process.argv[2];
  if (!["create", "delete"].includes(action)) {
    console.error("Usage: node test-user.mjs <create|delete>");
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "zoho_tech_dashboard";
  if (!uri) throw new Error("MONGODB_URI not found — is backend/.env configured?");

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  if (action === "create") {
    await db.collection("users").updateOne(
      { _id: USERNAME },
      { $set: { username: USERNAME, name: NAME, passwordHash: bcrypt.hashSync(PASSWORD, 10) } },
      { upsert: true }
    );
    console.log(`created: ${USERNAME} / ${PASSWORD}`);
  } else {
    // Also release any ticket this test account picked up, so a driver run
    // that picks/resolves a ticket doesn't strand it assigned to a deleted
    // login.
    await db.collection("tickets").updateMany(
      { assigneeUsername: USERNAME },
      { $set: { workStatus: "new", assignee: null, assigneeUsername: null, pickedAt: null, resolvedAt: null } }
    );
    const result = await db.collection("users").deleteOne({ _id: USERNAME });
    console.log(`deleted: ${result.deletedCount}`);
  }

  await client.close();
}

main().catch((err) => {
  console.error("test-user.mjs failed:", err.message);
  process.exit(1);
});
