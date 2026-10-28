import { useState } from "react";
import { Link } from "react-router-dom";
import type { Task, TaskStatus } from "../api/types";
import { STATUS_LABELS, TASK_STATUSES } from "../constants";
import { formatDateTime } from "../utils/format";
import { OverdueBadge, PriorityBadge } from "./Badges";

interface KanbanBoardProps {
  tasks: Task[];
  /** Called when a card is dropped on a column. The page decides how to save it. */
  onMove: (task: Task, to: TaskStatus) => void;
}

/**
 * Four columns, one per status. Cards can be dragged between columns.
 * A card can only be dropped on columns the API says are allowed (`task.allowedStatuses`),
 * so an employee can't even drop a card on "Done".
 */
export function KanbanBoard({ tasks, onMove }: KanbanBoardProps) {
  const [dragging, setDragging] = useState<Task | null>(null);

  const canDrop = (status: TaskStatus): boolean => dragging !== null && dragging.allowedStatuses.includes(status);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {TASK_STATUSES.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        const highlight = canDrop(status);
        return (
          <section
            key={status}
            className={`rounded-lg border-2 p-3 transition ${highlight ? "border-dashed border-indigo-400 bg-indigo-50" : "border-transparent bg-slate-100"}`}
            onDragOver={(e) => canDrop(status) && e.preventDefault()}
            onDrop={() => {
              if (dragging && canDrop(status)) onMove(dragging, status);
              setDragging(null);
            }}
          >
            <h3 className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-700">
              {STATUS_LABELS[status]}
              <span className="rounded-full bg-white px-2 py-0.5 text-xs">{columnTasks.length}</span>
            </h3>

            <div className="space-y-2">
              {columnTasks.map((task) => (
                <article
                  key={task._id}
                  draggable={task.allowedStatuses.length > 0}
                  onDragStart={() => setDragging(task)}
                  onDragEnd={() => setDragging(null)}
                  className={`rounded-md border bg-white p-3 shadow-sm ${task.isOverdue ? "border-red-400" : "border-slate-200"} ${task.allowedStatuses.length > 0 ? "cursor-grab" : ""}`}
                >
                  <Link to={`/tasks/${task._id}`} className="text-sm font-medium text-slate-900 hover:text-indigo-700">
                    {task.title}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">
                    {task.project.name} &middot; {task.assignee.name}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={task.priority} />
                    {task.isOverdue && <OverdueBadge />}
                  </div>
                  <p className={`mt-2 text-xs ${task.isOverdue ? "font-semibold text-red-700" : "text-slate-500"}`}>Due {formatDateTime(task.dueDate)}</p>
                </article>
              ))}
              {columnTasks.length === 0 && <p className="py-4 text-center text-xs text-slate-400">No tasks</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
