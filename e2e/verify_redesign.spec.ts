
import { test, expect } from '@playwright/test';

test('Take screenshot of the redesigned page after login', async ({ page }) => {
  await page.goto('http://localhost:31339');

  // Login using environment variables
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error('Test email or password not set in environment variables.');
  }

  await page.waitForSelector('input[name="email"]');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for the main content to load after login
  await page.waitForSelector('h2:has-text("Monatsübersicht")');

  // Take screenshot
  await page.screenshot({ path: '/home/jules/verification/redesign_verification_loggedin.png', fullPage: true });
});
