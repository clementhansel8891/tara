import { test as setup, expect } from '@playwright/test';

const authFile = 'tests/playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  console.log('Starting Authentication Setup — using direct login with known credentials...');
  
  // Use existing demo user credentials
  const email = 'hansel@zenvix.id';
  const password = 'hansel8891';

  console.log(`Logging in as: ${email}`);

  // Navigate to login page
  await page.goto('/auth/login');
  await page.waitForLoadState('domcontentloaded');

  // Fill credentials
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  console.log('Waiting for dashboard...');
  await page.waitForURL('**/core/dashboard', { timeout: 30000 });
  
  // Save Session State
  await page.context().storageState({ path: authFile });
  console.log(`Auth setup complete. Session saved to ${authFile}`);
});
