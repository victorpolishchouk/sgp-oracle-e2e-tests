import { test, expect } from '@playwright/test';

test.describe('SEC-004: Input Length Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=РЕЄСТРАЦІЯ');
  });

  test('@security @critical SEC-004-01: Nickname field should have maxlength=30', async ({ page }) => {
    const maxlength = await page.getAttribute('#regNick', 'maxlength');
    expect(maxlength, 'Nickname field must have maxlength=30').toBe('30');
  });

  test('@security @critical SEC-004-02: Email field should have maxlength=254', async ({ page }) => {
    const maxlength = await page.getAttribute('#regEmail', 'maxlength');
    expect(maxlength, 'Email field must have maxlength=254').toBe('254');
  });

  test('@security @critical SEC-004-03: Password field should have maxlength=128', async ({ page }) => {
    const maxlength = await page.getAttribute('#regPass', 'maxlength');
    expect(maxlength, 'Password field must have maxlength=128').toBe('128');
  });

  test('@security @critical SEC-004-04: Long nickname should be truncated', async ({ page }) => {
    const longString = 'A'.repeat(100);
    
    await page.fill('#regNick', longString);
    const actualValue = await page.inputValue('#regNick');
    
    expect(actualValue.length, 'Nickname should be truncated to 30 chars').toBeLessThanOrEqual(30);
  });

  test('@security @critical SEC-004-05: 270+ char DoS payload should be prevented', async ({ page }) => {
    const dosPayload = 'A'.repeat(270);
    
    await page.fill('#regNick', dosPayload);
    const actualValue = await page.inputValue('#regNick');
    
    expect(actualValue.length, 'DoS payload should be limited').toBeLessThanOrEqual(30);
  });
});
