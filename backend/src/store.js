const { getDb } = require("./db");

// Ticket store backed by MongoDB Atlas. One document per ticket, keyed by
// Zoho ticket id (as _id), shared live across every client hitting this
// backend.
const COLLECTION = "tickets";

async function collection() {
  const db = await getDb();
  return db.collection(COLLECTION);
}

function fromDoc(doc) {
  const { _id, ...rest } = doc;
  return rest;
}

async function loadAll() {
  const col = await collection();
  const docs = await col.find({}).toArray();
  const map = {};
  for (const doc of docs) {
    map[doc._id] = fromDoc(doc);
  }
  return map;
}

async function upsert(ticketId, data) {
  const col = await collection();
  await col.updateOne({ _id: ticketId }, { $set: data }, { upsert: true });
}

/**
 * Upsert many tickets in a single round-trip to Atlas. The poller updates
 * dozens of tickets per run — awaiting store.upsert() one at a time in a
 * loop turns that into dozens of sequential network round-trips, which is
 * what actually made a 30s auto-poll interval infeasible (not the AI calls).
 */
async function bulkUpsert(entries) {
  if (!entries.length) return;
  const col = await collection();
  const ops = entries.map(({ id, data }) => ({
    updateOne: { filter: { _id: id }, update: { $set: data }, upsert: true },
  }));
  await col.bulkWrite(ops, { ordered: false });
}

/** Appends one entry to a ticket's audit trail without touching its other fields. */
async function appendHistory(ticketId, entry) {
  const col = await collection();
  await col.updateOne({ _id: ticketId }, { $push: { history: entry } });
}

/** Appends one internal comment to a ticket without touching its other fields. */
async function appendComment(ticketId, entry) {
  const col = await collection();
  await col.updateOne({ _id: ticketId }, { $push: { comments: entry } });
}

/** Replaces the internal comment list after ownership validation in the route. */
async function setComments(ticketId, comments) {
  const col = await collection();
  await col.updateOne({ _id: ticketId }, { $set: { comments } });
}

async function remove(ticketId) {
  const col = await collection();
  await col.deleteOne({ _id: ticketId });
}

async function replaceAllKeys(nextIds) {
  // Drop stored tickets that are no longer active (closed, moved out of
  // scope, etc.) so the dashboard doesn't show stale entries forever.
  const col = await collection();
  await col.deleteMany({ _id: { $nin: nextIds } });
}

module.exports = { loadAll, upsert, bulkUpsert, appendHistory, appendComment, setComments, remove, replaceAllKeys };
