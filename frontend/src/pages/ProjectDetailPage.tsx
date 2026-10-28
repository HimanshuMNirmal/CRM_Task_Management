import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { projectsApi, tasksApi } from "../api/endpoints";
import { ErrorMessage, Spinner } from "../components/Feedback";
import { ProgressBar } from "../components/ProgressBar";
import { ProjectFormModal } from "../components/ProjectFormModal";
import { TaskFormModal } from "../components/TaskFormModal";
import { TaskTable } from "../components/TaskTable";
import { PROJECT_STATUS_LABELS } from "../constants";
import { useFetch } from "../hooks/useFetch";
import { formatDate } from "../utils/format";

export function ProjectDetailPage() {
  const { id = "" } = useParams();
  const project = useFetch(() => projectsApi.get(id), [id]);
  const params = useMemo(() => new URLSearchParams({ project: id, limit: "100" }), [id]);
  const tasks = useFetch(() => tasksApi.list(params), [id]);

  const [editing, setEditing] = useState(false);
  const [addingTask, setAddingTask] = useState(false);

  if (project.loading && !project.data) return <Spinner />;
  if (project.error || !project.data) return <ErrorMessage message={project.error ?? "Project not found"} />;
  const p = project.data;

  const refresh = () => {
    project.reload();
    tasks.reload();
  };

  return (
    <div className="space-y-6">
      <Link to="/projects" className="text-sm text-indigo-600 hover:underline">&larr; Back to projects</Link>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{p.name}</h1>
            <p className="text-sm text-slate-500">
              {p.clientName} &middot; {p.team.name} &middot; {PROJECT_STATUS_LABELS[p.status]}
            </p>
          </div>
          <button className="btn-secondary" onClick={() => setEditing(true)}>Edit project</button>
        </div>

        <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">{p.description || "No description."}</p>
        <p className="mt-3 text-sm text-slate-500">{formatDate(p.startDate)} &rarr; {formatDate(p.endDate)} &middot; created by {p.createdBy.name}</p>

        <div className="mt-4 max-w-md">
          <ProgressBar percent={p.progress.percent} />
          <p className="mt-1 text-xs text-slate-500">{p.progress.done} of {p.progress.total} tasks done</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold">Tasks in this project</h2>
          <button className="btn-primary" onClick={() => setAddingTask(true)}>+ Add task</button>
        </div>
        {tasks.data ? <TaskTable tasks={tasks.data.items} /> : <Spinner />}
      </div>

      {editing && (
        <ProjectFormModal
          project={p}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            refresh();
          }}
        />
      )}
      {addingTask && (
        <TaskFormModal
          defaultProjectId={p._id}
          onClose={() => setAddingTask(false)}
          onSaved={() => {
            setAddingTask(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}
