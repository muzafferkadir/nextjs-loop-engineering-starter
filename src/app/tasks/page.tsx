import { and, desc, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { tasks } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { TaskForm } from "@/components/task-form";
import { TaskItem } from "@/components/task-item";
import { Button } from "@/components/ui/button";
import { summarizeTasks } from "@/lib/tasks";
import { advanceTask, deleteTask, logout } from "./actions";
import { TaskSummary } from "./task-summary";

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const taskList = await db.query.tasks.findMany({
    where: and(eq(tasks.userId, user.id), isNull(tasks.deletedAt)),
    orderBy: [desc(tasks.updatedAt)],
  });
  const summary = summarizeTasks(taskList);

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

      <TaskSummary summary={summary} />

      {taskList.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No tasks yet. Add your first task above.
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
