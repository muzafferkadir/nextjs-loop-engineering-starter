import { describe, expect, it } from "vitest";
import {
  nextStatus,
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
