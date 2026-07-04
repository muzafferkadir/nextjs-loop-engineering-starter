import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("shows the seeded tasks", async ({ page }) => {
  await expect(page.getByTestId("task-task-001")).toBeVisible();
  await expect(page.getByTestId("task-task-002")).toBeVisible();
  await expect(page.getByTestId("task-task-003")).toBeVisible();
});

test("creates a task and shows it in the list", async ({ page }) => {
  await page.getByLabel("Task title").fill("Task created by e2e");
  await page.getByLabel("Priority", { exact: true }).selectOption("high");
  await page.getByRole("button", { name: "Add" }).click();

  const item = page.locator("li", { hasText: "Task created by e2e" });
  await expect(item).toBeVisible();
  await expect(item.getByText("To do")).toBeVisible();
  await expect(item.getByText("High")).toBeVisible();
});

test("creates a task with a due date and shows it in the list", async ({
  page,
}) => {
  await page.getByLabel("Task title").fill("Task with a due date");
  await page.getByLabel("Due date").fill("2099-01-01");
  await page.getByRole("button", { name: "Add" }).click();

  const item = page.locator("li", { hasText: "Task with a due date" });
  await expect(item).toBeVisible();
  await expect(item.getByText("Jan 1, 2099")).toBeVisible();
});

test("shows an overdue due date for an unfinished seeded task", async ({
  page,
}) => {
  const item = page.getByTestId("task-task-002");
  await expect(item.getByText("Jan 1, 2026")).toBeVisible();
});

test("filters the task list by status", async ({ page }) => {
  await page.getByLabel("Filter by status").selectOption("done");

  await expect(page).toHaveURL(/status=done/);
  await expect(page.getByTestId("task-task-001")).toBeVisible();
  await expect(page.getByTestId("task-task-002")).toHaveCount(0);
  await expect(page.getByTestId("task-task-003")).toHaveCount(0);
});

test("filters the task list by priority", async ({ page }) => {
  await page.getByLabel("Filter by priority").selectOption("high");

  await expect(page).toHaveURL(/priority=high/);
  await expect(page.getByTestId("task-task-001")).toBeVisible();
  await expect(page.getByTestId("task-task-002")).toBeVisible();
  await expect(page.getByTestId("task-task-003")).toHaveCount(0);
});

test("combines status and priority filters", async ({ page }) => {
  await page.getByLabel("Filter by status").selectOption("in_progress");
  await page.getByLabel("Filter by priority").selectOption("high");

  await expect(page.getByTestId("task-task-002")).toBeVisible();
  await expect(page.getByTestId("task-task-001")).toHaveCount(0);
  await expect(page.getByTestId("task-task-003")).toHaveCount(0);
});

test("shows a distinct empty state when filters match no tasks", async ({
  page,
}) => {
  // No seeded or e2e-created task uses "low" priority.
  await page.getByLabel("Filter by priority").selectOption("low");

  await expect(page.getByText("No tasks match your filters.")).toBeVisible();
});

test("advances a task through the status cycle", async ({ page }) => {
  const item = page.getByTestId("task-task-003");
  await expect(item.getByText("To do")).toBeVisible();

  await item.getByRole("button", { name: /advance status/i }).click();
  await expect(item.getByText("In progress")).toBeVisible();

  await item.getByRole("button", { name: /advance status/i }).click();
  await expect(item.getByText("Done")).toBeVisible();
});

test("deletes a task", async ({ page }) => {
  const item = page.getByTestId("task-task-001");
  await expect(item).toBeVisible();
  await item.getByRole("button", { name: /^delete/i }).click();
  await expect(item).toHaveCount(0);
});
