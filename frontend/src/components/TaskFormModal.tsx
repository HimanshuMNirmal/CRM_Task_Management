import { useState, type FormEvent } from "react";
import { projectsApi, tasksApi, usersApi } from "../api/endpoints";
import type { PriorityValue, Task } from "../api/types";
import { PRIORITIES, PRIORITY_LABELS } from "../constants";
import { useFetch } from "../hooks/useFetch";
import { fromDateTimeLocal, toDateTimeLocal } from "../utils/format";
import { ErrorMessage, Spinner } from "./Feedback";
import { Modal } from "./Modal";

interface TaskFormModalProps {
  /** Pass a task to edit it. Leave empty to create a new one. */
  task?: Task;
  /** Pre-selects a project when creating (e.g. from the project page). */
  defaultProjectId?: string;
  onClose: () => void;
  onSaved: () => void;
}

/** Create / edit a task. Assignee choices are limited to employees of the project's team. */
export function TaskFormModal({ task, defaultProjectId, onClose, onSaved }: TaskFormModalProps) {
  const isEdit = task !== undefined;

  const options = useFetch(async () => {
    const [projects, assignees] = await Promise.all([isEdit ? Promise.resolve([]) : projectsApi.list(), usersApi.assignable()]);
    return { projects, assignees };
  }, []);

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [projectId, setProjectId] = useState(task?.project._id ?? defaultProjectId ?? "");
  const [assigneeId, setAssigneeId] = useState(task?.assignee._id ?? "");
  const [priority, setPriority] = useState<PriorityValue>(task?.priority ?? "MEDIUM");
  const [dueDate, setDueDate] = useState(task ? toDateTimeLocal(task.dueDate) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The team of the selected project decides who can be assigned.
  const teamId = task?.team ?? options.data?.projects.find((p) => p._id === projectId)?.team._id;
  const assigneeChoices = (options.data?.assignees ?? []).filter((u) => u.team === teamId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const common = { title, description, priority, dueDate: fromDateTimeLocal(dueDate), assigneeId };
    try {
      if (task) await tasksApi.update(task._id, common);
      else await tasksApi.create({ ...common, projectId });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the task");
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? "Edit task" : "New task"} onClose={onClose}>
      {options.loading ? (
        <Spinner />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorMessage message={error ?? options.error} />

          <div>
            <label className="label" htmlFor="t-title">Title</label>
            <input id="t-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} />
          </div>

          <div>
            <label className="label" htmlFor="t-desc">Description</label>
            <textarea id="t-desc" className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {!isEdit && (
            <div>
              <label className="label" htmlFor="t-project">Project</label>
              <select
                id="t-project"
                className="input"
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  setAssigneeId(""); // the previous assignee may belong to a different team
                }}
                required
              >
                <option value="">Select a project</option>
                {options.data?.projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name} ({p.team.name})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label" htmlFor="t-assignee">Assignee</label>
            <select id="t-assignee" className="input" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} required disabled={!teamId}>
              <option value="">{teamId ? "Select an employee" : "Select a project first"}</option>
              {assigneeChoices.map((u) => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="t-priority">Priority</label>
              <select id="t-priority" className="input" value={priority} onChange={(e) => setPriority(e.target.value as PriorityValue)}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="t-due">Due date</label>
              <input id="t-due" type="datetime-local" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
