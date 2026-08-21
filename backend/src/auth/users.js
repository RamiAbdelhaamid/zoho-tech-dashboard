// Seed data for the "users" collection in MongoDB Atlas — the live source of
// truth for login is now the database (see src/auth/usersStore.js), not this
// file. To add or change an account: generate a bcrypt hash with
//   node src/auth/hash-password.js "the-password"
// paste it below, then re-run scripts/migrate-users-to-mongo.js to push the
// change to Atlas. Never commit real passwords in plaintext.
module.exports = [
  {
    username: "osama.dawood@azm.com",
    name: "Osama Dawood",
    passwordHash: "$2a$10$Gg9Cg9w073sLoAUr78FA3e5Q13WKdeEWWU4twpTkGCBiP24gxhOqi",
  },
  {
    username: "shehryar.ahmed@azm.com",
    name: "Shehryar Ahmed",
    passwordHash: "$2a$10$Gg9Cg9w073sLoAUr78FA3e5Q13WKdeEWWU4twpTkGCBiP24gxhOqi",
  },
  {
    username: "G.AlHendi@azm.com",
    name: "G. AlHendi",
    passwordHash: "$2a$10$Gg9Cg9w073sLoAUr78FA3e5Q13WKdeEWWU4twpTkGCBiP24gxhOqi",
  },
  {
    username: "Rami.Abdelhamid@azm.com",
    name: "Rami Abdelhamid",
    passwordHash: "$2a$10$Gg9Cg9w073sLoAUr78FA3e5Q13WKdeEWWU4twpTkGCBiP24gxhOqi",
  },
];
