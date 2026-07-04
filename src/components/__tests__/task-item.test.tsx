import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Task } from "@/db/schema";
import { TaskItem } from "@/components/task-item";

const baseTask: Task = {
  id: "task-test",
  userId: "user-demo",
  title: "Write a unit test",
  description: "Component render coverage",
  status: "in_progress",
  priority: "high",
  dueDate: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  deletedAt: null,
};

describe("TaskItem", () => {
  it("renders title, description, status and priority", () => {
    render(
      <ul>
        <TaskItem task={baseTask} />
      </ul>,
    );
    expect(screen.getByText("Write a unit test")).toBeTruthy();
    expect(screen.getByText("Component render coverage")).toBeTruthy();
    expect(screen.getByText("In progress")).toBeTruthy();
    expect(screen.getByText("High")).toBeTruthy();
  });

  it("exposes accessible action buttons", () => {
    render(
      <ul>
        <TaskItem task={baseTask} />
      </ul>,
    );
    expect(
      screen.getByRole("button", { name: /advance status of write a unit test/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /delete write a unit test/i }),
    ).toBeTruthy();
  });

  it("omits the description row when empty", () => {
    render(
      <ul>
        <TaskItem task={{ ...baseTask, description: null }} />
      </ul>,
    );
    expect(screen.queryByText("Component render coverage")).toBeNull();
  });

  it("omits the due date when unset", () => {
    render(
      <ul>
        <TaskItem task={baseTask} />
      </ul>,
    );
    expect(screen.queryByText(/2026/)).toBeNull();
  });

  it("marks a past-due, not-done task as overdue", () => {
    render(
      <ul>
        <TaskItem
          task={{
            ...baseTask,
            status: "in_progress",
            dueDate: new Date("2020-01-01T00:00:00Z"),
          }}
        />
      </ul>,
    );
    const dueDate = screen.getByText("Jan 1, 2020");
    expect(dueDate.className).toContain("text-destructive");
  });

  it("does not mark a done task as overdue even with a past due date", () => {
    render(
      <ul>
        <TaskItem
          task={{
            ...baseTask,
            status: "done",
            dueDate: new Date("2020-01-01T00:00:00Z"),
          }}
        />
      </ul>,
    );
    const dueDate = screen.getByText("Jan 1, 2020");
    expect(dueDate.className).not.toContain("text-destructive");
  });
});
