import type { TaskPriority, TaskStatus } from "@/db/schema";
import { TASK_STATUSES } from "@/db/schema";

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function statusLabel(status: TaskStatus): string {
  return STATUS_LABELS[status];
}

export function priorityLabel(priority: TaskPriority): string {
  return PRIORITY_LABELS[priority];
}

/** Cycle: todo → in_progress → done → todo */
export function nextStatus(status: TaskStatus): TaskStatus {
  const index = TASK_STATUSES.indexOf(status);
  const next = TASK_STATUSES[(index + 1) % TASK_STATUSES.length];
  return next ?? "todo";
}

export function statusBadgeVariant(
  status: TaskStatus,
): "default" | "secondary" | "outline" {
  switch (status) {
    case "done":
      return "default";
    case "in_progress":
      return "secondary";
    case "todo":
      return "outline";
  }
}

/** A task is overdue if it has a due date in the past and isn't done. */
export function isOverdue(
  dueDate: Date | null,
  status: TaskStatus,
  now: Date = new Date(),
): boolean {
  if (!dueDate || status === "done") return false;
  return dueDate.getTime() < now.getTime();
}

export function formatDueDate(dueDate: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(dueDate);
}
