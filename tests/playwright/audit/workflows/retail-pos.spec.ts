/**
 * Retail POS Workflow Audit Test
 * Workflow: retail-pos
 * Requirements: 3.1
 *
 * Tests actual POS functionality with rich data account.
 * Records specific failures so we know what's broken.
 */

import { test, expect } from '@playwright/test';
import type { WorkflowStepResult } from '../../../../scripts/audit/types/audit-types.js';
import { navigateTo, recordStep } from '../utils/workflow-helpers.js';
import { writeWorkflowResults } from '../utils/result-collector.js';

const WORKFLOW = 'retail-pos';

test.describe('Retail POS Workflow', () => {
  const results: WorkflowStepResult[] = [];
  const consoleErrors: string[] = [];
  const networkFailures: string[] = [];

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('response', resp => { if (resp.status() >= 400) networkFailures.push(`${resp.status()} ${resp.url()}`); });
  });

  test.afterAll(async () => {
    await writeWorkflowResults(WORKFLOW, results);
  });

  test('Step 1: POS page loads and shift management visible', async ({ page }) => {
    await recordStep(results, WORKFLOW, 1, 'POS page loads and shift management visible', async () => {
      await navigateTo(page, '/retail/pos');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      // Verify the POS interface actually renders (not just blank)
      const pageContent = await page.locator('body').textContent();
      expect(pageContent?.length ?? 0).toBeGreaterThan(100);
      // Look for shift-related UI
      const shiftEl = page.locator('text=/shift|kasir|pos|open|tutup/i').first();
      await expect(shiftEl).toBeVisible({ timeout: 10_000 });
    });
  });

  test('Step 2: Product catalog loads with real data', async ({ page }) => {
    await recordStep(results, WORKFLOW, 2, 'Product catalog loads with real data', async () => {
      await navigateTo(page, '/retail/pos');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      // Wait for products to load
      await page.waitForTimeout(2000);
      // Verify products exist (account has rich data)
      const productEls = page.locator('[class*="product"], [class*="item"], [class*="grid"] > div, [class*="card"]');
      const count = await productEls.count();
      if (count === 0) {
        throw new Error(`No products found in POS catalog. Console errors: ${consoleErrors.slice(0,3).join('; ')}`);
      }
      expect(count).toBeGreaterThan(0);
    });
  });

  test('Step 3: Add item to cart works', async ({ page }) => {
    await recordStep(results, WORKFLOW, 3, 'Add item to cart works', async () => {
      await navigateTo(page, '/retail/pos');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(2000);
      // Click first product
      const firstProduct = page.locator('[class*="product"], [class*="item-card"], [class*="ProductCard"], button[class*="product"]').first();
      if (await firstProduct.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await firstProduct.click();
        await page.waitForTimeout(500);
        // Cart should update
        const cartTotal = page.locator('[class*="cart"], [class*="total"], text=/Rp|IDR/').first();
        await expect(cartTotal).toBeVisible({ timeout: 5_000 }).catch(() => {
          throw new Error(`Cart did not update after adding product. Network failures: ${networkFailures.slice(0,3).join('; ')}`);
        });
      }
    });
  });

  test('Step 4: Payment flow accessible', async ({ page }) => {
    await recordStep(results, WORKFLOW, 4, 'Payment flow accessible', async () => {
      await navigateTo(page, '/retail/pos');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(1500);
      const payBtn = page.locator('button:has-text("Pay"), button:has-text("Bayar"), button:has-text("Checkout"), [class*="payment-btn"]').first();
      if (await payBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await payBtn.click();
        await expect(page.locator('[role="dialog"], [class*="modal"], [class*="payment"]').first()).toBeVisible({ timeout: 8_000 });
        await page.locator('button:has-text("Cancel"), button:has-text("Batal"), [aria-label="Close"]').first().click().catch(() => {});
      }
    });
  });

  test('Step 5: Shift history / report accessible', async ({ page }) => {
    await recordStep(results, WORKFLOW, 5, 'Shift history accessible', async () => {
      await navigateTo(page, '/retail/shift-report');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(2000);
      const content = await page.locator('body').textContent();
      if ((content?.length ?? 0) < 100) {
        throw new Error(`Shift report page appears empty. Network failures: ${networkFailures.slice(0,3).join('; ')}`);
      }
    });
  });

  test('Step 6: Sales history shows real transactions', async ({ page }) => {
    await recordStep(results, WORKFLOW, 6, 'Sales history shows real transactions', async () => {
      await navigateTo(page, '/retail/operational/sales/History');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(2000);
      const rows = page.locator('tr, [class*="row"], [class*="transaction"]');
      const count = await rows.count();
      if (count < 2) {
        throw new Error(`Sales history empty (${count} rows). Account should have rich data. Network: ${networkFailures.slice(0,3).join('; ')}`);
      }
    });
  });
});
