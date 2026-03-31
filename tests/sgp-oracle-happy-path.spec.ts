import { test, expect, type Page } from '@playwright/test';

/**
 * Повний happy path: вхід під тестовим акаунтом → заповнення всіх полів прогнозу → збереження.
 *
 * За замовчуванням підставляються плейсхолдери; для реального входу перевизначте змінні оточення:
 *   PowerShell:
 *     $env:SGP_ORACLE_E2E_EMAIL='you@example.com'; $env:SGP_ORACLE_E2E_PASSWORD='***'; npx playwright test tests/sgp-oracle-happy-path.spec.ts --project=chromium
 */
const BASE_URL = process.env.SGP_ORACLE_BASE_URL ?? 'https://victorpolishchouk.github.io/sgp-oracle/';
const E2E_EMAIL = process.env.SGP_ORACLE_E2E_EMAIL ?? 'xx@xx.com';
const E2E_PASSWORD = process.env.SGP_ORACLE_E2E_PASSWORD ?? '123456';

/** Видимі списки гонщиків у дереві доступності (без прихованих SWC-полів у DOM). */
function riderCombos(page: Page) {
  return page.getByRole('combobox');
}

test.describe('SGP Oracle — happy path (залогінений)', () => {
  test('вхід, заповнення всіх select-ів прогнозу та збереження', async ({ page }) => {
    test.setTimeout(120_000);
    await test.step('Відкрити головну та увійти', async () => {
      await page.goto(BASE_URL);
      await expect(page.getByText('Зроби прогноз', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Увійти', exact: true }).click();
      await page.locator('#loginEmail').fill(E2E_EMAIL);
      await page.locator('#loginPass').fill(E2E_PASSWORD);
      const loginResponse = page.waitForResponse(
        (r) =>
          r.url().includes('signInWithPassword') &&
          r.request().method() === 'POST' &&
          r.url().includes('identitytoolkit.googleapis.com'),
      );
      await page.locator('button[onclick="doLogin()"]').click();
      const res = await loginResponse;
      expect(res.status(), 'Firebase signIn повинен повернути 200').toBe(200);
      await expect(page.getByRole('button', { name: 'Мій прогноз' })).toBeVisible({
        timeout: 20_000,
      });
    });

    await test.step('Дочекатися форми прогнозу (комбобокси з гонщиками)', async () => {
      await expect(riderCombos(page).first()).toBeVisible({ timeout: 25_000 });
      const n = await riderCombos(page).count();
      expect(n, 'Очікуємо набір списків гонщиків для повного прогнозу').toBeGreaterThanOrEqual(10);
    });

    await test.step('Обрати активний раунд, якщо є кілька чіпсів', async () => {
      const landshut = page.getByRole('button', { name: /Landshut/i }).first();
      if (await landshut.isVisible().catch(() => false)) {
        await landshut.click();
        await expect(async () => {
          const n = await riderCombos(page).first().locator('option').count();
          expect(n).toBeGreaterThan(1);
        }).toPass({ timeout: 15_000 });
      }
    });

    await test.step('Заповнити кожен видимий список першою доступною непорожньою опцією', async () => {
      const count = await riderCombos(page).count();
      for (let i = 0; i < count; i++) {
        const sel = riderCombos(page).nth(i);
        await sel.waitFor({ state: 'visible' });
        const value = await sel.evaluate((el: HTMLSelectElement) => {
          for (const opt of Array.from(el.options)) {
            if (!opt.disabled && opt.value && opt.value.trim() !== '') {
              return opt.value;
            }
          }
          return null as string | null;
        });
        if (value) {
          await sel.selectOption(value);
        }
      }
    });

    await test.step('Зберегти прогноз і побачити підтвердження', async () => {
      const savedLabel = page.getByText(/прогноз збережено/i).first();
      if (!(await savedLabel.isVisible().catch(() => false))) {
        const saveBtn = page
          .locator('button')
          .filter({ hasText: /Зберегти|ЗБЕРЕГТИ|💾/ });
        await expect(saveBtn.first()).toBeVisible({ timeout: 20_000 });
        await saveBtn.first().scrollIntoViewIfNeeded();
        await expect(saveBtn.first()).toBeEnabled({ timeout: 15_000 });
        await saveBtn.first().click();
      }
      await expect(savedLabel).toBeVisible({ timeout: 25_000 });
    });
  });
});

test.describe('SGP Oracle — публічні елементи після завантаження (без секретів)', () => {
  test('герой, логін і рядок статусу гонки з’являються після завантаження', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.getByText('Зроби прогноз', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Увійти', exact: true })).toBeVisible();
    await expect(
      page.getByText(/Перевірка статусу гонки|До старту/),
    ).toBeVisible({ timeout: 25_000 });
  });
});
