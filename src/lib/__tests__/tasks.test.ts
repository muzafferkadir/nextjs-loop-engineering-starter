import { describe, expect, it } from "vitest";
import {
  formatDueDate,
  isOverdue,
  nextStatus,
  parseTaskFilters,
  priorityLabel,
  statusBadgeVariant,
  statusLabel,
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

describe("isOverdue", () => {
  const now = new Date("2026-06-01T00:00:00Z");

  it("returns false when there is no due date", () => {
    expect(isOverdue(null, "todo", now)).toBe(false);
  });

  it("returns true for a past due date on a not-done task", () => {
    expect(isOverdue(new Date("2026-01-01T00:00:00Z"), "in_progress", now)).toBe(
      true,
    );
  });

  it("returns false for a future due date", () => {
    expect(isOverdue(new Date("2027-01-01T00:00:00Z"), "todo", now)).toBe(
      false,
    );
  });

  it("returns false for a done task even with a past due date", () => {
    expect(isOverdue(new Date("2026-01-01T00:00:00Z"), "done", now)).toBe(
      false,
    );
  });
});

describe("formatDueDate", () => {
  it("formats a date as a short, human-readable string in UTC", () => {
    expect(formatDueDate(new Date("2026-01-05T00:00:00Z"))).toBe(
      "Jan 5, 2026",
    );
  });
});

describe("parseTaskFilters", () => {
  it("returns undefined for both filters when no params are given", () => {
    expect(parseTaskFilters({})).toEqual({
      status: undefined,
      priority: undefined,
    });
  });

  it("parses a valid status and priority", () => {
    expect(
      parseTaskFilters({ status: "in_progress", priority: "high" }),
    ).toEqual({ status: "in_progress", priority: "high" });
  });

  it("treats unknown values as no filter", () => {
    expect(
      parseTaskFilters({ status: "archived", priority: "urgent" }),
    ).toEqual({ status: undefined, priority: undefined });
  });

  it("parses status and priority independently", () => {
    expect(parseTaskFilters({ status: "done" })).toEqual({
      status: "done",
      priority: undefined,
    });
    expect(parseTaskFilters({ priority: "low" })).toEqual({
      status: undefined,
      priority: "low",
    });
  });
});
