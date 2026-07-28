import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should load the homepage successfully", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);
  });

  test("should display hero content", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Next.js + Supabase");
  });

  test("should have navigation with auth links", async ({ page }) => {
    await page.goto("/");

    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: /login/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /sign up/i })).toBeVisible();
  });

  test("should display the features section", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("What's included")).toBeVisible();
  });

  test("should be responsive", async ({ page }) => {
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("Auth Pages", () => {
  test("should load login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("should load register page", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /create an account/i })).toBeVisible();
  });

  test("should load forgot password page", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /forgot password/i })).toBeVisible();
  });

  test("should navigate from login to register", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /sign up/i }).click();
    await expect(page).toHaveURL(/register/);
  });

  test("should navigate from login to forgot password", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /forgot.*password/i }).click();
    await expect(page).toHaveURL(/forgot-password/);
  });
});

test.describe("API Health", () => {
  test("healthcheck endpoint returns ok", async ({ request }) => {
    const response = await request.get("/api/healthcheck");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("ok");
  });
});
