/** Date-only values (project start/end) are stored as UTC midnight, so we show them in UTC. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** Moments in time (task due dates, comments) are shown in the viewer's own timezone. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const pad = (n: number): string => String(n).padStart(2, "0");

/** ISO string -> value for <input type="datetime-local"> (local time, no timezone suffix). */
export function toDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Value of <input type="datetime-local"> -> ISO string for the API. */
export function fromDateTimeLocal(value: string): string {
  return new Date(value).toISOString();
}

/** ISO string -> value for <input type="date">. */
export function toDateInput(iso: string): string {
  return iso.slice(0, 10);
}

export function formatFileSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
