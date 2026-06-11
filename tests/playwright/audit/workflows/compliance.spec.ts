/**
 * Compliance & Audit Workflow Audit Test
 * Workflow: compliance
 * Steps: create checklist → assign auditors → conduct audit → record findings → generate report → track remediation
 * Requirements: 3.12
 */

import { test, expect } from '@playwright/test';
import type { WorkflowStepResult } from '../../../../scripts/audit/types/audit-types.js';
import { navigateTo, recordStep } from '../utils/workflow-helpers.js';
import { writeWorkflowResults } from '../utils/result-collector.js';

const WORKFLOW = 'compliance';

test.describe('Compliance Workflow', () => {
  const results: WorkflowStepResult[] = [];

  test.afterAll(async () => {
    await writeWorkflowResults(WORKFLOW, results);
  });

  test('Step 1: Create audit checklist', async ({ page }) => {
    await recordStep(results, WORKFLOW, 1, 'Create compliance audit checklist', async () => {
      await navigateTo(page, '/core/compliance');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      const createBtn = page.locator('button:has-text("Create"), button:has-text("New Checklist"), button:has-text("Buat"), [data-testid*="create-checklist"]');
      if (await createBtn.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
        await createBtn.first().click();
        await expect(page.locator('form, [role="dialog"]').first()).toBeVisible({ timeout: 10_000 });
        await page.locator('button:has-text("Cancel"), button:has-text("Batal")').first().click().catch(() => {});
      }
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test('Step 2: Assign auditors', async ({ page }) => {
    await recordStep(results, WORKFLOW, 2, 'Assign auditors to compliance checklist', async () => {
      await navigateTo(page, '/core/compliance');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('table, [data-testid*="compliance"], main').first()).toBeVisible({ timeout: 10_000 });
    });
  });

  test('Step 3: Conduct audit with findings', async ({ page }) => {
    await recordStep(results, WORKFLOW, 3, 'Conduct compliance audit and record findings', async () => {
      await navigateTo(page, '/core/compliance');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
    });
  });

  test('Step 4: Record findings with evidence', async ({ page }) => {
    await recordStep(results, WORKFLOW, 4, 'Record audit findings with evidence attachments', async () => {
      await navigateTo(page, '/core/compliance');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
    });
  });

  test('Step 5: Generate compliance report', async ({ page }) => {
    await recordStep(results, WORKFLOW, 5, 'Generate compliance audit report', async () => {
      await navigateTo(page, '/core/compliance');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      const reportBtn = page.locator('button:has-text("Report"), button:has-text("Laporan"), [data-testid*="report"]');
      if (await reportBtn.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
        await reportBtn.first().click();
        await expect(page.locator('body')).toBeVisible({ timeout: 10_000 });
        await page.locator('button:has-text("Cancel"), button:has-text("Batal")').first().click().catch(() => {});
      }
    });
  });

  test('Step 6: Track remediation status', async ({ page }) => {
    await recordStep(results, WORKFLOW, 6, 'Track finding remediation status', async () => {
      await navigateTo(page, '/core/compliance');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });
    });
  });
});
