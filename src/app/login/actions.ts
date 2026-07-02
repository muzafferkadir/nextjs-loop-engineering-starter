"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { createSession, verifyPassword } from "@/lib/auth";

export type AuthFormState = { error: string | null };

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function login(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
  });

  // Same error for unknown email and wrong password — don't leak which.
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return { error: "Invalid email or password" };
  }

  await createSession(user.id);
  redirect("/tasks");
}
