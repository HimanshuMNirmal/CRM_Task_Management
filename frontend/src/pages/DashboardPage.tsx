import { Link } from "react-router-dom";
import { dashboardApi } from "../api/endpoints";
import type { StatusCounts, Task } from "../api/types";
import { OverdueBadge } from "../components/Badges";
import { EmptyState, ErrorMessage, PageHeader, Spinner } from "../components/Feedback";
import { STATUS_BAR_COLORS, STATUS_LABELS, TASK_STATUSES } from "../constants";
import { useAuth } from "../context/AuthContext";
import { useFetch } from "../hooks/useFetch";
import { formatDateTime } from "../utils/format";

function StatCard({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className={`card p-4 ${danger && value > 0 ? "border-red-300 bg-red-50" : ""}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${danger && value > 0 ? "text-red-700" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

/** One horizontal bar per status, sized relative to the biggest count. */
function StatusBreakdown({ title, counts }: { title: string; counts: StatusCounts }) {
  const max = Math.max(1, ...TASK_STATUSES.map((s) => counts[s]));
  return (
    <div className="card p-4">
      <h2 className="mb-3 font-semibold">{title}</h2>
      <div className="space-y-3">
        {TASK_STATUSES.map((status) => (
          <div key={status}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{STATUS_LABELS[status]}</span>
              <span className="font-medium">{counts[status]}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className={`h-2 rounded-full ${STATUS_BAR_COLORS[status]}`} style={{ width: `${(counts[status] / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskList({ title, tasks, danger = false }: { title: string; tasks: Task[]; danger?: boolean }) {
  return (
    <div className="card">
      <h2 className="border-b border-slate-200 px-4 py-3 font-semibold">{title}</h2>
      {tasks.length === 0 ? (
        <EmptyState>Nothing here.</EmptyState>
      ) : (
        <ul className="divide-y divide-slate-100">
          {tasks.map((task) => (
            <li key={task._id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <Link to={`/tasks/${task._id}`} className="block truncate text-sm font-medium text-indigo-700 hover:underline">
                  {task.title}
                </Link>
                <p className="text-xs text-slate-500">{task.assignee.name} &middot; {task.project.name}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {danger && task.isOverdue && <OverdueBadge />}
                <span className="text-xs text-slate-500">{formatDateTime(task.dueDate)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error } = useFetch(() => dashboardApi.get(), []);

  const subtitle =
    user?.role === "ADMIN" ? "Everything in the company" : user?.role === "MANAGER" ? "Your team at a glance" : "Your tasks at a glance";

  return (
    <>
      <PageHeader title={`Welcome, ${user?.name ?? ""}`} subtitle={subtitle} />
      {loading && <Spinner />}
      <ErrorMessage message={error} />

      {data?.role === "ADMIN" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total users" value={data.totalUsers} />
            <StatCard label="Total projects" value={data.totalProjects} />
            <StatCard label="Overdue tasks" value={data.overdueCount} danger />
          </div>
          <StatusBreakdown title="Tasks by status" counts={data.tasksByStatus} />
        </div>
      )}

      {data?.role === "MANAGER" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Awaiting review" value={data.tasksByStatus.IN_REVIEW} />
            <StatCard label="Overdue tasks" value={data.overdueCount} danger />
            <StatCard label="Done" value={data.tasksByStatus.DONE} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <StatusBreakdown title="Team tasks by status" counts={data.tasksByStatus} />
            <div className="card p-4">
              <h2 className="mb-3 font-semibold">Team workload (open tasks)</h2>
              {data.workload.length === 0 && <EmptyState>No team members yet.</EmptyState>}
              <div className="space-y-3">
                {data.workload.map((row) => (
                  <div key={row.user._id}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{row.user.name}</span>
                      <span className="font-medium">{row.open} open / {row.total} total</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${row.total === 0 ? 0 : (row.open / row.total) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TaskList title="Tasks awaiting review" tasks={data.awaitingReview} />
            <TaskList title="Overdue tasks" tasks={data.overdueTasks} danger />
          </div>
        </div>
      )}

      {data?.role === "EMPLOYEE" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="In progress" value={data.tasksByStatus.IN_PROGRESS} />
            <StatCard label="Due today" value={data.dueTodayCount} />
            <StatCard label="Overdue" value={data.overdueCount} danger />
          </div>
          <StatusBreakdown title="My tasks by status" counts={data.tasksByStatus} />
          <div className="grid gap-4 lg:grid-cols-2">
            <TaskList title="Due today" tasks={data.dueToday} />
            <TaskList title="Overdue" tasks={data.overdueTasks} danger />
          </div>
        </div>
      )}
    </>
  );
}
