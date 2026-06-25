import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test("should render login page with branding", async ({ page }) => {
    await page.goto("/login");

    // Check page loads
    await expect(page).toHaveTitle("TARA");

    // Check branding elements
    await expect(page.locator("text=Selamat datang")).toBeVisible();
    await expect(page.locator("text=Masuk ke akun Anda untuk melanjutkan")).toBeVisible();

    // Check form elements exist
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toHaveText("Masuk");
  });

  test("should toggle password visibility", async ({ page }) => {
    await page.goto("/login");

    const passwordInput = page.locator('input[placeholder="••••••••"]');
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Click the eye toggle button
    await page.locator('button:has(svg)').filter({ has: page.locator('[class*="lucide"]') }).last().click();
    await expect(passwordInput).toHaveAttribute("type", "text");
  });

  test("should show error on empty submission", async ({ page }) => {
    await page.goto("/login");

    // HTML5 validation should prevent submission but let's fill partially
    await page.locator('input[type="email"]').fill("test@test.com");
    await page.locator('input[type="password"]').fill("short");
    await page.locator('button[type="submit"]').click();

    // Should show error since backend isn't running
    await expect(page.locator("text=Login gagal").or(page.locator('[class*="destructive"]'))).toBeVisible({ timeout: 5000 });
  });

  test("should have theme toggle", async ({ page }) => {
    await page.goto("/login");

    // Find theme toggle button (sun/moon icon)
    const themeToggle = page.locator('button[aria-label="Toggle theme"]');
    await expect(themeToggle).toBeVisible();

    // Click to toggle
    await themeToggle.click();

    // HTML should change class
    const html = page.locator("html");
    const classAfter = await html.getAttribute("class");
    expect(classAfter).toContain("light");
  });

  test("should redirect to login from root", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});
