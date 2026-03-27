import { test as base } from '@playwright/test';
import { OraclePage } from '../pages/OraclePage';

/**
 * Розширений фікстюр — автоматично navigates на baseURL і надає OraclePage.
 */
export const test = base.extend<{ oracle: OraclePage }>({
  oracle: async ({ page }, use) => {
    const oracle = new OraclePage(page);
    await oracle.goto();
    await use(oracle);
  },
});

export { expect } from '@playwright/test';

// ── Тестовий акаунт у Firebase ───────────────────────────────────────────
// Акаунт має існувати у Firebase проекті sgp-oracle
export const TEST_USER = {
  email:    'qa_test_playwright@example.com',
  password: 'playwright123',
  nickname: 'PlaywrightAutoRun',
};

export function uniqueEmail(prefix = 'qa') {
  return `${prefix}_${Date.now()}@playwright.test`;
}
