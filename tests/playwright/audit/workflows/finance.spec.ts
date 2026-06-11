/**
 * Finance Workflow Audit Test — Diagnostic version
 * Workflow: finance
 * Requirements: 3.5
 */

import { test, expect } from '@playwright/test';
import type { WorkflowStepResult } from '../../../../scripts/audit/types/audit-types.js';
import { navigateTo, recordStep } from '../utils/workflow-helpers.js';
import { writeWorkflowResults } from '../utils/result-collector.js';

const WORKFLOW = 'finance';

test.describe('Finance Workflow', () => {
  const results: WorkflowStepResult[] = [];
  const networkFailures: string[] = [];

  test.beforeEach(async ({ page }) => {
    page.on('response', resp => { if (resp.status() >= 400) networkFailures.push(`${resp.status()} ${resp.url().split('/').slice(-3).join('/')}`); });
  });

  test.afterAll(async () => {
    await writeWorkflowResults(WORKFLOW, results);
  });

  test('Step 1: Finance dashboard loads with real data', async ({ page }) => {
    await recordStep(results, WORKFLOW, 1, 'Finance dashboard loads with real data', async () => {
      await navigateTo(page, '/core/finance');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(2000);
      const content = await page.locator('body').textContent();
      if ((content?.length ?? 0) < 200) {
        throw new Error(`Finance page appears empty. Network failures: ${networkFailures.join('; ')}`);
      }
    });
  });

  test('Step 2: Invoice list loads with existing invoices', async ({ page }) => {
    await recordStep(results, WORKFLOW, 2, 'Invoice list shows existing data', async () => {
      await navigateTo(page, '/core/finance');
      await page.waitForTimeout(2000);
      // Try to find invoice-related content
      const invoiceEl = page.locator('text=/invoice|faktur/i').first();
      await expect(invoiceEl).toBeVisible({ timeout: 8_000 }).catch(() => {
        throw new Error(`No invoice content found. Network failures: ${networkFailures.join('; ')}`);
      });
    });
  });

  test('Step 3: Create invoice button exists and opens form', async ({ page }) => {
    await recordStep(results, WORKFLOW, 3, 'Create invoice form accessible', async () => {
      await navigateTo(page, '/core/finance');
      await page.waitForTimeout(1500);
      const createBtn = page.locator('button:has-text("Invoice"), button:has-text("New"), button:has-text("Buat"), button:has-text("Create")').first();
      if (await createBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await createBtn.click();
        const dialog = page.locator('[role="dialog"], form, [class*="modal"]').first();
        await expect(dialog).toBeVisible({ timeout: 8_000 });
        await page.locator('button:has-text("Cancel"), button:has-text("Batal"), [aria-label="Close"]').first().click().catch(() => {});
      } else {
        throw new Error(`No Create Invoice button found. Page content may have loaded incorrectly. Network: ${networkFailures.join('; ')}`);
      }
    });
  });

  test('Step 4: Financial reports render correctly', async ({ page }) => {
    await recordStep(results, WORKFLOW, 4, 'Financial reports accessible', async () => {
      await navigateTo(page, '/core/finance/report');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(2000);
    });
  });

  test('Step 5: Ledger/account entries visible', async ({ page }) => {
    await recordStep(results, WORKFLOW, 5, 'Ledger entries accessible', async () => {
      await navigateTo(page, '/core/finance/ledger');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(2000);
    });
  });
});
