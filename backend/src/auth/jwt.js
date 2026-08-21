const jwt = require("jsonwebtoken");
const config = require("../config");

function sign(user) {
  return jwt.sign(
    { username: user.username, name: user.name },
    config.auth.jwtSecret,
    { expiresIn: "12h" }
  );
}

function verify(token) {
  return jwt.verify(token, config.auth.jwtSecret);
}

module.exports = { sign, verify };
