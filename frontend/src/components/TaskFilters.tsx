import type { AssignableUser, PriorityValue, Project, TaskFilters as Filters, TaskStatus } from "../api/types";
import { PRIORITIES, PRIORITY_LABELS, STATUS_LABELS, TASK_STATUSES } from "../constants";

interface TaskFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  projects: Project[];
  assignees: AssignableUser[];
  /** Employees only see their own tasks, so the project/assignee filters are hidden for them. */
  showRelations: boolean;
}

export function TaskFilters({ filters, onChange, projects, assignees, showRelations }: TaskFiltersProps) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...filters, [key]: value });

  return (
    <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="f-search">Search</label>
        <input id="f-search" className="input" placeholder="Title or description" value={filters.search} onChange={(e) => set("search", e.target.value)} />
      </div>

      <div>
        <label className="label" htmlFor="f-status">Status</label>
        <select id="f-status" className="input" value={filters.status} onChange={(e) => set("status", e.target.value as TaskStatus | "")}>
          <option value="">All</option>
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="f-priority">Priority</label>
        <select id="f-priority" className="input" value={filters.priority} onChange={(e) => set("priority", e.target.value as PriorityValue | "")}>
          <option value="">All</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
          ))}
        </select>
      </div>

      {showRelations && (
        <>
          <div>
            <label className="label" htmlFor="f-project">Project</label>
            <select id="f-project" className="input" value={filters.project} onChange={(e) => set("project", e.target.value)}>
              <option value="">All</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-assignee">Assignee</label>
            <select id="f-assignee" className="input" value={filters.assignee} onChange={(e) => set("assignee", e.target.value)}>
              <option value="">All</option>
              {assignees.map((u) => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>
        </>
      )}

      <div>
        <label className="label" htmlFor="f-from">Due from</label>
        <input id="f-from" type="date" className="input" value={filters.dueFrom} onChange={(e) => set("dueFrom", e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="f-to">Due to</label>
        <input id="f-to" type="date" className="input" value={filters.dueTo} onChange={(e) => set("dueTo", e.target.value)} />
      </div>

      <div className="flex items-end justify-between gap-2 sm:col-span-2 lg:col-span-1">
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" checked={filters.overdue} onChange={(e) => set("overdue", e.target.checked)} />
          Overdue only
        </label>
        <button
          className="btn-secondary"
          onClick={() => onChange({ search: "", status: "", priority: "", project: "", assignee: "", dueFrom: "", dueTo: "", overdue: false })}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
