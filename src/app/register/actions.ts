"use server";

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { createSession, hashPassword } from "@/lib/auth";
import type { AuthFormState } from "@/app/login/actions";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function register(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
  });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const userId = randomUUID();
  await db.insert(users).values({
    id: userId,
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash: hashPassword(parsed.data.password),
  });

  await createSession(userId);
  redirect("/tasks");
}
