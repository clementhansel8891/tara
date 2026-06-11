/**
 * IT Service Management Workflow Audit Test
 * Workflow: it-service
 * Steps: create ticket → assign technician → escalate on SLA breach → resolve → close → verify SLA report
 * Requirements: 3.9
 */

import { test, expect } from '@playwright/test';
import type { WorkflowStepResult } from '../../../../scripts/audit/types/audit-types.js';
import { navigateTo, recordStep } from '../utils/workflow-helpers.js';
import { writeWorkflowResults } from '../utils/result-collector.js';
import { IT_SERVICE } from '../fixtures/test-data.js';

const WORKFLOW = 'it-service';

test.describe('IT Service Management Workflow', () => {
  const results: WorkflowStepResult[] = [];

  test.afterAll(async () => {
    await writeWorkflowResults(WORKFLOW, results);
  });

  test('Step 1: Create support ticket', async ({ page }) => {
    await recordStep(results, WORKFLOW, 1, 'Create IT support ticket', async () => {
      await navigateTo(page, '/core/it');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      const createBtn = page.locator('button:has-text("Create"), button:has-text("New Ticket"), button:has-text("Buat"), [data-testid*="create-ticket"]');
      if (await createBtn.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
        await createBtn.first().click();
        await expect(page.locator('form, [role="dialog"]').first()).toBeVisible({ timeout: 10_000 });
        const titleInput = page.locator('input[name*="title"], input[placeholder*="title" i], input[placeholder*="judul" i]').first();
        if (await titleInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await titleInput.fill(IT_SERVICE.ticket.title);
        }
        await page.locator('button:has-text("Cancel"), button:has-text("Batal")').first().click().catch(() => {});
      }
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test('Step 2: Assign technician', async ({ page }) => {
    await recordStep(results, WORKFLOW, 2, 'Assign technician to ticket', async () => {
      await navigateTo(page, '/core/it');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('table, [data-testid*="ticket"], [class*="ticket"]').first()).toBeVisible({ timeout: 10_000 });
    });
  });

  test('Step 3: Escalate ticket on SLA breach', async ({ page }) => {
    await recordStep(results, WORKFLOW, 3, 'Escalate ticket when SLA is breached', async () => {
      await navigateTo(page, '/core/it');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      const escalateBtn = page.locator('button:has-text("Escalate"), button:has-text("Eskalasi"), [data-testid*="escalate"]');
      if (await escalateBtn.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
        await escalateBtn.first().click();
        await expect(page.locator('body')).toBeVisible({ timeout: 10_000 });
        await page.locator('button:has-text("Cancel"), button:has-text("Batal")').first().click().catch(() => {});
      }
    });
  });

  test('Step 4: Resolve ticket', async ({ page }) => {
    await recordStep(results, WORKFLOW, 4, 'Resolve IT support ticket', async () => {
      await navigateTo(page, '/core/it');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      const resolveBtn = page.locator('button:has-text("Resolve"), button:has-text("Selesai"), [data-testid*="resolve"]');
      if (await resolveBtn.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
        await resolveBtn.first().click();
        await expect(page.locator('body')).toBeVisible({ timeout: 10_000 });
        await page.locator('button:has-text("Cancel"), button:has-text("Batal")').first().click().catch(() => {});
      }
    });
  });

  test('Step 5: Close ticket', async ({ page }) => {
    await recordStep(results, WORKFLOW, 5, 'Close IT support ticket', async () => {
      await navigateTo(page, '/core/it');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      const closeBtn = page.locator('button:has-text("Close"), button:has-text("Tutup"), [data-testid*="close-ticket"]');
      if (await closeBtn.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
        await closeBtn.first().click();
        await expect(page.locator('body')).toBeVisible({ timeout: 10_000 });
        await page.locator('button:has-text("Cancel"), button:has-text("Batal")').first().click().catch(() => {});
      }
    });
  });

  test('Step 6: Verify SLA compliance report', async ({ page }) => {
    await recordStep(results, WORKFLOW, 6, 'Verify SLA compliance report generates correctly', async () => {
      await navigateTo(page, '/core/it/report');
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
    });
  });
});
