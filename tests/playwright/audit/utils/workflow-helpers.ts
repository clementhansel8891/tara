/**
 * workflow-helpers.ts
 *
 * Shared Playwright helpers used by every audit workflow spec.
 * Keeps navigation, form interaction, assertion, and step-recording
 * logic in one place so individual workflow files stay concise.
 */

import { type Page, type Request, expect } from '@playwright/test';
import type { WorkflowStepResult } from '../../../../scripts/audit/types/audit-types.js';

// ─── Navigation ───────────────────────────────────────────────────────────────

/**
 * Navigate to `path` (relative to the configured base URL) and wait for the
 * DOM to be fully loaded before continuing.
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 40_000 });
  // Give the React tree a moment to hydrate after navigation
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {
    // networkidle can time-out on pages with long-polling; that's acceptable
  });
}

// ─── Form interaction ─────────────────────────────────────────────────────────

/**
 * Fill multiple form fields by their label text or `name`/`id` selector, then
 * optionally click a submit button.
 *
 * @param fields          Map of `{ selectorOrLabel: value }`.
 *                        Selectors starting with `#`, `.`, `[`, or `>` are used
 *                        as-is; all other strings are treated as the visible
 *                        label text and resolved via `getByLabel`.
 * @param submitSelector  Optional CSS selector for the submit button.
 *                        Defaults to `'button[type="submit"]'` when omitted.
 */
export async function fillAndSubmit(
  page: Page,
  fields: Record<string, string>,
  submitSelector = 'button[type="submit"]',
): Promise<void> {
  for (const [selector, value] of Object.entries(fields)) {
    const isExplicitSelector = /^[#.\[>]/.test(selector);
    const locator = isExplicitSelector
      ? page.locator(selector)
      : page.getByLabel(selector, { exact: false });
    await locator.fill(value);
  }

  if (submitSelector) {
    await page.locator(submitSelector).click();
  }
}

// ─── Toast assertion ──────────────────────────────────────────────────────────

/**
 * Wait for a toast/snack notification to appear.
 *
 * The app uses `sonner` which renders toasts inside `[data-sonner-toast]`.
 * Falls back to a generic `[role="status"]` or `[data-testid*="toast"]` if the
 * Sonner attribute is not found.
 *
 * @param messagePattern  Optional string or regex that the toast text must match.
 */
export async function assertToast(
  page: Page,
  messagePattern?: string | RegExp,
): Promise<void> {
  const toastLocator = page.locator(
    '[data-sonner-toast], [role="status"], [data-testid*="toast"]',
  );

  await expect(toastLocator.first()).toBeVisible({ timeout: 10_000 });

  if (messagePattern !== undefined) {
    const text = await toastLocator.first().innerText();
    if (typeof messagePattern === 'string') {
      expect(text.toLowerCase()).toContain(messagePattern.toLowerCase());
    } else {
      expect(messagePattern.test(text)).toBe(true);
    }
  }
}

// ─── API call assertion ───────────────────────────────────────────────────────

/**
 * Set up a request intercept, trigger the action that fires the API call, and
 * return the intercepted `Request` object.
 *
 * Because this function *waits* for the next matching request, it should be
 * called before the action that triggers the request:
 *
 * ```ts
 * const req = await assertApiCall(page, /\/api\/retail\/shift/, async () => {
 *   await page.click('#open-shift-btn');
 * });
 * ```
 *
 * @param urlPattern  String (substring match) or RegExp to match against the
 *                    full request URL.
 */
export async function assertApiCall(
  page: Page,
  urlPattern: string | RegExp,
): Promise<Request> {
  const request = await page.waitForRequest(
    (req) => {
      const url = req.url();
      return typeof urlPattern === 'string'
        ? url.includes(urlPattern)
        : urlPattern.test(url);
    },
    { timeout: 15_000 },
  );
  return request;
}

// ─── Step recording ───────────────────────────────────────────────────────────

/**
 * Wrap an async workflow step function so that its pass/fail status and
 * duration are recorded in the `results` array.
 *
 * On failure the error is re-thrown after being recorded, which causes the
 * Playwright test to fail with the original error message.
 *
 * @param results      The mutable array that collects `WorkflowStepResult` objects.
 * @param workflow     The workflow identifier (e.g. `'retail-pos'`).
 * @param step         Sequential step number (1-based).
 * @param description  Human-readable step description.
 * @param fn           Async function containing the step's Playwright actions.
 */
export async function recordStep(
  results: WorkflowStepResult[],
  workflow: string,
  step: number,
  description: string,
  fn: () => Promise<void>,
): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    results.push({
      workflow,
      step,
      description,
      status: 'pass',
      duration: Date.now() - start,
    });
    console.log(`  ✔  [${workflow}] Step ${step}: ${description}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    results.push({
      workflow,
      step,
      description,
      status: 'fail',
      errorMessage,
      failurePoint: description,
      remediationNote: `Review the "${description}" step in workflow "${workflow}"`,
      duration: Date.now() - start,
    });
    console.error(`  ✖  [${workflow}] Step ${step}: ${description}\n     ${errorMessage}`);
    throw err;
  }
}
