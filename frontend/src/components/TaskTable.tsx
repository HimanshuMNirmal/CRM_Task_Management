import { Link } from "react-router-dom";
import type { Task } from "../api/types";
import { formatDateTime } from "../utils/format";
import { OverdueBadge, PriorityBadge, StatusBadge } from "./Badges";
import { EmptyState } from "./Feedback";

/** Table of tasks. Overdue rows have a red background so they are easy to spot. */
export function TaskTable({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) return <EmptyState>No tasks found.</EmptyState>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Task</th>
            <th className="px-4 py-3">Project</th>
            <th className="px-4 py-3">Assignee</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Due</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map((task) => (
            <tr key={task._id} className={task.isOverdue ? "bg-red-50" : "hover:bg-slate-50"}>
              <td className="px-4 py-3 font-medium">
                <Link to={`/tasks/${task._id}`} className="text-indigo-700 hover:underline">
                  {task.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{task.project.name}</td>
              <td className="px-4 py-3 text-slate-600">{task.assignee.name}</td>
              <td className="px-4 py-3">
                <PriorityBadge priority={task.priority} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={task.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <span className={task.isOverdue ? "font-semibold text-red-700" : "text-slate-600"}>{formatDateTime(task.dueDate)}</span>
                {task.isOverdue && (
                  <span className="ml-2">
                    <OverdueBadge />
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
