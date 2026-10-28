// One function per API endpoint, so pages never build URLs by hand.
import { http } from "./client";
import type {
  ActivityItem,
  AppNotification,
  AssignableUser,
  Dashboard,
  Paginated,
  PriorityValue,
  Project,
  ProjectStatusValue,
  Role,
  Task,
  TaskComment,
  TaskStatus,
  Team,
  User,
  UserListItem,
} from "./types";

export const authApi = {
  login: (email: string, password: string) => http.post<{ token: string; user: User }>("/auth/login", { email, password }),
  logout: () => http.post<{ message: string }>("/auth/logout"),
  me: () => http.get<User>("/auth/me"),
};

export const usersApi = {
  list: () => http.get<UserListItem[]>("/users"),
  assignable: () => http.get<AssignableUser[]>("/users/assignable"),
  create: (data: { name: string; email: string; password: string; role: Role }) => http.post<User>("/users", data),
  update: (id: string, data: { name?: string; role?: Role; isActive?: boolean; password?: string }) =>
    http.patch<User>(`/users/${id}`, data),
  /** Moves the user's unfinished tasks to another employee. Tasks outside that employee's team are skipped. */
  reassignTasks: (id: string, assigneeId: string) =>
    http.post<{ reassigned: number; skipped: number }>(`/users/${id}/reassign-tasks`, { assigneeId }),
};

export const teamsApi = {
  list: () => http.get<Team[]>("/teams"),
  create: (name: string) => http.post<Team>("/teams", { name }),
  rename: (id: string, name: string) => http.patch<Team>(`/teams/${id}`, { name }),
  setMembers: (id: string, managerId: string, employeeIds: string[]) =>
    http.put<Team>(`/teams/${id}/members`, { managerId, employeeIds }),
};

export interface ProjectInput {
  name: string;
  description: string;
  clientName: string;
  startDate: string;
  endDate: string;
  status: ProjectStatusValue;
  teamId?: string;
}

export const projectsApi = {
  list: () => http.get<Project[]>("/projects"),
  get: (id: string) => http.get<Project>(`/projects/${id}`),
  create: (data: ProjectInput) => http.post<Project>("/projects", data),
  update: (id: string, data: Partial<Omit<ProjectInput, "teamId">>) => http.patch<Project>(`/projects/${id}`, data),
};

export interface TaskInput {
  title: string;
  description: string;
  priority: PriorityValue;
  dueDate: string;
  assigneeId: string;
}

export const tasksApi = {
  list: (query: URLSearchParams) => http.get<Paginated<Task>>(`/tasks?${query.toString()}`),
  exportCsv: (query: URLSearchParams) => http.download(`/tasks/export?${query.toString()}`, "tasks.csv"),
  get: (id: string) => http.get<Task>(`/tasks/${id}`),
  create: (data: TaskInput & { projectId: string }) => http.post<Task>("/tasks", data),
  update: (id: string, data: Partial<TaskInput>) => http.patch<Task>(`/tasks/${id}`, data),
  changeStatus: (id: string, status: TaskStatus, reason?: string) => http.patch<Task>(`/tasks/${id}/status`, { status, reason }),
  attach: (id: string, file: File) => http.upload<Task>(`/tasks/${id}/attachments`, file),
  comments: (id: string) => http.get<TaskComment[]>(`/tasks/${id}/comments`),
  addComment: (id: string, text: string) => http.post<TaskComment>(`/tasks/${id}/comments`, { text }),
  activity: (id: string) => http.get<ActivityItem[]>(`/tasks/${id}/activity`),
};

export const notificationsApi = {
  list: () => http.get<{ items: AppNotification[]; unreadCount: number }>("/notifications"),
  markRead: (id: string) => http.patch<{ message: string }>(`/notifications/${id}/read`, {}),
  markAllRead: () => http.patch<{ message: string }>("/notifications/read-all", {}),
};

export const dashboardApi = {
  get: () => http.get<Dashboard>("/dashboard"),
};
