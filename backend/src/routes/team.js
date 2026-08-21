const express = require("express");
const usersStore = require("../auth/usersStore");
const requireAuth = require("../auth/requireAuth");

function teamRouter() {
  const router = express.Router();

  router.use(requireAuth);

  // Just the roster (username + display name) — ticket/workload stats are
  // computed client-side from the same /api/tickets payload the dashboard
  // already has, so this stays live via the existing Socket.io updates
  // instead of needing its own polling.
  router.get("/team-members", async (req, res) => {
    const users = await usersStore.listAll();
    res.json({ team: users.map((u) => ({ username: u.username, name: u.name })) });
  });

  return router;
}

module.exports = teamRouter;
