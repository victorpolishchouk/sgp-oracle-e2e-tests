import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test('@accessibility A11Y-001: Page has proper lang attribute', async ({ page }) => {
    await page.goto('/');
    
    const htmlLang = await page.getAttribute('html', 'lang');
    expect(htmlLang).toBe('uk');
  });

  test('@accessibility A11Y-002: Form inputs have labels or aria-label', async ({ page }) => {
    await page.goto('/');
    
    const emailField = page.locator('#loginEmail');
    const ariaLabel = await emailField.getAttribute('aria-label');
    const placeholder = await emailField.getAttribute('placeholder');
    
    expect(ariaLabel || placeholder).toBeTruthy();
  });

  test('@accessibility A11Y-003: Buttons have accessible names', async ({ page }) => {
    await page.goto('/');
    
    const loginBtn = page.locator('#loginBtn');
    const btnText = await loginBtn.textContent();
    
    expect(btnText?.trim()).toBeTruthy();
  });

  test('@accessibility A11Y-004: Keyboard navigation works', async ({ page }) => {
    await page.goto('/');
    
    // Tab через поля
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => document.activeElement?.id);
    expect(['loginEmail', 'loginPass', 'loginBtn']).toContain(focusedElement);
  });
});
