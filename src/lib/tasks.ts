import type { Task, TaskPriority, TaskStatus } from "@/db/schema";
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

export type TaskSummary = {
  total: number;
  byStatus: Record<TaskStatus, number>;
};

export function summarizeTasks(taskList: readonly Pick<Task, "status">[]): TaskSummary {
  const byStatus: Record<TaskStatus, number> = {
    todo: 0,
    in_progress: 0,
    done: 0,
  };

  for (const task of taskList) {
    byStatus[task.status] += 1;
  }

  return {
    total: taskList.length,
    byStatus,
  };
}
