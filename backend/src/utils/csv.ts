/** Wraps a value in quotes if needed so commas, quotes and new lines don't break the CSV. */
function escapeCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: Array<Array<string | number>>): string {
  return [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n");
}
