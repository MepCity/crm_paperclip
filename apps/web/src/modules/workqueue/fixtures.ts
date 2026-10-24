/** Synthetic Tasks used by the local queue preview (WD01, WD04). Never sent to a service. */
export const PREVIEW_TODAY = "2026-01-15";

export type PreviewTask = { id: string; subject: string; dueDate: string; status: string };

export const previewTasks: readonly PreviewTask[] = [
  {
    id: "preview-task-1",
    subject: "Call back overdue contact",
    dueDate: "2026-01-10",
    status: "Not Started",
  },
  {
    id: "preview-task-2",
    subject: "Send revised proposal",
    dueDate: "2026-01-14",
    status: "In Progress",
  },
  {
    id: "preview-task-3",
    subject: "Prepare today's demo",
    dueDate: PREVIEW_TODAY,
    status: "Not Started",
  },
  {
    id: "preview-task-4",
    subject: "Quarterly review notes",
    dueDate: "2026-01-20",
    status: "Not Started",
  },
];

export type PreviewSource = "live" | "populated" | "zero";
export type PreviewFilter = "today-overdue" | "all-open";

/** Filter changes are in-memory only; the rows and the count come from one list. */
export function previewQueue(
  source: Exclude<PreviewSource, "live">,
  filter: PreviewFilter,
): { rows: PreviewTask[]; count: number } {
  const tasks = source === "zero" ? [] : previewTasks;
  const rows = tasks.filter((task) => filter === "all-open" || task.dueDate <= PREVIEW_TODAY);
  return { rows, count: rows.length };
}
