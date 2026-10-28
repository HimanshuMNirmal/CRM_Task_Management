import { useState, type FormEvent } from "react";
import { teamsApi, usersApi } from "../api/endpoints";
import type { Team } from "../api/types";
import { EmptyState, ErrorMessage, PageHeader, Spinner } from "../components/Feedback";
import { Modal } from "../components/Modal";
import { useFetch } from "../hooks/useFetch";

/**
 * Create a team, or edit its name / manager / employees.
 * Only people who are not in another team can be picked.
 */
function TeamFormModal({ team, onClose, onSaved }: { team?: Team; onClose: () => void; onSaved: () => void }) {
  const people = useFetch(() => usersApi.list(), []);
  const [name, setName] = useState(team?.name ?? "");
  const [managerId, setManagerId] = useState(team?.manager?._id ?? "");
  const [employeeIds, setEmployeeIds] = useState<string[]>(team?.employees.map((e) => e._id) ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Active users who are free (no team) or already in this team.
  const available = (people.data ?? []).filter((u) => u.isActive && (u.team === null || u.team._id === team?._id));
  const managers = available.filter((u) => u.role === "MANAGER");
  const employees = available.filter((u) => u.role === "EMPLOYEE");

  const toggleEmployee = (id: string) =>
    setEmployeeIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let teamId = team?._id;
      if (!team) teamId = (await teamsApi.create(name))._id;
      else if (name !== team.name) await teamsApi.rename(team._id, name);

      if (teamId && managerId) await teamsApi.setMembers(teamId, managerId, employeeIds);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the team");
      setSaving(false);
    }
  }

  return (
    <Modal title={team ? "Edit team" : "New team"} onClose={onClose}>
      {people.loading ? (
        <Spinner />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorMessage message={error ?? people.error} />
          <div>
            <label className="label" htmlFor="team-name">Team name</label>
            <input id="team-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
          </div>

          <div>
            <label className="label" htmlFor="team-manager">Manager</label>
            <select id="team-manager" className="input" value={managerId} onChange={(e) => setManagerId(e.target.value)}>
              <option value="">{team ? "Select a manager" : "Select a manager (optional now)"}</option>
              {managers.map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className="label">Employees</legend>
            {employees.length === 0 && <p className="text-sm text-slate-500">No free employees available.</p>}
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
              {employees.map((emp) => (
                <label key={emp._id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={employeeIds.includes(emp._id)} onChange={() => toggleEmployee(emp._id)} />
                  {emp.name}
                </label>
              ))}
            </div>
          </fieldset>

          {!managerId && <p className="text-xs text-slate-500">Members are saved once a manager is selected.</p>}

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save team"}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function TeamsPage() {
  const teams = useFetch(() => teamsApi.list(), []);
  const [editing, setEditing] = useState<Team | "new" | null>(null);

  return (
    <>
      <PageHeader title="Teams" subtitle="Each team has one manager and any number of employees" actions={<button className="btn-primary" onClick={() => setEditing("new")}>+ New team</button>} />
      {teams.loading && !teams.data && <Spinner />}
      <ErrorMessage message={teams.error} />
      {teams.data?.length === 0 && <EmptyState>No teams yet.</EmptyState>}

      <div className="grid gap-4 md:grid-cols-2">
        {teams.data?.map((team) => (
          <div key={team._id} className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">{team.name}</h2>
              <button className="text-sm text-indigo-600 hover:underline" onClick={() => setEditing(team)}>Edit</button>
            </div>
            <p className="text-sm"><span className="text-slate-500">Manager:</span> {team.manager?.name ?? <em className="text-slate-400">none</em>}</p>
            <p className="mt-2 text-sm text-slate-500">Employees ({team.employees.length})</p>
            <ul className="mt-1 list-inside list-disc text-sm">
              {team.employees.map((e) => (
                <li key={e._id} className={e.isActive ? "" : "text-slate-400 line-through"}>{e.name}</li>
              ))}
              {team.employees.length === 0 && <li className="list-none text-slate-400">No employees yet</li>}
            </ul>
          </div>
        ))}
      </div>

      {editing && (
        <TeamFormModal
          team={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            teams.reload();
          }}
        />
      )}
    </>
  );
}
