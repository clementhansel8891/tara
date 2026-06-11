import { test as setup, expect } from '@playwright/test';

const authFile = 'tests/playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  console.log('Starting Authentication Setup — using direct login with known credentials...');
  
  // Use existing demo user credentials
  const email = 'bambusilverkedonganan@gmail.com';
  const password = 'estella1234';

  console.log(`Logging in as: ${email}`);

  // Navigate to login page
  await page.goto('/auth/login');
  await page.waitForLoadState('domcontentloaded');

  // Fill credentials
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Wait briefly for any validation
  await page.waitForTimeout(500);
  await page.click('button[type="submit"]');

  // Wait for redirect away from login page — remote server may be slow
  console.log('Waiting for post-login redirect...');
  await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 60000 });
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

  // Also handle potential onboarding or tenant-selection screens
  const currentUrl = page.url();
  console.log(`Redirected to: ${currentUrl}`);
  if (currentUrl.includes('/auth/') || currentUrl.includes('/onboard')) {
    // May need to select tenant or complete setup
    await page.waitForTimeout(3000);
  }
  
  // Save Session State
  await page.context().storageState({ path: authFile });
  console.log(`Auth setup complete. Session saved to ${authFile}`);
});
