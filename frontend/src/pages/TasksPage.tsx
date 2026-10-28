import { useMemo, useState } from "react";
import { projectsApi, tasksApi, usersApi } from "../api/endpoints";
import type { TaskFilters as Filters } from "../api/types";
import { ErrorMessage, PageHeader, Spinner } from "../components/Feedback";
import { KanbanBoard } from "../components/KanbanBoard";
import { Pagination } from "../components/Pagination";
import { TaskFilters } from "../components/TaskFilters";
import { TaskFormModal } from "../components/TaskFormModal";
import { TaskTable } from "../components/TaskTable";
import { useAuth } from "../context/AuthContext";
import { useDebounce } from "../hooks/useDebounce";
import { useFetch } from "../hooks/useFetch";
import { useStatusChange } from "../hooks/useStatusChange";
import { buildTaskParams, EMPTY_FILTERS } from "../utils/taskParams";

const LIST_PAGE_SIZE = 10;
const BOARD_LIMIT = 100;

type View = "list" | "board";

export function TasksPage() {
  const { user } = useAuth();
  const isEmployee = user?.role === "EMPLOYEE";

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<View>("board");
  const [creating, setCreating] = useState(false);

  // Wait until the user stops typing before searching.
  const search = useDebounce(filters.search);
  const params = useMemo(
    () => buildTaskParams({ ...filters, search }, page, view === "board" ? BOARD_LIMIT : LIST_PAGE_SIZE),
    [filters, search, page, view],
  );

  const tasks = useFetch(() => tasksApi.list(params), [params.toString()]);
  const statusChange = useStatusChange(tasks.reload);

  // Dropdown options for the project / assignee filters (employees don't get these filters).
  const lookups = useFetch(async () => {
    if (isEmployee) return { projects: [], assignees: [] };
    const [projects, assignees] = await Promise.all([projectsApi.list(), usersApi.assignable()]);
    return { projects, assignees };
  }, [isEmployee]);

  function changeFilters(next: Filters) {
    setFilters(next);
    setPage(1);
  }

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle={isEmployee ? "Tasks assigned to you" : user?.role === "MANAGER" ? "Your team's tasks" : "All tasks"}
        actions={
          <>
            <div className="inline-flex overflow-hidden rounded-md border border-slate-300">
              {(["board", "list"] as const).map((v) => (
                <button
                  key={v}
                  className={`px-3 py-2 text-sm font-medium capitalize ${view === v ? "bg-indigo-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}
                  onClick={() => setView(v)}
                >
                  {v}
                </button>
              ))}
            </div>
            <button className="btn-secondary" onClick={() => void tasksApi.exportCsv(params)}>
              Export CSV
            </button>
            {!isEmployee && (
              <button className="btn-primary" onClick={() => setCreating(true)}>
                + New task
              </button>
            )}
          </>
        }
      />

      <TaskFilters
        filters={filters}
        onChange={changeFilters}
        projects={lookups.data?.projects ?? []}
        assignees={lookups.data?.assignees ?? []}
        showRelations={!isEmployee}
      />

      <ErrorMessage message={tasks.error} />
      {tasks.loading && !tasks.data && <Spinner />}

      {tasks.data && view === "list" && (
        <div className="card">
          <TaskTable tasks={tasks.data.items} />
          <Pagination page={tasks.data.page} pages={tasks.data.pages} total={tasks.data.total} onChange={setPage} />
        </div>
      )}

      {tasks.data && view === "board" && (
        <>
          <p className="mb-3 text-sm text-slate-500">
            Drag a card to another column to change its status.
            {tasks.data.total > BOARD_LIMIT && ` Showing the first ${BOARD_LIMIT} of ${tasks.data.total} tasks - use filters to narrow down.`}
          </p>
          <KanbanBoard tasks={tasks.data.items} onMove={statusChange.requestChange} />
        </>
      )}

      {statusChange.dialogs}
      {creating && (
        <TaskFormModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            tasks.reload();
          }}
        />
      )}
    </>
  );
}
