import { useState, type FormEvent } from "react";
import { projectsApi, teamsApi } from "../api/endpoints";
import type { Project, ProjectStatusValue } from "../api/types";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "../constants";
import { useAuth } from "../context/AuthContext";
import { useFetch } from "../hooks/useFetch";
import { toDateInput } from "../utils/format";
import { ErrorMessage } from "./Feedback";
import { Modal } from "./Modal";

interface ProjectFormModalProps {
  project?: Project;
  onClose: () => void;
  onSaved: () => void;
}

/** Create / edit a project. Admins choose the team; managers always use their own. */
export function ProjectFormModal({ project, onClose, onSaved }: ProjectFormModalProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const isEdit = project !== undefined;

  // Only admins creating a project need the list of teams.
  const teams = useFetch(() => (isAdmin && !isEdit ? teamsApi.list() : Promise.resolve([])), []);

  const [name, setName] = useState(project?.name ?? "");
  const [clientName, setClientName] = useState(project?.clientName ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [startDate, setStartDate] = useState(project ? toDateInput(project.startDate) : "");
  const [endDate, setEndDate] = useState(project ? toDateInput(project.endDate) : "");
  const [status, setStatus] = useState<ProjectStatusValue>(project?.status ?? "PLANNED");
  const [teamId, setTeamId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const data = { name, clientName, description, startDate, endDate, status };
    try {
      if (project) await projectsApi.update(project._id, data);
      else await projectsApi.create(isAdmin ? { ...data, teamId } : data);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the project");
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? "Edit project" : "New project"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage message={error} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="p-name">Project name</label>
            <input id="p-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
          </div>
          <div>
            <label className="label" htmlFor="p-client">Client name</label>
            <input id="p-client" className="input" value={clientName} onChange={(e) => setClientName(e.target.value)} required minLength={2} />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="p-desc">Description</label>
          <textarea id="p-desc" className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="p-start">Start date</label>
            <input id="p-start" type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="p-end">End date</label>
            <input id="p-end" type="date" className="input" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="p-status">Status</label>
            <select id="p-status" className="input" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatusValue)}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          {isAdmin && !isEdit && (
            <div>
              <label className="label" htmlFor="p-team">Team</label>
              <select id="p-team" className="input" value={teamId} onChange={(e) => setTeamId(e.target.value)} required>
                <option value="">Select a team</option>
                {teams.data?.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save changes" : "Create project"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
