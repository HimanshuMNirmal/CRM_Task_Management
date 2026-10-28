import { useEffect, useState } from "react";
import { tasksApi } from "../api/endpoints";
import type { Task, TaskStatus } from "../api/types";
import { Modal } from "../components/Modal";
import { requiresReason, STATUS_LABELS } from "../constants";

interface Pending {
  task: Task;
  to: TaskStatus;
}

/**
 * Shared logic for moving a task to a new status (used by the board and the detail page).
 * - Asks for a reason when the workflow requires one.
 * - Shows the API's error message if the move is rejected.
 * Render `dialogs` somewhere in your component.
 */
export function useStatusChange(onChanged: () => void) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Hide the error message after a few seconds.
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 6000);
    return () => clearTimeout(timer);
  }, [error]);

  async function apply(task: Task, to: TaskStatus, why?: string) {
    try {
      await tasksApi.changeStatus(task._id, to, why);
      setPending(null);
      setReason("");
      onChanged();
    } catch (err) {
      setPending(null);
      setError(err instanceof Error ? err.message : "Could not change the status");
    }
  }

  function requestChange(task: Task, to: TaskStatus) {
    if (requiresReason(task.status, to)) setPending({ task, to });
    else void apply(task, to);
  }

  const dialogs = (
    <>
      {pending && (
        <Modal title={`Move to ${STATUS_LABELS[pending.to]}`} onClose={() => setPending(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void apply(pending.task, pending.to, reason);
            }}
            className="space-y-4"
          >
            <p className="text-sm text-slate-600">Please explain why this task is being sent back. The assignee will see this reason.</p>
            <textarea className="input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} required autoFocus />
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setPending(null)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={!reason.trim()}>
                Move task
              </button>
            </div>
          </form>
        </Modal>
      )}
      {error && (
        <div className="fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-md bg-red-600 px-4 py-3 text-sm text-white shadow-lg">
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss">
            &times;
          </button>
        </div>
      )}
    </>
  );

  return { requestChange, dialogs };
}
