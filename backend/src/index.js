const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const config = require("./config");
const ticketsRouter = require("./routes/tickets");
const authRouter = require("./routes/auth");
const teamRouter = require("./routes/team");
const poller = require("./poller");
const { buildGroupedPayload } = require("./grouping");
const store = require("./store");
const pollerStatus = require("./pollerStatus");
const { getDb } = require("./db");
const { verify } = require("./auth/jwt");

const app = express();
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json({ limit: "8mb" }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: config.corsOrigins } });

io.use((socket, next) => {
  try {
    socket.user = verify(socket.handshake.auth?.token || "");
    next();
  } catch {
    next(new Error("unauthorized"));
  }
});

io.on("connection", (socket) => {
  // Send the current snapshot immediately so the UI doesn't wait for the
  // next poll tick to have something to show.
  store
    .loadAll()
    .then((all) => socket.emit("tickets:update", pollerStatus.attach(buildGroupedPayload(all))))
    .catch((err) => console.error("[socket] failed to load tickets:", err.message));
});

app.use("/api", authRouter());
app.use("/api", teamRouter());
app.use("/api", ticketsRouter(io));

getDb()
  .then(() => {
    console.log("[server] connected to MongoDB");
    server.listen(config.port, () => {
      console.log(`[server] listening on http://localhost:${config.port}`);
      console.log(
        `[server] watching departments: ${config.zoho.departmentIds.join(", ") || "(none configured)"}`
      );
      poller.start(io);
    });
  })
  .catch((err) => {
    console.error("[server] failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
