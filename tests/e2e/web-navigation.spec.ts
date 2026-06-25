import { test, expect } from "@playwright/test";

test.describe("Web Interface Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Set up API mocks before navigation
    await page.route("**/api/auth/me", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "test-id",
            email: "admin@tara.test",
            full_name: "Admin TARA",
            employee_code: "ADM-001",
            role: "HR_Admin",
            department: "Human Resources",
            language_preference: "id",
          },
        }),
      });
    });

    await page.route("**/api/**", (route) => {
      if (route.request().url().includes("/auth/me")) return route.continue();
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    // Set token and navigate
    await page.goto("/web");
    await page.evaluate(() => {
      localStorage.setItem("tara-token", "mock-test-token");
    });
    await page.reload();
  });

  test("should render web dashboard layout", async ({ page }) => {
    await page.goto("/web");

    // Sidebar should be visible on desktop
    await expect(page.locator("text=TARA")).toBeVisible();
    await expect(page.locator("text=HR System")).toBeVisible();

    // Navigation items
    await expect(page.locator('a[href="/web"]').filter({ hasText: "Dashboard" })).toBeVisible();
    await expect(page.locator('a[href="/web/employees"]')).toBeVisible();
    await expect(page.locator('a[href="/web/attendance"]')).toBeVisible();
    await expect(page.locator('a[href="/web/leaves"]')).toBeVisible();
    await expect(page.locator('a[href="/web/payroll"]')).toBeVisible();
    await expect(page.locator('a[href="/web/schedule"]')).toBeVisible();
    await expect(page.locator('a[href="/web/notifications"]')).toBeVisible();
    await expect(page.locator('a[href="/web/settings"]')).toBeVisible();
  });

  test("should navigate to employees page", async ({ page }) => {
    await page.goto("/web/employees");
    await expect(page.locator("h1")).toHaveText("Karyawan");
    await expect(page.locator("text=Kelola data karyawan")).toBeVisible();
    await expect(page.locator('input[placeholder*="Cari"]')).toBeVisible();
    await expect(page.locator("text=Tambah Karyawan")).toBeVisible();
  });

  test("should navigate to attendance page", async ({ page }) => {
    await page.goto("/web/attendance");
    await expect(page.locator("h1")).toHaveText("Kehadiran");
    await expect(page.locator("text=Pantau kehadiran karyawan")).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
  });

  test("should navigate to leave management page", async ({ page }) => {
    await page.goto("/web/leaves");
    await expect(page.locator("h1")).toHaveText("Manajemen Cuti");
  });

  test("should navigate to payroll page", async ({ page }) => {
    await page.goto("/web/payroll");
    await expect(page.locator("h1")).toHaveText("Penggajian");
  });

  test("should navigate to schedule page", async ({ page }) => {
    await page.goto("/web/schedule");
    await expect(page.locator("h1")).toContainText("Jadwal");
  });

  test("should navigate to notifications page", async ({ page }) => {
    await page.goto("/web/notifications");
    await expect(page.locator("h1")).toHaveText("Notifikasi");
  });

  test("should navigate to settings page", async ({ page }) => {
    await page.goto("/web/settings");
    await expect(page.locator("h1")).toHaveText("Pengaturan");
  });

  test("should show 404 for unknown routes", async ({ page }) => {
    await page.goto("/some-unknown-page");
    await expect(page.locator("text=404")).toBeVisible();
    await expect(page.locator("text=Halaman tidak ditemukan")).toBeVisible();
  });
});
