import { and, desc, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { tasks } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { parseTaskFilters } from "@/lib/tasks";
import { TaskFilter } from "@/components/task-filter";
import { TaskForm } from "@/components/task-form";
import { TaskItem } from "@/components/task-item";
import { Button } from "@/components/ui/button";
import { advanceTask, deleteTask, logout } from "./actions";

type TasksPageProps = {
  searchParams: Promise<{ status?: string; priority?: string }>;
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { status, priority } = parseTaskFilters(await searchParams);
  const isFiltered = status !== undefined || priority !== undefined;

  const taskList = await db.query.tasks.findMany({
    where: and(
      eq(tasks.userId, user.id),
      isNull(tasks.deletedAt),
      status ? eq(tasks.status, status) : undefined,
      priority ? eq(tasks.priority, priority) : undefined,
    ),
    orderBy: [desc(tasks.updatedAt)],
  });

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {user.name}
          </p>
        </div>
        <form action={logout}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </header>

      <TaskForm />
      <TaskFilter />

      {taskList.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          {isFiltered
            ? "No tasks match your filters."
            : "No tasks yet. Add your first task above."}
        </div>
      ) : (
        <ul className="space-y-2">
          {taskList.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onAdvance={advanceTask}
              onDelete={deleteTask}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
