import { useState } from "react";
import { Link } from "react-router-dom";
import { projectsApi } from "../api/endpoints";
import { EmptyState, ErrorMessage, PageHeader, Spinner } from "../components/Feedback";
import { ProgressBar } from "../components/ProgressBar";
import { ProjectFormModal } from "../components/ProjectFormModal";
import { PROJECT_STATUS_LABELS } from "../constants";
import { useFetch } from "../hooks/useFetch";
import { formatDate } from "../utils/format";

export function ProjectsPage() {
  const projects = useFetch(() => projectsApi.list(), []);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle="Progress is the share of tasks that are Done"
        actions={<button className="btn-primary" onClick={() => setCreating(true)}>+ New project</button>}
      />

      {projects.loading && !projects.data && <Spinner />}
      <ErrorMessage message={projects.error} />
      {projects.data?.length === 0 && <EmptyState>No projects yet. Create the first one.</EmptyState>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.data?.map((project) => (
          <Link key={project._id} to={`/projects/${project._id}`} className="card block p-4 transition hover:border-indigo-300 hover:shadow">
            <div className="mb-1 flex items-start justify-between gap-2">
              <h2 className="font-semibold text-slate-900">{project.name}</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{PROJECT_STATUS_LABELS[project.status]}</span>
            </div>
            <p className="text-sm text-slate-500">{project.clientName} &middot; {project.team.name}</p>
            <p className="mb-3 mt-1 text-xs text-slate-500">{formatDate(project.startDate)} &rarr; {formatDate(project.endDate)}</p>
            <ProgressBar percent={project.progress.percent} />
            <p className="mt-1 text-xs text-slate-500">{project.progress.done} of {project.progress.total} tasks done</p>
          </Link>
        ))}
      </div>

      {creating && (
        <ProjectFormModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            projects.reload();
          }}
        />
      )}
    </>
  );
}
