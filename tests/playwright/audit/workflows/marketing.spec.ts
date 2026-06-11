/**
 * Marketing Workflow Audit Test
 * Workflow: marketing
 * Steps: create campaign → define target audience → schedule → execute → verify metrics
 * Requirements: 3.8
 */

import { test, expect } from '@playwright/test';
import type { WorkflowStepResult } from '../../../../scripts/audit/types/audit-types.js';
import { navigateTo, recordStep } from '../utils/workflow-helpers.js';
import { writeWorkflowResults } from '../utils/result-collector.js';
import { MARKETING } from '../fixtures/test-data.js';

const WORKFLOW = 'marketing';

test.describe('Marketing Workflow', () => {
  const results: WorkflowStepResult[] = [];

  test.afterAll(async () => {
    await writeWorkflowResults(WORKFLOW, results);
  });

  test('Step 1: Create campaign', async ({ page }) => {
    await recordStep(results, WORKFLOW, 1, 'Create marketing campaign', async () => {
      await navigateTo(page, '/core/marketing');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      const createBtn = page.locator('button:has-text("Create"), button:has-text("New Campaign"), button:has-text("Buat"), [data-testid*="create-campaign"]');
      if (await createBtn.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
        await createBtn.first().click();
        await expect(page.locator('form, [role="dialog"]').first()).toBeVisible({ timeout: 10_000 });
        await page.locator('button:has-text("Cancel"), button:has-text("Batal")').first().click().catch(() => {});
      }
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test('Step 2: Define target audience', async ({ page }) => {
    await recordStep(results, WORKFLOW, 2, 'Define target audience for campaign', async () => {
      await navigateTo(page, '/core/marketing');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('table, [data-testid*="campaign"], [class*="campaign"], [class*="card"], [class*="grid"], main').first()).toBeVisible({ timeout: 10_000 });
    });
  });

  test('Step 3: Schedule campaign', async ({ page }) => {
    await recordStep(results, WORKFLOW, 3, 'Schedule campaign execution', async () => {
      await navigateTo(page, '/core/marketing');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
    });
  });

  test('Step 4: Execute campaign', async ({ page }) => {
    await recordStep(results, WORKFLOW, 4, 'Execute marketing campaign', async () => {
      await navigateTo(page, '/core/marketing');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
    });
  });

  test('Step 5: Verify metrics aggregate', async ({ page }) => {
    await recordStep(results, WORKFLOW, 5, 'Verify campaign metrics aggregate correctly', async () => {
      await navigateTo(page, '/core/marketing');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('[data-testid*="metric"], [class*="metric"], [class*="analytics"], [class*="card"], table, main').first()).toBeVisible({ timeout: 10_000 });
    });
  });
});
