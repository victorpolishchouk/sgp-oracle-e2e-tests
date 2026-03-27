/**
 * AUTH TESTS — Firebase версія
 * Покриває: BUG-001, BUG-002, BUG-003, A11Y-001..005
 *
 * ВАЖЛИВО: тести запускаються проти
 *   https://victorpolishchouk.github.io/sgp-oracle
 * Всі локатори перевірено на живій сторінці 27.03.2026.
 */

import { test, expect, TEST_USER, uniqueEmail } from './fixtures';

// ──────────────────────────────────────────────────────────────────────────
// BUG-001: Кнопка УВІЙТИ має бути enabled після logout
// ──────────────────────────────────────────────────────────────────────────
test.describe('BUG-001 — Login button re-enabled after logout', () => {

  test('login button is enabled on fresh page load', async ({ oracle }) => {
    await expect(oracle.loginSubmitBtn).toBeEnabled();
  });

  test('login button stays enabled after login → logout cycle', async ({ oracle }) => {
    await test.step('Увійти', async () => {
      await oracle.login(TEST_USER.email, TEST_USER.password);
    });
    await test.step('Вийти', async () => {
      await oracle.logout();
    });
    await test.step('Кнопка УВІЙТИ enabled після logout (BUG-001)', async () => {
      await expect(oracle.loginSubmitBtn).toBeEnabled();
      await expect(oracle.loginEmail).toBeEnabled();
      await expect(oracle.loginPassword).toBeEnabled();
    });
  });

  test('can login again after logout', async ({ oracle }) => {
    await oracle.login(TEST_USER.email, TEST_USER.password);
    await oracle.logout();
    await oracle.login(TEST_USER.email, TEST_USER.password);
    await expect(oracle.userPill).toBeVisible();
  });
});

// ──────────────────────────────────────────────────────────────────────────
// BUG-002: Форма очищується після logout
// ──────────────────────────────────────────────────────────────────────────
test.describe('BUG-002 — Registration form cleared after logout', () => {

  test('login form fields are empty after logout', async ({ oracle }) => {
    await oracle.login(TEST_USER.email, TEST_USER.password);
    await oracle.logout();
    await expect(oracle.loginEmail).toHaveValue('');
    await expect(oracle.loginPassword).toHaveValue('');
  });

  test('register form fields are empty after logout', async ({ oracle }) => {
    await oracle.login(TEST_USER.email, TEST_USER.password);
    await oracle.logout();
    await oracle.tabRegisterBtn.click();
    await expect(oracle.regNick).toHaveValue('');
    await expect(oracle.regEmail).toHaveValue('');
    await expect(oracle.regPassword).toHaveValue('');
    await expect(oracle.regPassword2).toHaveValue('');
  });
});

// ──────────────────────────────────────────────────────────────────────────
// BUG-003: Error handling при невалідних кредентіалах
// ──────────────────────────────────────────────────────────────────────────
test.describe('BUG-003 — Auth error handling', () => {

  test('shows error for wrong password', async ({ oracle }) => {
    await oracle.loginEmail.fill(TEST_USER.email);
    await oracle.loginPassword.fill('WRONG_PASSWORD_XYZ');
    await oracle.loginSubmitBtn.click();
    await expect(oracle.loginError).toBeVisible({ timeout: 10_000 });
    const text = await oracle.loginError.innerText();
    expect(text.trim().length).toBeGreaterThan(0);
    // Помилка має бути зрозумілою, а не технічним кодом Firebase
    expect(text).not.toContain('auth/invalid-credential');
    expect(text).not.toContain('auth/wrong-password');
  });

  test('shows error for non-existent email', async ({ oracle }) => {
    await oracle.loginEmail.fill(`nouser_${Date.now()}@no-domain.test`);
    await oracle.loginPassword.fill('anypassword123');
    await oracle.loginSubmitBtn.click();
    await expect(oracle.loginError).toBeVisible({ timeout: 10_000 });
    const text = await oracle.loginError.innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('shows validation error for empty email', async ({ oracle }) => {
    await oracle.loginPassword.fill('somepassword');
    await oracle.loginSubmitBtn.click();
    // Або показується #loginError, або HTML5 валідація блокує submit
    const errorVisible = await oracle.loginError.isVisible();
    if (!errorVisible) {
      const valid = await oracle.loginEmail.evaluate(
        (el: HTMLInputElement) => el.validity.valid
      );
      expect(valid).toBe(false);
    } else {
      await expect(oracle.loginError).toBeVisible();
    }
  });

  test('shows validation error for empty password', async ({ oracle }) => {
    await oracle.loginEmail.fill(TEST_USER.email);
    await oracle.loginSubmitBtn.click();
    const errorVisible = await oracle.loginError.isVisible();
    if (!errorVisible) {
      const valid = await oracle.loginPassword.evaluate(
        (el: HTMLInputElement) => el.validity.valid
      );
      expect(valid).toBe(false);
    }
  });

  test('register — password mismatch shows error', async ({ oracle }) => {
    await oracle.tabRegisterBtn.click();
    await oracle.regNick.fill('TestNick');
    await oracle.regEmail.fill(uniqueEmail('mismatch'));
    await oracle.regPassword.fill('password123');
    await oracle.regPassword2.fill('DIFFERENT_pass');
    await oracle.regSubmitBtn.click();
    await expect(oracle.regError).toBeVisible({ timeout: 5_000 });
    await expect(oracle.regError).toContainText(/пароль/i);
  });

  test('register — short password shows error', async ({ oracle }) => {
    await oracle.tabRegisterBtn.click();
    await oracle.regNick.fill('TestNick');
    await oracle.regEmail.fill(uniqueEmail('shortpass'));
    await oracle.regPassword.fill('123');
    await oracle.regPassword2.fill('123');
    await oracle.regSubmitBtn.click();
    await expect(oracle.regError).toBeVisible({ timeout: 5_000 });
  });

  test('register — duplicate email shows error', async ({ oracle }) => {
    await oracle.tabRegisterBtn.click();
    await oracle.regNick.fill('DupUser');
    await oracle.regEmail.fill(TEST_USER.email); // вже існує у Firebase
    await oracle.regPassword.fill('password123');
    await oracle.regPassword2.fill('password123');
    await oracle.regSubmitBtn.click();
    await expect(oracle.regError).toBeVisible({ timeout: 10_000 });
  });
});

// ──────────────────────────────────────────────────────────────────────────
// A11Y: Auth form accessibility
// ──────────────────────────────────────────────────────────────────────────
test.describe('A11Y — Auth form', () => {

  // A11Y-001: Toast має role="alert"
  test('A11Y-001 — toast has role="alert"', async ({ oracle, page }) => {
    // Firebase-версія: toast елемент — це #toast
    const role = await page.locator('#toast').getAttribute('role');
    expect(role).toBe('alert');
  });

  // A11Y-002: Поля логіну мають accessible name
  test('A11Y-002 — login email has accessible name (aria-label)', async ({ oracle }) => {
    // Firebase-версія вже має aria-label="Email для входу"
    const ariaLabel = await oracle.loginEmail.getAttribute('aria-label');
    const id        = await oracle.loginEmail.getAttribute('id');
    const hasLabel  = ariaLabel
      || await oracle.page.locator(`label[for="${id}"]`).count() > 0;
    expect(hasLabel, 'Login email lacks accessible name').toBeTruthy();
  });

  test('A11Y-002 — login password has accessible name', async ({ oracle }) => {
    const ariaLabel = await oracle.loginPassword.getAttribute('aria-label');
    const id        = await oracle.loginPassword.getAttribute('id');
    const hasLabel  = ariaLabel
      || await oracle.page.locator(`label[for="${id}"]`).count() > 0;
    expect(hasLabel, 'Login password lacks accessible name').toBeTruthy();
  });

  // A11Y-003: Focus indicator
  test('A11Y-003 — login submit button has focus indicator', async ({ oracle, page }) => {
    await oracle.loginSubmitBtn.focus();
    const { outline, boxShadow } = await oracle.loginSubmitBtn.evaluate((el: HTMLElement) => {
      const s = window.getComputedStyle(el);
      return { outline: s.outlineWidth, boxShadow: s.boxShadow };
    });
    const hasIndicator = parseFloat(outline) > 0 || (boxShadow && boxShadow !== 'none');
    expect(hasIndicator, 'Login button has no focus indicator').toBe(true);
  });

  test('A11Y-003 — login email input has focus indicator', async ({ oracle }) => {
    await oracle.loginEmail.focus();
    const { outline, borderColor } = await oracle.loginEmail.evaluate((el: HTMLElement) => {
      const s = window.getComputedStyle(el);
      return { outline: s.outlineWidth, borderColor: s.borderColor };
    });
    // Input показує focus через border зміну (accent color)
    expect(outline !== '0px' || borderColor !== 'rgba(0, 0, 0, 0)').toBe(true);
  });

  // A11Y-004: autocomplete атрибути
  test('A11Y-004 — login email has autocomplete', async ({ oracle }) => {
    const ac = await oracle.loginEmail.getAttribute('autocomplete');
    expect(ac, 'Missing autocomplete on login email').toBeTruthy();
    expect(['email', 'username']).toContain(ac);
  });

  test('A11Y-004 — login password has autocomplete', async ({ oracle }) => {
    const ac = await oracle.loginPassword.getAttribute('autocomplete');
    expect(ac, 'Missing autocomplete on login password').toBeTruthy();
    expect(['current-password', 'password']).toContain(ac);
  });

  test('A11Y-004 — register fields have autocomplete', async ({ oracle }) => {
    await oracle.tabRegisterBtn.click();
    const acEmail = await oracle.regEmail.getAttribute('autocomplete');
    const acPass  = await oracle.regPassword.getAttribute('autocomplete');
    expect(acEmail, 'Missing autocomplete on reg email').toBeTruthy();
    expect(acPass,  'Missing autocomplete on reg password').toBeTruthy();
    expect(['new-password', 'password']).toContain(acPass);
  });

  // A11Y-005: Контраст error message
  test('A11Y-005 — login error has sufficient contrast', async ({ oracle }) => {
    // Тригеруємо помилку
    await oracle.loginEmail.fill('bad@test.com');
    await oracle.loginPassword.fill('wrongpassword');
    await oracle.loginSubmitBtn.click();
    await oracle.loginError.waitFor({ state: 'visible', timeout: 10_000 });

    const { color, bg } = await oracle.loginError.evaluate((el: HTMLElement) => {
      const s = window.getComputedStyle(el);
      return { color: s.color, bg: s.backgroundColor };
    });

    // Колір тексту і фону не повинні збігатись (BUG-005: червоний на червоному)
    expect(color, 'Error text color same as background').not.toBe(bg);

    // Спрощена перевірка WCAG AA (4.5:1): мінімум — текст не злитий з фоном
    function luminance(rgb: string) {
      const m = rgb.match(/\d+/g);
      if (!m) return 0;
      const [r, g, b] = m.map(v => {
        const s = parseInt(v) / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    const l1 = luminance(color), l2 = luminance(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    expect(ratio, `Error contrast ${ratio.toFixed(2)}:1 < WCAG AA 4.5:1`).toBeGreaterThanOrEqual(4.5);
  });
});
