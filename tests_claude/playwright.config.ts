import { defineConfig, devices } from '@playwright/test';

/**
 * SGP Oracle — Playwright Regression Suite
 * Target: victorpolishchouk.github.io/sgp-oracle (Firebase версія)
 *
 * Запуск:
 *   npx playwright test
 *   BASE_URL=http://localhost:3000 npx playwright test  (локально)
 */
export default defineConfig({
  testDir: './tests',
  timeout: 45_000,          // Firebase auth може бути повільним
  retries: 1,
  workers: 1,               // послідовно — Firebase має rate limits
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://victorpolishchouk.github.io/sgp-oracle',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    // Дати Firebase час на ініціалізацію
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
