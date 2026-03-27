import { test, expect } from '@playwright/test';

test.describe('Login Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('@smoke AUTH-001: Login page loads correctly', async ({ page }) => {
    // Перевірка що основні елементи форми логіну присутні
    await expect(page.locator('text=УВІЙТИ')).toBeVisible();
    await expect(page.locator('#loginEmail')).toBeVisible();
    await expect(page.locator('#loginPass')).toBeVisible();
    await expect(page.locator('#loginBtn')).toBeVisible();
  });

  test('@regression AUTH-002: Empty login shows validation error', async ({ page }) => {
    await page.click('#loginBtn');
    
    // Очікуємо toast помилки
    const toast = page.locator('.toast.error, .toast');
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText(/email.*пароль|заповніть/i);
  });

  test('@regression AUTH-003: Invalid email format shows error', async ({ page }) => {
    await page.fill('#loginEmail', 'notanemail');
    await page.fill('#loginPass', 'anypassword');
    await page.click('#loginBtn');
    
    const toast = page.locator('.toast.error');
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText(/некоректний.*email|invalid/i);
  });

  test('@smoke AUTH-004: Valid credentials login succeeds', async ({ page }) => {
    const TEST_EMAIL = process.env.TEST_EMAIL || 'qa_test_playwright@example.com';
    const TEST_PASSWORD = process.env.TEST_PASSWORD || 'playwright123';

    await page.fill('#loginEmail', TEST_EMAIL);
    await page.fill('#loginPass', TEST_PASSWORD);
    await page.click('#loginBtn');

    // Перевірка успішного логіну
    await expect(page.locator('.user-pill')).toBeVisible({ timeout: 10000 });
  });

  test('@regression AUTH-005: Wrong credentials show generic error', async ({ page }) => {
    await page.fill('#loginEmail', 'wrong@example.com');
    await page.fill('#loginPass', 'wrongpassword');
    await page.click('#loginBtn');

    const toast = page.locator('.toast.error');
    await expect(toast).toBeVisible({ timeout: 5000 });
    // Generic error — не розкриває чи email чи password неправильний
    await expect(toast).toContainText(/невірний.*email.*або.*пароль|invalid/i);
  });
});
