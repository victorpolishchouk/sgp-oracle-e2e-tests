import { test, expect, type Request } from '@playwright/test';

/** Публічна сторінка авторизації [SGP Оракул](https://victorpolishchouk.github.io/sgp-oracle/). */
const AUTH_URL = 'https://victorpolishchouk.github.io/sgp-oracle/';

test.describe('SGP Oracle — UI автентифікації (незалогінений стан)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(AUTH_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(page.getByText('Зроби прогноз', { exact: true })).toBeVisible();
  });

  test('заголовок сторінки та ключові елементи героя', async ({ page }) => {
    await expect(page).toHaveTitle(/Оракул/);
    await expect(
      page.getByText(/Увійди або зареєструйся/, { exact: false }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'SGP', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'SWC', exact: true })).toBeVisible();
  });

  test('посилання на календар має очікуваний URL', async ({ page }) => {
    const calendar = page.getByRole('link', { name: 'fimspeedway.com' }).first();
    await expect(calendar).toHaveAttribute('href', 'https://fimspeedway.com/sgp/calendar');
  });

  test('вкладка «Увійти»: видно поля логіну, поля реєстрації приховані', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Увійти', exact: true }).click();
    await expect(page.locator('#loginEmail')).toBeVisible();
    await expect(page.locator('#loginPass')).toBeVisible();
    await expect(page.locator('#regNick')).toBeHidden();
    await expect(page.locator('#regEmail')).toBeHidden();
    await expect(page.locator('button[onclick="doLogin()"]')).toBeVisible();
  });

  test('вкладка «Реєстрація»: видно нікнейм і підтвердження пароля, логін прихований', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Реєстрація', exact: true }).click();
    await expect(page.locator('#regNick')).toBeVisible();
    await expect(page.locator('#regEmail')).toBeVisible();
    await expect(page.locator('#regPass')).toBeVisible();
    await expect(page.locator('#regPass2')).toBeVisible();
    await expect(page.locator('#loginEmail')).toBeHidden();
    await expect(page.locator('button[onclick="doRegister()"]')).toBeVisible();
  });

  test('перемикання SGP/SWC не ламає блок авторизації', async ({ page }) => {
    await page.getByRole('button', { name: 'SWC', exact: true }).click();
    await expect(page.getByText('Зроби прогноз', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'SGP', exact: true }).click();
    await page.getByRole('button', { name: 'Увійти', exact: true }).click();
    await expect(page.locator('#loginEmail')).toBeVisible();
  });

  test('поля паролів мають type="password"', async ({ page }) => {
    await page.getByRole('button', { name: 'Увійти', exact: true }).click();
    await expect(page.locator('#loginPass')).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Реєстрація', exact: true }).click();
    await expect(page.locator('#regPass')).toHaveAttribute('type', 'password');
    await expect(page.locator('#regPass2')).toHaveAttribute('type', 'password');
  });

  test('edge: невалідний email у логіні — HTML5 typeMismatch', async ({ page }) => {
    await page.getByRole('button', { name: 'Увійти', exact: true }).click();
    await page.locator('#loginEmail').fill('не-email');
    const typeMismatch = await page
      .locator('#loginEmail')
      .evaluate((el: HTMLInputElement) => el.validity.typeMismatch);
    expect(typeMismatch).toBe(true);
  });

  test('edge: email з плюсом у локальній частині — валідний для type=email', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Увійти', exact: true }).click();
    await page.locator('#loginEmail').fill('user+tag+alias@example.com');
    const valid = await page
      .locator('#loginEmail')
      .evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(valid).toBe(true);
  });

  test('edge: невалідний email у реєстрації', async ({ page }) => {
    await page.getByRole('button', { name: 'Реєстрація', exact: true }).click();
    await page.locator('#regEmail').fill('bad');
    const typeMismatch = await page
      .locator('#regEmail')
      .evaluate((el: HTMLInputElement) => el.validity.typeMismatch);
    expect(typeMismatch).toBe(true);
  });

  test('edge: логін з існуючим форматом email викликає запит signInWithPassword (очікуємо 400 для тестового акаунта)', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Увійти', exact: true }).click();
    await page.locator('#loginEmail').fill('playwright-smoke-test@example.com');
    await page.locator('#loginPass').fill('WrongPassword!123');

    const responsePromise = page.waitForResponse(
      (r) =>
        r.url().includes('signInWithPassword') &&
        r.request().method() === 'POST' &&
        r.url().includes('identitytoolkit.googleapis.com'),
    );

    await page.locator('button[onclick="doLogin()"]').click();
    const res = await responsePromise;
    expect(res.status()).toBe(400);
  });

  test('edge: різні паролі при реєстрації — не відправляється signUp до Firebase', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Реєстрація', exact: true }).click();

    const signUpUrls: string[] = [];
    const handler = (request: Request) => {
      if (
        request.url().includes('accounts:signUp') &&
        request.url().includes('identitytoolkit.googleapis.com')
      ) {
        signUpUrls.push(request.url());
      }
    };
    page.on('request', handler);

    await page.locator('#regNick').fill('PlaywrightMismatch');
    await page.locator('#regEmail').fill('mismatch@example.com');
    await page.locator('#regPass').fill('password-one-123456');
    await page.locator('#regPass2').fill('password-two-123456');
    await page.locator('button[onclick="doRegister()"]').click();

    await page.waitForTimeout(2000);
    page.off('request', handler);

    expect(signUpUrls.length).toBe(0);
  });

  test('edge: швидке перемикання вкладок — форма лишається стабільною', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Реєстрація', exact: true }).click();
    await page.locator('#regNick').fill('TabStress');
    await page.getByRole('button', { name: 'Увійти', exact: true }).click();
    await page.getByRole('button', { name: 'Реєстрація', exact: true }).click();
    await expect(page.locator('#regNick')).toHaveValue('TabStress');
  });

  test('edge: довгий нікнейм і спецсимволи не ламають сторінку', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Реєстрація', exact: true }).click();
    const longNick = `u<script>x</script>_` + 'a'.repeat(400);
    await page.locator('#regNick').fill(longNick);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('#regNick')).toHaveValue(longNick);
  });

  test('кнопки сабміту доступні з очікуваним текстом', async ({ page }) => {
    await page.getByRole('button', { name: 'Увійти', exact: true }).click();
    await expect(page.locator('button[onclick="doLogin()"]')).toHaveText(/УВІЙТИ/i);
    await page.getByRole('button', { name: 'Реєстрація', exact: true }).click();
    await expect(page.locator('button[onclick="doRegister()"]')).toHaveText(
      /ЗАРЕЄСТРУВАТИСЬ/i,
    );
  });
});
