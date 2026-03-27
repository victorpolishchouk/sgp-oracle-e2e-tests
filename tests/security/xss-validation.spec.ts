import { test, expect } from '@playwright/test';

test.describe('SEC-002: XSS Prevention Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=РЕЄСТРАЦІЯ');
    await page.waitForSelector('#regNick');
  });

  test('@security @critical SEC-002-01: Script tag in nickname should be rejected', async ({ page }) => {
    const xssPayload = "<script>alert('XSS')</script>";
    
    await page.fill('#regNick', xssPayload);
    await page.fill('#regEmail', `xss-test-${Date.now()}@qa.local`);
    await page.fill('#regPass', 'SecurePass123!');
    await page.fill('#regPass2', 'SecurePass123!');
    
    await page.click('#regBtn');
    
    // Має показати помилку валідації
    const errorVisible = await page.locator('.toast.error, .error-msg')
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    
    expect(errorVisible, 'XSS payload should be rejected').toBeTruthy();
  });

  test('@security @critical SEC-002-02: Image onerror XSS should be blocked', async ({ page }) => {
    const xssPayload = "<img src=x onerror=alert(document.cookie)>";
    
    await page.fill('#regNick', xssPayload);
    await page.fill('#regEmail', `xss-img-${Date.now()}@qa.local`);
    await page.fill('#regPass', 'SecurePass123!');
    await page.fill('#regPass2', 'SecurePass123!');
    
    await page.click('#regBtn');
    
    const errorVisible = await page.locator('.toast.error')
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    
    expect(errorVisible, 'IMG onerror XSS should be rejected').toBeTruthy();
  });

  test('@security @critical SEC-002-03: Valid Ukrainian nickname should be accepted', async ({ page }) => {
    const validNickname = 'Тестовий_Користувач';
    
    await page.fill('#regNick', validNickname);
    const storedValue = await page.inputValue('#regNick');
    
    expect(storedValue).toBe(validNickname);
  });

  test('@security SEC-002-04: XSS in email field should be blocked', async ({ page }) => {
    await page.click('text=УВІЙТИ'); // Переключитись на логін
    
    await page.fill('#loginEmail', "<script>alert('XSS')</script>");
    await page.fill('#loginPass', 'password');
    await page.click('#loginBtn');
    
    const toast = page.locator('.toast.error');
    await expect(toast).toContainText(/некоректний.*email|invalid/i);
  });
});
