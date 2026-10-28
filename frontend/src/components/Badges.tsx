import type { PriorityValue, Role, TaskStatus } from "../api/types";
import { PRIORITY_LABELS, PRIORITY_STYLES, ROLE_LABELS, STATUS_LABELS, STATUS_STYLES } from "../constants";

const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`${base} ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: PriorityValue }) {
  return <span className={`${base} ${PRIORITY_STYLES[priority]}`}>{PRIORITY_LABELS[priority]}</span>;
}

export function OverdueBadge() {
  return <span className={`${base} bg-red-600 text-white`}>Overdue</span>;
}

export function RoleBadge({ role }: { role: Role }) {
  return <span className={`${base} bg-indigo-100 text-indigo-700`}>{ROLE_LABELS[role]}</span>;
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`${base} ${active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
      {active ? "Active" : "Deactivated"}
    </span>
  );
}
