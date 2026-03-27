/**
 * SGP LIVE MONITOR TESTS — sgp-live-monitor.html
 * Окремий HTML-файл у тому ж репозиторії.
 */

import { test as base, expect } from '@playwright/test';

// Live monitor — окремий URL
const test = base.extend<{}>({
  page: async ({ page }, use) => {
    const base = process.env.BASE_URL || 'https://victorpolishchouk.github.io/sgp-oracle';
    await page.goto(`${base}/sgp-live-monitor.html`);
    await page.waitForLoadState('networkidle');
    await use(page);
  },
});

test.describe('SGP Live Monitor — smoke', () => {

  test('page title is set', async ({ page }) => {
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });

  test('SGP Live Monitor header visible', async ({ page }) => {
    await expect(page.locator('.logo-sgp')).toBeVisible();
    await expect(page.locator('.logo-sgp')).toContainText('SGP');
    await expect(page.locator('.logo-sub')).toContainText(/Monitor/i);
  });

  test('status dot and label visible', async ({ page }) => {
    await expect(page.locator('#statusDot')).toBeVisible();
    await expect(page.locator('#statusLabel')).toBeVisible();
    await expect(page.locator('#statusLabel')).toContainText('IDLE');
  });

  test('config panel: round select, interval select, start button', async ({ page }) => {
    await expect(page.locator('#roundSelect')).toBeVisible();
    await expect(page.locator('#intervalSelect')).toBeVisible();
    await expect(page.locator('#startBtn')).toBeVisible();
    await expect(page.locator('#startBtn')).toContainText('СТАРТ');
  });

  test('rounds loaded from API (at least 1 option)', async ({ page }) => {
    // Чекаємо async fetch раундів з eventrack.io
    await page.waitForTimeout(6_000);
    const options = await page.locator('#roundSelect option[value]:not([value=""])').count();
    expect(options).toBeGreaterThan(0);
  });

  test('countdown units render', async ({ page }) => {
    await expect(page.locator('#cdH')).toBeVisible();
    await expect(page.locator('#cdM')).toBeVisible();
    await expect(page.locator('#cdS')).toBeVisible();
  });

  test('log panel rendered', async ({ page }) => {
    await expect(page.locator('.log-wrap')).toBeVisible();
    await expect(page.locator('#logEntries')).toBeVisible();
  });

  test('initial log has INFO entry', async ({ page }) => {
    const entries = page.locator('#logEntries .log-entry');
    await expect(entries.first()).toBeVisible({ timeout: 5_000 });
  });

  test('checks count starts at 0', async ({ page }) => {
    await expect(page.locator('#checksCount')).toContainText('0');
  });

  test('live banner not visible initially', async ({ page }) => {
    const display = await page.locator('#liveBanner').evaluate(
      (el: HTMLElement) => window.getComputedStyle(el).display
    );
    expect(display).toBe('none');
  });
});

test.describe('SGP Live Monitor — start/stop', () => {

  test('cannot start without round — shows WARN log', async ({ page }) => {
    // Спробувати стартувати без вибору раунду
    try {
      await page.locator('#roundSelect').selectOption({ value: '' });
    } catch {}
    await page.locator('#startBtn').click();
    await page.waitForTimeout(1_000);
    const warn = page.locator('.log-tag.warn');
    await expect(warn.first()).toBeVisible({ timeout: 3_000 });
  });

  test('start button changes to СТОП when running', async ({ page }) => {
    await page.waitForTimeout(6_000);
    const count = await page.locator('#roundSelect option[value]:not([value=""])').count();
    if (count === 0) test.skip();
    await page.locator('#roundSelect').selectOption({ index: 1 });
    await page.locator('#startBtn').click();
    await page.waitForTimeout(500);
    await expect(page.locator('#startBtn')).toContainText('СТОП');
  });

  test('clicking СТОП returns to СТАРТ', async ({ page }) => {
    await page.waitForTimeout(6_000);
    const count = await page.locator('#roundSelect option[value]:not([value=""])').count();
    if (count === 0) test.skip();
    await page.locator('#roundSelect').selectOption({ index: 1 });
    await page.locator('#startBtn').click();
    await page.waitForTimeout(500);
    await page.locator('#startBtn').click();
    await expect(page.locator('#startBtn')).toContainText('СТАРТ');
    await expect(page.locator('#statusLabel')).toContainText('STOPPED');
  });

  test('clear log removes entries', async ({ page }) => {
    await page.waitForTimeout(2_000);
    await page.getByRole('button', { name: 'Очистити' }).click();
    const entries = page.locator('#logEntries .log-entry');
    await expect(entries).toHaveCount(0);
  });

  test('interval selector has 4+ options including хвилин', async ({ page }) => {
    const texts = await page.locator('#intervalSelect option').allInnerTexts();
    expect(texts.length).toBeGreaterThanOrEqual(4);
    expect(texts.join(' ')).toContain('хвилин');
  });
});

test.describe('SGP Live Monitor — A11Y', () => {

  test('html[lang] set', async ({ page }) => {
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
  });

  test('page has <title>', async ({ page }) => {
    expect((await page.title()).trim().length).toBeGreaterThan(0);
  });

  test('start button keyboard accessible', async ({ page }) => {
    await page.locator('#startBtn').focus();
    const id = await page.evaluate(() => document.activeElement?.id);
    expect(id).toBe('startBtn');
  });
});
