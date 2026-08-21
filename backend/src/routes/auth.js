const express = require("express");
const bcrypt = require("bcryptjs");
const usersStore = require("../auth/usersStore");
const { sign } = require("../auth/jwt");

function authRouter() {
  const router = express.Router();

  router.post("/login", async (req, res) => {
    const { username, password } = req.body || {};
    const user = await usersStore.findByUsername(username);
    if (!user || !bcrypt.compareSync(password || "", user.passwordHash)) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    res.json({ token: sign(user), name: user.name, username: user.username });
  });

  return router;
}

module.exports = authRouter;
