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

test("shows the task summary above the list", async ({ page }) => {
  const summary = page.getByRole("region", { name: "Task summary" });

  await expect(summary).toBeVisible();
  await expect(summary.getByText("3")).toBeVisible();
  await expect(summary.getByText("To do")).toBeVisible();
  await expect(summary.getByText("In progress")).toBeVisible();
  await expect(summary.getByText("Done")).toBeVisible();
});

test("creates a task and shows it in the list", async ({ page }) => {
  await page.getByLabel("Task title").fill("Task created by e2e");
  await page.getByLabel("Priority").selectOption("high");
  await page.getByRole("button", { name: "Add" }).click();

  const item = page.locator("li", { hasText: "Task created by e2e" });
  await expect(item).toBeVisible();
  await expect(item.getByText("To do")).toBeVisible();
  await expect(item.getByText("High")).toBeVisible();
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

test("shows an empty-compatible summary when no tasks remain", async ({ page }) => {
  const items = page.getByRole("listitem");
  await expect(items.first()).toBeVisible();

  while ((await items.count()) > 0) {
    const countBeforeDelete = await items.count();
    await items.first().getByRole("button", { name: /^delete/i }).click();
    await expect(items).toHaveCount(countBeforeDelete - 1);
  }

  const summary = page.getByRole("region", { name: "Task summary" });
  await expect(summary.getByText("No active tasks yet")).toBeVisible();
  await expect(summary.getByText("0")).toHaveCount(4);
  await expect(page.getByText("No tasks yet. Add your first task above.")).toBeVisible();
});
