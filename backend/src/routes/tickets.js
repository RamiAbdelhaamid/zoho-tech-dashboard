const express = require("express");
const store = require("../store");
const { buildGroupedPayload } = require("../grouping");
const { pollOnce } = require("../poller");
const zoho = require("../zoho/zohoClient");
const pollerStatus = require("../pollerStatus");
const requireAuth = require("../auth/requireAuth");

const ALLOWED_STATUSES = ["new", "picked", "working", "resolved"];
const MAX_COMMENT_LENGTH = 2000;
const MAX_ATTACHMENTS = 3;
const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024;

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function cleanAttachments(input) {
  const attachments = Array.isArray(input) ? input : [];
  if (attachments.length > MAX_ATTACHMENTS) {
    const err = new Error(`Attach up to ${MAX_ATTACHMENTS} files per comment`);
    err.status = 400;
    throw err;
  }

  return attachments.map((file) => {
    const name = String(file?.name || "attachment").slice(0, 160);
    const type = String(file?.type || "application/octet-stream").slice(0, 120);
    const dataUrl = String(file?.dataUrl || "");
    const size = Number(file?.size || 0);

    if (!dataUrl.startsWith("data:")) {
      const err = new Error("Attachment data is invalid");
      err.status = 400;
      throw err;
    }
    if (!Number.isFinite(size) || size <= 0 || size > MAX_ATTACHMENT_SIZE) {
      const err = new Error("Each attachment must be 2 MB or smaller");
      err.status = 400;
      throw err;
    }

    return { id: makeId(), name, type, size, dataUrl };
  });
}

function ticketsRouter(io) {
  const router = express.Router();

  router.get("/health", (req, res) => res.json({ ok: true }));

  router.use(requireAuth);

  router.get("/tickets", async (req, res) => {
    res.json(pollerStatus.attach(buildGroupedPayload(await store.loadAll())));
  });

  router.get("/tickets/:id/threads", async (req, res) => {
    try {
      const threads = await zoho.getAllThreads(req.params.id, { includeContent: true });
      res.json({ threads });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Manual trigger — handy for testing or a "Refresh now" button in the UI.
  router.post("/refresh", async (req, res) => {
    try {
      const payload = await pollOnce(io);
      res.json(payload || pollerStatus.attach(buildGroupedPayload(await store.loadAll())));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Workflow: pick a ticket, move it through working/resolved, or release it.
  // "picked" assigns the ticket to the caller (only if unassigned or already
  // theirs); "working"/"resolved" require the caller to already be the
  // assignee; "new" releases the ticket (only the current assignee can).
  router.post("/tickets/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${ALLOWED_STATUSES.join(", ")}` });
    }

    const all = await store.loadAll();
    const ticket = all[id];
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const currentAssignee = ticket.assigneeUsername || null;
    const me = req.user.username;

    if (status === "picked") {
      if (currentAssignee && currentAssignee !== me) {
        return res.status(409).json({ error: `This ticket is already picked by ${ticket.assignee}` });
      }
      await store.upsert(id, {
        workStatus: "picked",
        assignee: req.user.name,
        assigneeUsername: me,
        pickedAt: new Date().toISOString(),
      });
    } else if (status === "new") {
      if (currentAssignee && currentAssignee !== me) {
        return res.status(403).json({ error: "You can't release a ticket picked by someone else" });
      }
      await store.upsert(id, {
        workStatus: "new",
        assignee: null,
        assigneeUsername: null,
        pickedAt: null,
        resolvedAt: null,
      });
    } else {
      if (currentAssignee !== me) {
        return res.status(403).json({ error: "You must pick this ticket first" });
      }
      await store.upsert(id, {
        workStatus: status,
        resolvedAt: status === "resolved" ? new Date().toISOString() : null,
      });
    }

    await store.appendHistory(id, {
      at: new Date().toISOString(),
      by: me,
      byName: req.user.name,
      action: status,
    });

    const payload = pollerStatus.attach(buildGroupedPayload(await store.loadAll()));
    if (io) io.emit("tickets:update", payload);
    res.json(payload);
  });

  // Internal collaboration comments. Any logged-in team member can comment or
  // reply, even before a ticket is picked up, so triage context can be captured
  // without taking ownership.
  router.post("/tickets/:id/comments", async (req, res) => {
    const { id } = req.params;
    const body = String(req.body?.body || "").trim();
    const parentId = req.body?.parentId ? String(req.body.parentId) : null;
    let attachments = [];

    try {
      attachments = cleanAttachments(req.body?.attachments);
    } catch (err) {
      return res.status(err.status || 400).json({ error: err.message });
    }

    if (!body && attachments.length === 0) return res.status(400).json({ error: "Comment or attachment is required" });
    if (body.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({ error: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer` });
    }

    const all = await store.loadAll();
    const ticket = all[id];
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const comments = ticket.comments || [];
    if (parentId && !comments.some((comment) => comment.id === parentId && !comment.deletedAt)) {
      return res.status(400).json({ error: "Parent comment not found" });
    }

    await store.appendComment(id, {
      id: makeId(),
      body,
      parentId,
      at: new Date().toISOString(),
      by: req.user.username,
      byName: req.user.name,
      attachments,
    });

    const payload = pollerStatus.attach(buildGroupedPayload(await store.loadAll()));
    if (io) io.emit("tickets:update", payload);
    res.json(payload);
  });

  router.patch("/tickets/:id/comments/:commentId", async (req, res) => {
    const { id, commentId } = req.params;
    const body = String(req.body?.body || "").trim();

    if (!body) return res.status(400).json({ error: "Comment is required" });
    if (body.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({ error: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer` });
    }

    const all = await store.loadAll();
    const ticket = all[id];
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const comments = ticket.comments || [];
    const index = comments.findIndex((comment) => comment.id === commentId);
    if (index === -1) return res.status(404).json({ error: "Comment not found" });

    const comment = comments[index];
    if (comment.deletedAt) return res.status(400).json({ error: "Deleted comments can't be edited" });
    if (comment.by !== req.user.username) {
      return res.status(403).json({ error: "You can only edit comments you added" });
    }

    const next = [...comments];
    next[index] = {
      ...comment,
      body,
      editedAt: new Date().toISOString(),
    };
    await store.setComments(id, next);

    const payload = pollerStatus.attach(buildGroupedPayload(await store.loadAll()));
    if (io) io.emit("tickets:update", payload);
    res.json(payload);
  });

  router.delete("/tickets/:id/comments/:commentId", async (req, res) => {
    const { id, commentId } = req.params;

    const all = await store.loadAll();
    const ticket = all[id];
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const comments = ticket.comments || [];
    const index = comments.findIndex((comment) => comment.id === commentId);
    if (index === -1) return res.status(404).json({ error: "Comment not found" });

    const comment = comments[index];
    if (comment.deletedAt) return res.status(400).json({ error: "Comment is already deleted" });
    if (comment.by !== req.user.username) {
      return res.status(403).json({ error: "You can only delete comments you added" });
    }

    const next = [...comments];
    next[index] = {
      ...comment,
      body: "",
      deletedAt: new Date().toISOString(),
      deletedBy: req.user.username,
      deletedByName: req.user.name,
    };
    await store.setComments(id, next);

    const payload = pollerStatus.attach(buildGroupedPayload(await store.loadAll()));
    if (io) io.emit("tickets:update", payload);
    res.json(payload);
  });

  return router;
}

module.exports = ticketsRouter;
