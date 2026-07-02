/**
 * Deterministic seed — fixed IDs, fixed dates, fixed credentials.
 *
 * E2E tests and the ui-verify skill rely on this data being identical on
 * every run. Do not introduce randomness (faker, Date.now, Math.random)
 * here: non-deterministic seeds make e2e failures unreproducible, which
 * sends autonomous fix loops chasing ghosts.
 *
 * Demo login: demo@example.com / password123
 */
import bcrypt from "bcryptjs";
import { db } from "./client";
import { sessions, tasks, users } from "./schema";

async function seed() {
  await db.delete(sessions);
  await db.delete(tasks);
  await db.delete(users);

  await db.insert(users).values({
    id: "user-demo",
    email: "demo@example.com",
    name: "Demo User",
    passwordHash: bcrypt.hashSync("password123", 10),
    createdAt: new Date("2026-01-01T00:00:00Z"),
  });

  await db.insert(tasks).values([
    {
      id: "task-001",
      userId: "user-demo",
      title: "Read AGENTS.md and LOOP.md",
      description: "Understand the loop configuration before changing anything.",
      status: "done",
      priority: "high",
      createdAt: new Date("2026-01-01T09:00:00Z"),
      updatedAt: new Date("2026-01-01T10:00:00Z"),
    },
    {
      id: "task-002",
      userId: "user-demo",
      title: "Run the first L1 triage",
      description: "Report only — no code changes in week one.",
      status: "in_progress",
      priority: "high",
      createdAt: new Date("2026-01-02T09:00:00Z"),
      updatedAt: new Date("2026-01-02T09:30:00Z"),
    },
    {
      id: "task-003",
      userId: "user-demo",
      title: "Replace the example backlog in FEATURES.md",
      description: "Swap the demo features for your own product ideas.",
      status: "todo",
      priority: "medium",
      createdAt: new Date("2026-01-03T09:00:00Z"),
      updatedAt: new Date("2026-01-03T09:00:00Z"),
    },
  ]);

  console.log("Seeded: 1 user (demo@example.com / password123), 3 tasks");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
