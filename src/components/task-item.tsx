import { Trash2 } from "lucide-react";
import type { Task } from "@/db/schema";
import {
  formatDueDate,
  isOverdue,
  priorityLabel,
  statusBadgeVariant,
  statusLabel,
} from "@/lib/tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TaskItemProps = {
  task: Task;
  onAdvance?: (taskId: string) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
};

export function TaskItem({ task, onAdvance, onDelete }: TaskItemProps) {
  return (
    <li
      data-testid={`task-${task.id}`}
      className="flex items-center gap-3 rounded-lg border bg-card p-4"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{task.title}</p>
        {task.description && (
          <p className="truncate text-sm text-muted-foreground">
            {task.description}
          </p>
        )}
      </div>
      <Badge variant="outline" className="shrink-0">
        {priorityLabel(task.priority)}
      </Badge>
      {task.dueDate && (
        <span
          className={cn(
            "shrink-0 text-xs",
            isOverdue(task.dueDate, task.status)
              ? "font-medium text-destructive"
              : "text-muted-foreground",
          )}
        >
          {formatDueDate(task.dueDate)}
        </span>
      )}
      <form action={onAdvance?.bind(null, task.id)} className="shrink-0">
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          aria-label={`Advance status of ${task.title}`}
        >
          <Badge variant={statusBadgeVariant(task.status)}>
            {statusLabel(task.status)}
          </Badge>
        </Button>
      </form>
      <form action={onDelete?.bind(null, task.id)} className="shrink-0">
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          aria-label={`Delete ${task.title}`}
        >
          <Trash2 className="text-muted-foreground" />
        </Button>
      </form>
    </li>
  );
}
