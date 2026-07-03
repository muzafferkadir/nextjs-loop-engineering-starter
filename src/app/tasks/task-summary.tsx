import type { TaskSummary as TaskSummaryData } from "@/lib/tasks";
import { statusLabel } from "@/lib/tasks";
import { TASK_STATUSES } from "@/db/schema";

type TaskSummaryProps = {
  summary: TaskSummaryData;
};

export function TaskSummary({ summary }: TaskSummaryProps) {
  const hasTasks = summary.total > 0;

  return (
    <section
      aria-labelledby="task-summary-title"
      className="rounded-lg border bg-card p-4 text-card-foreground"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="task-summary-title" className="text-base font-semibold">
            Task summary
          </h2>
          <p className="text-sm text-muted-foreground">
            {hasTasks
              ? "Current non-deleted tasks by status."
              : "No active tasks yet. New tasks will appear here."}
          </p>
        </div>
        <p className="text-3xl font-semibold tabular-nums">{summary.total}</p>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        {TASK_STATUSES.map((status) => (
          <div key={status} className="rounded-md border bg-background p-3">
            <dt className="truncate text-xs font-medium text-muted-foreground">
              {statusLabel(status)}
            </dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">
              {summary.byStatus[status]}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
