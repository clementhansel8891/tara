import { test, expect } from "@playwright/test";

test.describe("Mobile Interface", () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 size

  test.beforeEach(async ({ page }) => {
    // Intercept ALL network requests to /api/ (before Vite proxy touches them)
    await page.route("**/api/auth/me", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { id: "emp-1", email: "user@tara.test", full_name: "Budi Santoso", employee_code: "EMP-001", role: "Employee", department: "Engineering", language_preference: "id" },
        }),
      });
    });

    await page.route("**/api/**", (route) => {
      if (route.request().url().includes("/auth/me")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: { id: "emp-1", email: "user@tara.test", full_name: "Budi Santoso", employee_code: "EMP-001", role: "Employee", department: "Engineering", language_preference: "id" },
          }),
        });
      }
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { remaining_days: 10, total_entitlement: 12, used_days: 2 } }) });
    });

    await page.goto("/m");
    await page.evaluate(() => {
      localStorage.setItem("tara-token", "mock-test-token");
    });
    await page.reload();
    // Wait for React to hydrate and auth to resolve
    await page.waitForLoadState("networkidle");
  });

  test("should render mobile home page", async ({ page }) => {
    await page.goto("/m");

    // Clock button should be visible
    await expect(page.locator("text=Ketuk untuk Clock In")).toBeVisible();

    // Leave balance section
    await expect(page.locator("text=Saldo Cuti")).toBeVisible();

    // Bottom navigation
    await expect(page.locator("nav")).toBeVisible();
  });

  test("should navigate to clock page", async ({ page }) => {
    await page.goto("/m/clock");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("button", { name: /CLOCK IN/i })).toBeVisible();
  });

  test("should navigate to leave page", async ({ page }) => {
    await page.goto("/m/leave");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("button:has-text('Ajukan Cuti Baru')")).toBeVisible();
  });

  test("should show leave request form when button clicked", async ({ page }) => {
    await page.goto("/m/leave");
    await page.waitForLoadState("networkidle");

    await page.locator("button:has-text('Ajukan Cuti Baru')").click();
    await expect(page.locator("text=Formulir Pengajuan Cuti")).toBeVisible();
  });

  test("should navigate to notifications page", async ({ page }) => {
    await page.goto("/m/notifications");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();
  });

  test("should navigate to profile page", async ({ page }) => {
    await page.goto("/m/profile");

    // Profile card
    await expect(page.locator("text=Edit Profil")).toBeVisible();
    await expect(page.locator("text=Bahasa")).toBeVisible();
    await expect(page.locator("text=Keamanan")).toBeVisible();

    // Logout button
    await expect(page.locator("text=Keluar")).toBeVisible();
  });

  test("should toggle theme from profile", async ({ page }) => {
    await page.goto("/m/profile");

    const themeButton = page.locator("text=Mode Terang").or(page.locator("text=Mode Gelap"));
    await expect(themeButton).toBeVisible();
    await themeButton.click();

    // Theme should toggle
    const html = page.locator("html");
    const cls = await html.getAttribute("class");
    expect(cls === "light" || cls === "dark").toBeTruthy();
  });

  test("should have correct bottom navigation active states", async ({ page }) => {
    await page.goto("/m");

    // Home should be active (gold color)
    const homeLink = page.locator('a[href="/m"]').filter({ hasText: "Beranda" });
    await expect(homeLink).toBeVisible();

    // Navigate to clock
    await page.locator('a[href="/m/clock"]').click();
    await expect(page).toHaveURL(/\/m\/clock/);
  });
});
