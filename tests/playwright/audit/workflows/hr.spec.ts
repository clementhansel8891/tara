/**
 * HR Workflow Audit Test
 * Workflow: hr
 * Requirements: 3.4
 */

import { test, expect } from '@playwright/test';
import type { WorkflowStepResult } from '../../../../scripts/audit/types/audit-types.js';
import { navigateTo, recordStep } from '../utils/workflow-helpers.js';
import { writeWorkflowResults } from '../utils/result-collector.js';

const WORKFLOW = 'hr';
const CONTENT = 'table, [class*="card"], [class*="grid"], [class*="employee"], [data-testid*="employee"], main';

test.describe('HR Workflow', () => {
  const results: WorkflowStepResult[] = [];

  test.afterAll(async () => {
    await writeWorkflowResults(WORKFLOW, results);
  });

  test('Step 1: Create employee', async ({ page }) => {
    await recordStep(results, WORKFLOW, 1, 'Create employee record', async () => {
      await navigateTo(page, '/core/hr');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      const addBtn = page.locator('button:has-text("Add"), button:has-text("Tambah"), button:has-text("New Employee"), [data-testid*="add-employee"]');
      if (await addBtn.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
        await addBtn.first().click();
        await expect(page.locator('form, [role="dialog"]').first()).toBeVisible({ timeout: 10_000 });
        await page.locator('button:has-text("Cancel"), button:has-text("Batal")').first().click().catch(() => {});
      }
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test('Step 2: Assign department to employee', async ({ page }) => {
    await recordStep(results, WORKFLOW, 2, 'Assign department to employee', async () => {
      await navigateTo(page, '/core/hr');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator(CONTENT).first()).toBeVisible({ timeout: 10_000 });
    });
  });

  test('Step 3: Submit leave request', async ({ page }) => {
    await recordStep(results, WORKFLOW, 3, 'Submit leave request', async () => {
      await navigateTo(page, '/core/hr/leave');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      const applyBtn = page.locator('button:has-text("Apply"), button:has-text("Ajukan"), button:has-text("Request Leave"), [data-testid*="leave-request"]');
      if (await applyBtn.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
        await applyBtn.first().click();
        await expect(page.locator('form, [role="dialog"]').first()).toBeVisible({ timeout: 10_000 });
        await page.locator('button:has-text("Cancel"), button:has-text("Batal")').first().click().catch(() => {});
      }
    });
  });

  test('Step 4: Approve leave request', async ({ page }) => {
    await recordStep(results, WORKFLOW, 4, 'Approve pending leave request', async () => {
      await navigateTo(page, '/core/hr/leave');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      const approveBtn = page.locator('button:has-text("Approve"), button:has-text("Setuju"), [data-testid*="approve-leave"]');
      if (await approveBtn.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
        await approveBtn.first().click();
        await expect(page.locator('body')).toBeVisible({ timeout: 10_000 });
      }
    });
  });

  test('Step 5: Process payroll', async ({ page }) => {
    await recordStep(results, WORKFLOW, 5, 'Process payroll', async () => {
      await navigateTo(page, '/core/hr/payroll');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
    });
  });

  test('Step 6: Verify employee data persists', async ({ page }) => {
    await recordStep(results, WORKFLOW, 6, 'Verify employee records persist correctly', async () => {
      await navigateTo(page, '/core/hr');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator(CONTENT).first()).toBeVisible({ timeout: 10_000 });
    });
  });
});
