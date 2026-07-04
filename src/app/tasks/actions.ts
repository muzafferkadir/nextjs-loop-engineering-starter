"use server";

import { randomUUID } from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db/client";
import { tasks, TASK_PRIORITIES } from "@/db/schema";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { nextStatus } from "@/lib/tasks";

export type TaskFormState = { error: string | null };

const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional(),
  priority: z.enum(TASK_PRIORITIES).default("medium"),
  dueDate: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid due date")
    .optional(),
});

export async function createTask(
  _prevState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = createTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    priority: formData.get("priority") ?? "medium",
    dueDate: formData.get("dueDate") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  await db.insert(tasks).values({
    id: randomUUID(),
    userId: user.id,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    priority: parsed.data.priority,
    dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
  });

  revalidatePath("/tasks");
  return { error: null };
}

/** Cycle the task status: todo → in_progress → done → todo. */
export async function advanceTask(taskId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const task = await db.query.tasks.findFirst({
    where: and(
      eq(tasks.id, taskId),
      eq(tasks.userId, user.id),
      isNull(tasks.deletedAt),
    ),
  });
  if (!task) return;

  await db
    .update(tasks)
    .set({ status: nextStatus(task.status), updatedAt: new Date() })
    .where(eq(tasks.id, task.id));

  revalidatePath("/tasks");
}

/** Soft delete — sets deletedAt, never removes the row. */
export async function deleteTask(taskId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await db
    .update(tasks)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.userId, user.id),
        isNull(tasks.deletedAt),
      ),
    );

  revalidatePath("/tasks");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
