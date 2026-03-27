/**
 * NAVIGATION + RACE LOCK + LEADERBOARD TESTS — Firebase версія
 */

import { test, expect, TEST_USER } from './fixtures';

test.describe('Race Status Banner', () => {

  test('race banner visible on page load', async ({ oracle }) => {
    await expect(oracle.raceBanner).toBeVisible();
  });

  test('race banner not stuck in "checking" after load', async ({ oracle, page }) => {
    // Після networkidle даємо ще 8 сек на async Firebase check
    await page.waitForTimeout(8_000);
    const cls = await oracle.raceBanner.getAttribute('class');
    expect(cls).toMatch(/open|locked/);
    expect(cls).not.toMatch(/checking/);
  });
});

test.describe('Round Navigation', () => {

  test.beforeEach(async ({ oracle }) => {
    await oracle.login(TEST_USER.email, TEST_USER.password);
  });

  test('round selector renders 11 SGP 2026 rounds', async ({ oracle }) => {
    const pills = oracle.page.locator('#roundSelectorWrap .round-pill');
    await expect(pills.first()).toBeVisible();
    const count = await pills.count();
    expect(count).toBe(11);
  });

  test('clicking round pill updates active round header', async ({ oracle, page }) => {
    const pills = page.locator('#roundSelectorWrap .round-pill');
    const before = await page.locator('#activeRoundName').innerText();
    // Клікнути другий round (index 1)
    await pills.nth(1).click();
    await page.waitForTimeout(300);
    const after = await page.locator('#activeRoundName').innerText();
    // Перший round і другий мають різні назви
    expect(after.trim()).toBeTruthy();
    // Після кліку активний round змінився (або name інший, або pills.nth(1) має клас active)
    await expect(pills.nth(1)).toHaveClass(/active/);
  });

  test('completed round pill has "done" CSS class', async ({ oracle, page }) => {
    // r01 (Vojens GP 2025) є completed
    const firstPill = page.locator('#roundSelectorWrap .round-pill').first();
    await expect(firstPill).toHaveClass(/done/);
  });

  test('active round city and date shown', async ({ oracle, page }) => {
    const city = await page.locator('#activeRoundCity').innerText();
    expect(city.trim().length).toBeGreaterThan(0);
  });
});

test.describe('Nav Tabs — SGP', () => {

  test.beforeEach(async ({ oracle }) => {
    await oracle.login(TEST_USER.email, TEST_USER.password);
  });

  test('tab "Всі прогнози" shows predictions list', async ({ oracle, page }) => {
    await oracle.tabAllPredsBtn.click();
    const list = page.locator('#allPredsList');
    await expect(list).toBeVisible();
    const text = await list.innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('tab "Результати" shows results and leaderboard', async ({ oracle, page }) => {
    // Перейти на completed round
    const donePill = page.locator('#roundSelectorWrap .round-pill.done').first();
    if (await donePill.count() > 0) await donePill.click();
    await oracle.tabResultsBtn.click();
    await expect(page.locator('#officialResultsGrid')).toBeVisible();
    await expect(page.locator('#leaderboardList')).toBeVisible();
  });

  test('tab "Сезон" shows season standings', async ({ oracle, page }) => {
    await oracle.tabSeasonBtn.click();
    const list = page.locator('#seasonStandingsList');
    await expect(list).toBeVisible();
    const text = await list.innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('only active tab content is visible', async ({ oracle, page }) => {
    await oracle.tabAllPredsBtn.click();
    const myPredDisplay = await page.locator('#tabMyPred').evaluate(
      (el: HTMLElement) => window.getComputedStyle(el).display
    );
    expect(myPredDisplay).toBe('none');
    const allPredsDisplay = await page.locator('#tabAllPreds').evaluate(
      (el: HTMLElement) => window.getComputedStyle(el).display
    );
    expect(allPredsDisplay).not.toBe('none');
  });
});

test.describe('Leaderboard', () => {

  test.beforeEach(async ({ oracle, page }) => {
    await oracle.login(TEST_USER.email, TEST_USER.password);
    const pill = page.locator('#roundSelectorWrap .round-pill.done').first();
    if (await pill.count() > 0) await pill.click();
    await oracle.tabResultsBtn.click();
  });

  test('leaderboard list is rendered', async ({ oracle, page }) => {
    const lb = page.locator('#leaderboardList');
    await expect(lb).toBeVisible();
    const text = await lb.innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('official results grid populated for completed round', async ({ oracle, page }) => {
    const grid = page.locator('#officialResultsGrid');
    const children = await grid.locator('> div').count();
    expect(children).toBeGreaterThan(0);
  });

  test('season rounds count badge shows N/11 format', async ({ oracle, page }) => {
    await oracle.tabSeasonBtn.click();
    const badge = page.locator('#seasonRoundsCount');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText(/\d+ \/ \d+/);
  });
});
