import { test, expect } from '@playwright/test';

test.describe('Critical Path Smoke Tests', () => {
  test('@smoke SMOKE-001: Application loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Перевірка ключових елементів
    await expect(page.locator('text=SGP')).toBeVisible();
    await expect(page.locator('text=Зроби прогноз')).toBeVisible();
  });

  test('@smoke SMOKE-002: SGP/SWC toggle works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Клік на SWC
    await page.click('#btnSWC');
    await page.waitForTimeout(500);
    
    // Має переключитись
    const swcActive = await page.locator('#btnSWC').getAttribute('class');
    expect(swcActive).toContain('active');
  });

  test('@smoke SMOKE-003: Race status banner is visible', async ({ page }) => {
    await page.goto('/');
    
    const banner = page.locator('.race-banner');
    await expect(banner).toBeVisible({ timeout: 10000 });
  });
});
