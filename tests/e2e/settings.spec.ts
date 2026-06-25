import { test, expect } from "@playwright/test";

test.describe("Settings Page Sections", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/auth/me", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { id: "test-id", email: "admin@tara.test", full_name: "Admin TARA", employee_code: "ADM-001", role: "HR_Admin", department: "HR", language_preference: "id" },
        }),
      });
    });

    await page.route("**/api/**", (route) => {
      if (route.request().url().includes("/auth/me")) return route.continue();
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [] }) });
    });

    await page.goto("/web/settings");
    await page.evaluate(() => {
      localStorage.setItem("tara-token", "mock-test-token");
    });
    await page.reload();
  });

  test("should show agent dashboard by default", async ({ page }) => {
    await expect(page.locator("text=Agen Otonom").first()).toBeVisible();
    await expect(page.locator("text=Leave Request Agent")).toBeVisible();
    await expect(page.locator("text=Absensi Agent")).toBeVisible();
    await expect(page.locator("text=Clock Confirmation Agent")).toBeVisible();
    await expect(page.locator("text=Weekly Checkin Agent")).toBeVisible();
    await expect(page.locator("text=Late Report Agent")).toBeVisible();
    await expect(page.locator("text=Onboarding Agent")).toBeVisible();
    await expect(page.locator("text=Saldo Cuti Agent")).toBeVisible();
  });

  test("should navigate to Organization section", async ({ page }) => {
    await page.getByRole("button", { name: "Organisasi" }).click();
    await expect(page.locator("text=Kantor / Cabang")).toBeVisible();
  });

  test("should navigate to User Access section", async ({ page }) => {
    await page.getByRole("button", { name: "Akun & Akses" }).click();
    await expect(page.locator("text=Akun & Akses Pengguna")).toBeVisible();
  });

  test("should navigate to Attendance section", async ({ page }) => {
    await page.getByRole("button", { name: /^Kehadiran$/ }).click();
    await expect(page.locator("text=Sumber Kehadiran")).toBeVisible();
  });

  test("should navigate to Notification Channels section", async ({ page }) => {
    await page.locator("nav button", { hasText: "Kanal Notifikasi" }).click();
    await expect(page.locator("text=WhatsApp Business").first()).toBeVisible();
  });

  test("should navigate to Hermes AI section", async ({ page }) => {
    await page.getByRole("button", { name: "Hermes AI" }).click();
    await expect(page.locator("text=Koneksi Hermes")).toBeVisible();
  });
});
