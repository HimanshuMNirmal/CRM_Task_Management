import type { TaskFilters } from "../api/types";

/** Turns the filter form into a query string, leaving out anything that is empty. */
export function buildTaskParams(filters: TaskFilters, page: number, limit: number): URLSearchParams {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });

  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.project) params.set("project", filters.project);
  if (filters.assignee) params.set("assignee", filters.assignee);
  if (filters.overdue) params.set("overdue", "true");
  // Date pickers give "YYYY-MM-DD" in local time; convert to the start / end of that local day.
  if (filters.dueFrom) params.set("dueFrom", new Date(`${filters.dueFrom}T00:00:00`).toISOString());
  if (filters.dueTo) params.set("dueTo", new Date(`${filters.dueTo}T23:59:59.999`).toISOString());

  return params;
}

export const EMPTY_FILTERS: TaskFilters = {
  search: "",
  status: "",
  priority: "",
  project: "",
  assignee: "",
  dueFrom: "",
  dueTo: "",
  overdue: false,
};
