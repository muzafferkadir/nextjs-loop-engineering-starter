import type { Page } from "@playwright/test";

export const DEMO_USER = {
  email: "demo@example.com",
  password: "password123",
  name: "Demo User",
};

export async function login(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(DEMO_USER.email);
  await page.getByLabel("Password").fill(DEMO_USER.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/tasks");
}
