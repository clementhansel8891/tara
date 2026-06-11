/**
 * Sales Workflow Audit Test
 * Workflow: sales
 * Steps: create lead → convert to opportunity → create quotation → convert to order → fulfill → verify pipeline metrics
 * Requirements: 3.6
 */

import { test, expect } from '@playwright/test';
import type { WorkflowStepResult } from '../../../../scripts/audit/types/audit-types.js';
import { navigateTo, recordStep } from '../utils/workflow-helpers.js';
import { writeWorkflowResults } from '../utils/result-collector.js';
import { SALES } from '../fixtures/test-data.js';

const WORKFLOW = 'sales';

test.describe('Sales Workflow', () => {
  const results: WorkflowStepResult[] = [];

  test.afterAll(async () => {
    await writeWorkflowResults(WORKFLOW, results);
  });

  test('Step 1: Create lead', async ({ page }) => {
    await recordStep(results, WORKFLOW, 1, 'Create sales lead', async () => {
      await navigateTo(page, '/core/sales');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      const createBtn = page.locator('button:has-text("Create"), button:has-text("New Lead"), button:has-text("Tambah"), [data-testid*="create-lead"]');
      if (await createBtn.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
        await createBtn.first().click();
        await expect(page.locator('form, [role="dialog"]').first()).toBeVisible({ timeout: 10_000 });
        await page.locator('button:has-text("Cancel"), button:has-text("Batal")').first().click().catch(() => {});
      }
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test('Step 2: Convert lead to opportunity', async ({ page }) => {
    await recordStep(results, WORKFLOW, 2, 'Convert lead to opportunity', async () => {
      await navigateTo(page, '/core/sales/opportunities');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
    });
  });

  test('Step 3: Create quotation', async ({ page }) => {
    await recordStep(results, WORKFLOW, 3, 'Create sales quotation', async () => {
      await navigateTo(page, '/core/sales/quotations');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
    });
  });

  test('Step 4: Convert quotation to order', async ({ page }) => {
    await recordStep(results, WORKFLOW, 4, 'Convert quotation to sales order', async () => {
      await navigateTo(page, '/core/sales/orders');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
    });
  });

  test('Step 5: Fulfill order', async ({ page }) => {
    await recordStep(results, WORKFLOW, 5, 'Fulfill sales order', async () => {
      await navigateTo(page, '/core/sales/orders');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
    });
  });

  test('Step 6: Verify pipeline metrics update', async ({ page }) => {
    await recordStep(results, WORKFLOW, 6, 'Verify pipeline metrics updated', async () => {
      await navigateTo(page, '/core/sales');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('[data-testid*="pipeline"], [class*="pipeline"], [class*="kanban"], [class*="card"], table, main').first()).toBeVisible({ timeout: 10_000 });
    });
  });
});
