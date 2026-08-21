import { useEffect, useMemo, useRef, useState } from "react";
import { MessageIcon, PaperclipIcon, SpinnerIcon } from "./Icons.jsx";

const MAX_FILES = 3;
const MAX_FILE_SIZE = 2 * 1024 * 1024;

function formatSize(size) {
  if (size > 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  if (size > 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${size} B`;
}

function fileToAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, dataUrl: reader.result });
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function renderMentions(text) {
  const parts = String(text || "").split(/(@[\w.+-]+(?:@[\w.-]+\.[A-Za-z]{2,})?)/g);
  return parts.map((part, index) =>
    part.startsWith("@") ? (
      <span key={`${part}-${index}`} className="rounded bg-cyan-50 px-1 font-semibold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

function Attachments({ attachments }) {
  if (!attachments?.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {attachments.map((file) => (
        <a
          key={file.id || file.name}
          href={file.dataUrl}
          download={file.name}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:text-cyan-700 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/10 dark:hover:text-cyan-300"
        >
          <PaperclipIcon width={12} height={12} />
          <span className="max-w-[12rem] truncate">{file.name}</span>
          <span className="font-mono text-[10px] text-zinc-400">{formatSize(file.size || 0)}</span>
        </a>
      ))}
    </div>
  );
}

function CommentForm({ placeholder, buttonLabel, onSubmit, autoFocus, focusSignal, initialBody = "", onCancel, allowAttachments = true }) {
  const [body, setBody] = useState(initialBody);
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!autoFocus && !focusSignal) return;
    textareaRef.current?.focus();
  }, [autoFocus, focusSignal]);

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    setError(null);
    const nextFiles = [...attachments];
    for (const file of files) {
      if (nextFiles.length >= MAX_FILES) {
        setError(`Attach up to ${MAX_FILES} files`);
        break;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name} is larger than 2 MB`);
        continue;
      }
      try {
        nextFiles.push(await fileToAttachment(file));
      } catch (err) {
        setError(err.message);
      }
    }
    setAttachments(nextFiles);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const text = body.trim();
    if ((!text && attachments.length === 0) || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(text, attachments);
      setBody("");
      setAttachments([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={2}
        maxLength={2000}
        autoFocus={autoFocus}
        className="field min-h-[4.5rem] resize-y leading-6"
      />

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <span key={`${file.name}-${index}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200 dark:bg-neutral-950 dark:text-zinc-300 dark:ring-white/10">
              <PaperclipIcon width={12} height={12} />
              <span className="max-w-[10rem] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                className="text-rose-500 hover:text-rose-400"
                aria-label={`Remove ${file.name}`}
              >
                Remove
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {allowAttachments && (
            <label className="ghost-button cursor-pointer px-3 py-1.5 text-xs">
              <PaperclipIcon width={12} height={12} /> Attach
              <input type="file" multiple className="hidden" onChange={handleFiles} />
            </label>
          )}
          {error && <span className="text-xs text-rose-600 dark:text-rose-300">{error}</span>}
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="ghost-button px-3 py-1.5 text-xs">
              Cancel
            </button>
          )}
          <button type="submit" disabled={submitting || (!body.trim() && attachments.length === 0)} className="primary-button px-3 py-1.5 text-xs">
            {submitting && <SpinnerIcon width={12} height={12} />}
            {submitting ? "Saving..." : buttonLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

function CommentMessage({ ticketId, comment, currentUser, onEditComment, onDeleteComment }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const deleted = Boolean(comment.deletedAt);
  const isMine = !deleted && comment.by === currentUser.username;
  const canEdit = isMine && Boolean(comment.body);
  const author = deleted ? "Deleted comment" : comment.by === currentUser.username ? "You" : comment.byName || comment.by;

  async function handleDelete() {
    if (deleting) return;
    const confirmed = window.confirm("Delete this comment?");
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    try {
      await onDeleteComment(ticketId, comment.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <CommentForm
        placeholder="Edit comment"
        buttonLabel="Save"
        initialBody={comment.body}
        autoFocus
        allowAttachments={false}
        onCancel={() => setEditing(false)}
        onSubmit={async (body) => {
          await onEditComment(ticketId, comment.id, body);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-zinc-950 dark:text-white">{author}</span>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <span className="font-mono text-zinc-500 dark:text-zinc-400">{new Date(comment.at).toLocaleString("en-GB")}</span>
        {comment.editedAt && !deleted && <span className="text-zinc-400 dark:text-zinc-500">edited</span>}
      </div>
      <p className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${deleted ? "italic text-zinc-400 dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-300"}`}>
        {deleted ? "This comment was deleted." : renderMentions(comment.body)}
      </p>
      {!deleted && <Attachments attachments={comment.attachments} />}
      {isMine && (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs font-semibold text-cyan-700 hover:text-cyan-600 dark:text-cyan-300 dark:hover:text-cyan-200"
            >
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs font-semibold text-rose-600 hover:text-rose-500 disabled:opacity-50 dark:text-rose-300 dark:hover:text-rose-200"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
          {error && <span className="text-xs text-rose-600 dark:text-rose-300">{error}</span>}
        </div>
      )}
    </>
  );
}

function CommentItem({ ticketId, comment, replies, currentUser, onReply, onEditComment, onDeleteComment }) {
  const [replying, setReplying] = useState(false);
  const author = comment.deletedAt ? "comment" : comment.by === currentUser.username ? "you" : comment.byName || comment.by;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-neutral-950">
      <CommentMessage
        ticketId={ticketId}
        comment={comment}
        currentUser={currentUser}
        onEditComment={onEditComment}
        onDeleteComment={onDeleteComment}
      />

      {!comment.deletedAt && (
        <button
          type="button"
          onClick={() => setReplying((value) => !value)}
          className="mt-2 text-xs font-semibold text-cyan-700 hover:text-cyan-600 dark:text-cyan-300 dark:hover:text-cyan-200"
        >
          {replying ? "Cancel reply" : "Reply"}
        </button>
      )}

      {replying && (
        <div className="mt-3">
          <CommentForm
            placeholder={`Reply to ${author} with @name to mention`}
            buttonLabel="Post Reply"
            autoFocus
            onSubmit={async (body, attachments) => {
              await onReply(comment.id, body, attachments);
              setReplying(false);
            }}
          />
        </div>
      )}

      {replies.length > 0 && (
        <div className="mt-3 flex flex-col gap-2 border-l-2 border-cyan-200 pl-3 dark:border-cyan-500/30">
          {replies.map((reply) => (
            <div key={reply.id} className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-white/5">
              <CommentMessage
                ticketId={ticketId}
                comment={reply}
                currentUser={currentUser}
                onEditComment={onEditComment}
                onDeleteComment={onDeleteComment}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TicketComments({
  ticket,
  currentUser,
  onAddComment,
  onEditComment,
  onDeleteComment,
  allowComposer = true,
  autoFocusComment = false,
  focusSignal = 0,
}) {
  const comments = ticket.comments || [];
  const canComment = Boolean(currentUser && allowComposer);

  const { roots, repliesByParent } = useMemo(() => {
    const sorted = [...comments].sort((a, b) => new Date(a.at) - new Date(b.at));
    const byParent = new Map();
    const topLevel = [];

    for (const comment of sorted) {
      if (comment.parentId) {
        byParent.set(comment.parentId, [...(byParent.get(comment.parentId) || []), comment]);
      } else {
        topLevel.push(comment);
      }
    }

    return { roots: topLevel, repliesByParent: byParent };
  }, [comments]);

  if (!canComment && comments.length === 0) return null;

  return (
    <section className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
          <MessageIcon width={15} height={15} /> Internal Comments
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 font-mono text-xs font-semibold text-zinc-500 ring-1 ring-zinc-200 dark:bg-neutral-950 dark:text-zinc-300 dark:ring-white/10">
          {comments.length}
        </span>
      </div>

      {roots.length > 0 && (
        <div className="mb-3 flex flex-col gap-2">
          {roots.map((comment) => (
            <CommentItem
              key={comment.id}
              ticketId={ticket.id}
              comment={comment}
              replies={repliesByParent.get(comment.id) || []}
              currentUser={currentUser}
              onReply={(parentId, body, attachments) => onAddComment(ticket.id, body, parentId, attachments)}
              onEditComment={onEditComment}
              onDeleteComment={onDeleteComment}
            />
          ))}
        </div>
      )}

      {canComment ? (
        <CommentForm
          placeholder="Add an internal comment. Use @name to mention someone."
          buttonLabel="Post Comment"
          autoFocus={autoFocusComment}
          focusSignal={focusSignal}
          onSubmit={(body, attachments) => onAddComment(ticket.id, body, null, attachments)}
        />
      ) : (
        comments.length > 0 && <div className="text-sm text-zinc-500 dark:text-zinc-400">Open Details to add another comment.</div>
      )}
    </section>
  );
}
