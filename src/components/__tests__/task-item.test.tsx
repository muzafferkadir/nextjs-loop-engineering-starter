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
});
