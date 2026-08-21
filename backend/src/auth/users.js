// Seed TEMPLATE for the "users" collection in MongoDB Atlas — the live
// source of truth for login is the database (see src/auth/usersStore.js),
// not this file. This file is only ever needed for the one-time seed via
// scripts/migrate-users-to-mongo.js; once accounts exist in Atlas, changing
// or adding one is just as easily done directly against the "users"
// collection.
//
// Real names/emails/hashes intentionally do NOT live here — this file is
// committed to the repo, and team-member accounts are internal data that
// shouldn't be published. To seed your own team:
//   1. Generate a hash: node src/auth/hash-password.js "the-password"
//   2. Replace the placeholder entry below locally (don't commit real data)
//   3. node scripts/migrate-users-to-mongo.js
module.exports = [
  {
    username: "tech.name@example.com",
    name: "Tech Name",
    passwordHash: "$2a$10$replace.with.a.real.bcrypt.hash.generated.locally",
  },
];
