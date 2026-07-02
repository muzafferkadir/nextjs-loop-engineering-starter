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
