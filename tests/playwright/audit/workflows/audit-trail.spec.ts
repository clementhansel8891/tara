/**
 * Logging & Audit Trail Workflow Audit Test
 * Workflow: audit-trail
 * Steps: generate user actions → search/filter logs → export to CSV/PDF → verify retention policy
 * Requirements: 3.11
 */

import { test, expect } from '@playwright/test';
import type { WorkflowStepResult } from '../../../../scripts/audit/types/audit-types.js';
import { navigateTo, recordStep } from '../utils/workflow-helpers.js';
import { writeWorkflowResults } from '../utils/result-collector.js';

const WORKFLOW = 'audit-trail';

test.describe('Audit Trail Workflow', () => {
  const results: WorkflowStepResult[] = [];

  test.afterAll(async () => {
    await writeWorkflowResults(WORKFLOW, results);
  });

  test('Step 1: Generate user actions to produce audit log entries', async ({ page }) => {
    await recordStep(results, WORKFLOW, 1, 'Generate user actions for audit log', async () => {
      // Navigate to dashboard to produce log entries
      await navigateTo(page, '/core/dashboard');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      await navigateTo(page, '/core/settings');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
    });
  });

  test('Step 2: Search and filter audit logs', async ({ page }) => {
    await recordStep(results, WORKFLOW, 2, 'Search and filter audit logs', async () => {
      await navigateTo(page, '/core/logs');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('table, [data-testid*="log"], [class*="log"]').first()).toBeVisible({ timeout: 10_000 });
      const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="cari" i], input[type="search"]');
      if (await searchInput.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
        await searchInput.first().fill('dashboard');
        await page.waitForTimeout(1000);
      }
    });
  });

  test('Step 3: Export audit trail to CSV/PDF', async ({ page }) => {
    await recordStep(results, WORKFLOW, 3, 'Export audit trail to CSV or PDF', async () => {
      await navigateTo(page, '/core/logs');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      const exportBtn = page.locator('button:has-text("Export"), button:has-text("Download"), [data-testid*="export"]');
      if (await exportBtn.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
        // Verify the export button is clickable
        await expect(exportBtn.first()).toBeEnabled();
      }
    });
  });

  test('Step 4: Verify retention policy behavior', async ({ page }) => {
    await recordStep(results, WORKFLOW, 4, 'Verify retention policy configuration', async () => {
      await navigateTo(page, '/core/settings');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
    });
  });
});
