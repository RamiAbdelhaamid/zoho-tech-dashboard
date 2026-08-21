// Usage: node src/auth/hash-password.js "the-password"
// Prints a bcrypt hash to paste into src/auth/users.js.
const bcrypt = require("bcryptjs");

const password = process.argv[2];
if (!password) {
  console.error('Usage: node src/auth/hash-password.js "the-password"');
  process.exit(1);
}
console.log(bcrypt.hashSync(password, 10));
