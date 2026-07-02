import { expect, test } from "@playwright/test";
import { DEMO_USER, login } from "./helpers";

test("redirects unauthenticated visitors to /login", async ({ page }) => {
  await page.goto("/tasks");
  await expect(page).toHaveURL(/\/login$/);
});

test("rejects invalid credentials with an error message", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(DEMO_USER.email);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  // Scope to the form: Next.js' route announcer also has role="alert".
  await expect(page.locator("form").getByRole("alert")).toHaveText(
    "Invalid email or password",
  );
  await expect(page).toHaveURL(/\/login$/);
});

test("signs in with the seeded demo user", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();
  await expect(page.getByText(`Signed in as ${DEMO_USER.name}`)).toBeVisible();
});

test("signs out and returns to /login", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("**/login");
  await page.goto("/tasks");
  await expect(page).toHaveURL(/\/login$/);
});
