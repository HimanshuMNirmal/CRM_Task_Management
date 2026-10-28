// TypeScript shapes of what the API returns.

export type Role = "ADMIN" | "MANAGER" | "EMPLOYEE";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type PriorityValue = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type ProjectStatusValue = "PLANNED" | "ACTIVE" | "ON_HOLD" | "COMPLETED";

/** The logged-in user (and the shape returned by create/update user). */
export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  team: string | null;
  isActive: boolean;
}

/** Admin user list: the team is populated with its name. */
export interface UserListItem extends Omit<User, "team"> {
  team: { _id: string; name: string } | null;
}

/** Employees a task can be assigned to. */
export interface AssignableUser {
  _id: string;
  name: string;
  email: string;
  team: string;
}

export interface UserRef {
  _id: string;
  name: string;
  email?: string;
}

export interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface Team {
  _id: string;
  name: string;
  manager: TeamMember | null;
  employees: TeamMember[];
}

export interface Progress {
  total: number;
  done: number;
  percent: number;
}

export interface Project {
  _id: string;
  name: string;
  description: string;
  clientName: string;
  startDate: string;
  endDate: string;
  status: ProjectStatusValue;
  team: { _id: string; name: string };
  createdBy: { _id: string; name: string };
  progress: Progress;
}

export interface Attachment {
  originalName: string;
  fileName: string;
  url: string;
  size: number;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  project: { _id: string; name: string };
  team: string;
  assignee: UserRef;
  createdBy: UserRef;
  priority: PriorityValue;
  status: TaskStatus;
  dueDate: string;
  attachments: Attachment[];
  createdAt: string;
  // Computed by the API for the current user:
  isOverdue: boolean;
  canEdit: boolean;
  canComment: boolean;
  allowedStatuses: TaskStatus[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface TaskComment {
  _id: string;
  text: string;
  createdAt: string;
  author: { _id: string; name: string; role: Role };
}

export interface ActivityItem {
  _id: string;
  message: string;
  action: string;
  createdAt: string;
  actor: { _id: string; name: string; role: Role };
}

export interface AppNotification {
  _id: string;
  task: string;
  type: "TASK_ASSIGNED" | "STATUS_CHANGED" | "DUE_SOON";
  message: string;
  read: boolean;
  createdAt: string;
}

export type StatusCounts = Record<TaskStatus, number>;

export interface AdminDashboard {
  role: "ADMIN";
  totalUsers: number;
  totalProjects: number;
  tasksByStatus: StatusCounts;
  overdueCount: number;
}

export interface ManagerDashboard {
  role: "MANAGER";
  tasksByStatus: StatusCounts;
  overdueCount: number;
  workload: Array<{ user: { _id: string; name: string }; total: number; open: number; byStatus: StatusCounts }>;
  awaitingReview: Task[];
  overdueTasks: Task[];
}

export interface EmployeeDashboard {
  role: "EMPLOYEE";
  tasksByStatus: StatusCounts;
  overdueCount: number;
  dueTodayCount: number;
  dueToday: Task[];
  overdueTasks: Task[];
}

export type Dashboard = AdminDashboard | ManagerDashboard | EmployeeDashboard;

/** Filters on the tasks page. Empty string means "not set". */
export interface TaskFilters {
  search: string;
  status: TaskStatus | "";
  priority: PriorityValue | "";
  project: string;
  assignee: string;
  dueFrom: string;
  dueTo: string;
  overdue: boolean;
}
