import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { apiUrl } from "../api/client";
import { tasksApi } from "../api/endpoints";
import type { Task, TaskStatus } from "../api/types";
import { OverdueBadge, PriorityBadge, RoleBadge, StatusBadge } from "../components/Badges";
import { EmptyState, ErrorMessage, Spinner } from "../components/Feedback";
import { TaskFormModal } from "../components/TaskFormModal";
import { STATUS_LABELS } from "../constants";
import { useAuth } from "../context/AuthContext";
import { useFetch } from "../hooks/useFetch";
import { useStatusChange } from "../hooks/useStatusChange";
import { formatDateTime, formatFileSize } from "../utils/format";

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{children}</dd>
    </div>
  );
}

export function TaskDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();

  // Three independent requests: the task, its comments and its activity history.
  const task = useFetch(() => tasksApi.get(id), [id]);
  const comments = useFetch(() => tasksApi.comments(id), [id]);
  const activity = useFetch(() => tasksApi.activity(id), [id]);

  const [editing, setEditing] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const reloadAll = () => {
    task.reload();
    comments.reload();
    activity.reload();
  };
  const statusChange = useStatusChange(reloadAll);

  async function submitComment(e: FormEvent) {
    e.preventDefault();
    setActionError(null);
    try {
      await tasksApi.addComment(id, commentText);
      setCommentText("");
      comments.reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not add the comment");
    }
  }

  async function uploadFile(file: File | undefined) {
    if (!file) return;
    setActionError(null);
    try {
      await tasksApi.attach(id, file);
      reloadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not upload the file");
    }
  }

  if (task.loading && !task.data) return <Spinner />;
  if (task.error || !task.data) return <ErrorMessage message={task.error ?? "Task not found"} />;
  const t: Task = task.data;

  /** Text for the status buttons. Employees see friendlier wording. */
  const buttonLabel = (to: TaskStatus): string => (user?.role === "EMPLOYEE" && to === "IN_REVIEW" ? "Submit for review" : `Move to ${STATUS_LABELS[to]}`);

  return (
    <div className="space-y-6">
      <Link to="/tasks" className="text-sm text-indigo-600 hover:underline">&larr; Back to tasks</Link>

      {t.isOverdue && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          This task is overdue. It was due {formatDateTime(t.dueDate)}.
        </div>
      )}

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{t.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={t.status} />
              <PriorityBadge priority={t.priority} />
              {t.isOverdue && <OverdueBadge />}
            </div>
          </div>
          {t.canEdit && (
            <button className="btn-secondary" onClick={() => setEditing(true)}>Edit task</button>
          )}
        </div>

        {t.allowedStatuses.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <span className="text-sm text-slate-500">Update status:</span>
            {t.allowedStatuses.map((to) => (
              <button
                key={to}
                className={to === "DONE" ? "btn-success" : "btn-secondary"}
                onClick={() => statusChange.requestChange(t, to)}
              >
                {buttonLabel(to)}
              </button>
            ))}
          </div>
        )}

        <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <Info label="Project">
            {user?.role === "EMPLOYEE" ? t.project.name : <Link className="text-indigo-700 hover:underline" to={`/projects/${t.project._id}`}>{t.project.name}</Link>}
          </Info>
          <Info label="Assignee">{t.assignee.name}</Info>
          <Info label="Created by">{t.createdBy.name}</Info>
          <Info label="Due">
            <span className={t.isOverdue ? "font-semibold text-red-700" : ""}>{formatDateTime(t.dueDate)}</span>
          </Info>
        </dl>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <h2 className="mb-1 text-sm font-semibold">Description</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{t.description || "No description."}</p>
        </div>
      </div>

      <ErrorMessage message={actionError} />

      <div className="card p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Attachments</h2>
          {t.canEdit && (
            <label className="btn-secondary cursor-pointer">
              Upload file
              <input type="file" className="hidden" onChange={(e) => { void uploadFile(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
          )}
        </div>
        {t.attachments.length === 0 ? (
          <p className="text-sm text-slate-500">No attachments.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {t.attachments.map((file) => (
              <li key={file.fileName}>
                <a className="text-indigo-700 hover:underline" href={apiUrl(file.url)} target="_blank" rel="noreferrer">{file.originalName}</a>
                <span className="ml-2 text-xs text-slate-500">{formatFileSize(file.size)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-3 font-semibold">Comments</h2>
          {comments.data?.length === 0 && <p className="mb-3 text-sm text-slate-500">No comments yet.</p>}
          <ul className="mb-4 space-y-3">
            {comments.data?.map((c) => (
              <li key={c._id} className="rounded-md bg-slate-50 p-3">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">{c.author.name}</span>
                  <RoleBadge role={c.author.role} />
                  <span>{formatDateTime(c.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm">{c.text}</p>
              </li>
            ))}
          </ul>
          {t.canComment && (
            <form onSubmit={submitComment} className="space-y-2">
              <textarea className="input" rows={3} placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} />
              <button type="submit" className="btn-primary" disabled={!commentText.trim()}>Add comment</button>
            </form>
          )}
        </div>

        <div className="card p-6">
          <h2 className="mb-3 font-semibold">Activity history</h2>
          {activity.data?.length === 0 && <EmptyState>No activity yet.</EmptyState>}
          <ol className="space-y-4 border-l-2 border-slate-200 pl-4">
            {activity.data?.map((a) => (
              <li key={a._id} className="relative">
                <span className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-500" />
                <p className="text-sm">
                  <span className="font-semibold">{a.actor.name}</span> {a.message}
                </p>
                <p className="text-xs text-slate-500">{formatDateTime(a.createdAt)}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {statusChange.dialogs}
      {editing && (
        <TaskFormModal
          task={t}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            reloadAll();
          }}
        />
      )}
    </div>
  );
}
