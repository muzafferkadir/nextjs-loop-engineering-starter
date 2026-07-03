import { describe, expect, it } from "vitest";
import {
  nextStatus,
  priorityLabel,
  statusBadgeVariant,
  statusLabel,
  summarizeTasks,
} from "@/lib/tasks";

describe("nextStatus", () => {
  it("cycles todo → in_progress → done → todo", () => {
    expect(nextStatus("todo")).toBe("in_progress");
    expect(nextStatus("in_progress")).toBe("done");
    expect(nextStatus("done")).toBe("todo");
  });
});

describe("statusLabel", () => {
  it("returns human-readable labels", () => {
    expect(statusLabel("todo")).toBe("To do");
    expect(statusLabel("in_progress")).toBe("In progress");
    expect(statusLabel("done")).toBe("Done");
  });
});

describe("priorityLabel", () => {
  it("returns human-readable labels", () => {
    expect(priorityLabel("low")).toBe("Low");
    expect(priorityLabel("medium")).toBe("Medium");
    expect(priorityLabel("high")).toBe("High");
  });
});

describe("statusBadgeVariant", () => {
  it("maps each status to a distinct badge variant", () => {
    const variants = new Set([
      statusBadgeVariant("todo"),
      statusBadgeVariant("in_progress"),
      statusBadgeVariant("done"),
    ]);
    expect(variants.size).toBe(3);
  });
});

describe("summarizeTasks", () => {
  it("counts total tasks and groups them by status", () => {
    expect(
      summarizeTasks([
        { status: "todo" },
        { status: "in_progress" },
        { status: "done" },
        { status: "done" },
      ]),
    ).toEqual({
      total: 4,
      byStatus: {
        todo: 1,
        in_progress: 1,
        done: 2,
      },
    });
  });

  it("returns zero counts for an empty task list", () => {
    expect(summarizeTasks([])).toEqual({
      total: 0,
      byStatus: {
        todo: 0,
        in_progress: 0,
        done: 0,
      },
    });
  });
});
