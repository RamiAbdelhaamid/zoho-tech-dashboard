const { getDb } = require("../db");

// Technical-team accounts, backed by MongoDB Atlas (migrated from the old
// hardcoded src/auth/users.js — see scripts/migrate-users-to-mongo.js).
const COLLECTION = "users";

async function collection() {
  const db = await getDb();
  return db.collection(COLLECTION);
}

async function findByUsername(username) {
  const col = await collection();
  return col.findOne({ _id: username });
}

async function listAll() {
  const col = await collection();
  return col.find({}).toArray();
}

module.exports = { findByUsername, listAll };
