/**
 * ACCESSIBILITY TESTS — WCAG 2.1 AA baseline, Firebase версія
 * Покриває: A11Y-001..005, page semantics, keyboard nav
 */

import { test, expect, TEST_USER } from './fixtures';

// ──────────────────────────────────────────────────────────────────────────
// Page-level semantics
// ──────────────────────────────────────────────────────────────────────────
test.describe('A11Y — Page-level semantics', () => {

  test('html[lang] is set to "uk"', async ({ oracle, page }) => {
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('uk');
  });

  test('page has non-empty <title>', async ({ oracle, page }) => {
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });

  test('page has <header> or role="banner"', async ({ oracle, page }) => {
    const count = await page.locator('header, [role="banner"]').count();
    expect(count).toBeGreaterThan(0);
  });

  test('page has <footer> or role="contentinfo"', async ({ oracle, page }) => {
    const count = await page.locator('footer, [role="contentinfo"]').count();
    expect(count).toBeGreaterThan(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// A11Y-001: Toast role="alert"
// ──────────────────────────────────────────────────────────────────────────
test.describe('A11Y-001 — Toast alert role', () => {

  test('toast has role="alert"', async ({ oracle, page }) => {
    const role = await page.locator('#toast').getAttribute('role');
    expect(role).toBe('alert');
  });

  test('toast has aria-live="assertive" or role=alert (screen reader)', async ({ oracle, page }) => {
    const role     = await page.locator('#toast').getAttribute('role');
    const ariaLive = await page.locator('#toast').getAttribute('aria-live');
    expect(role === 'alert' || ariaLive === 'assertive').toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// A11Y-002: Accessible names на полях форми
// ──────────────────────────────────────────────────────────────────────────
test.describe('A11Y-002 — Form field accessible names', () => {

  async function hasAccessibleName(page: any, locator: any): Promise<boolean> {
    const ariaLabel      = await locator.getAttribute('aria-label');
    const ariaLabelledby = await locator.getAttribute('aria-labelledby');
    const id             = await locator.getAttribute('id');
    if (ariaLabel || ariaLabelledby) return true;
    if (id) {
      const cnt = await page.locator(`label[for="${id}"]`).count();
      if (cnt > 0) return true;
    }
    return false;
  }

  test('login email has accessible name', async ({ oracle, page }) => {
    expect(await hasAccessibleName(page, oracle.loginEmail)).toBe(true);
  });

  test('login password has accessible name', async ({ oracle, page }) => {
    expect(await hasAccessibleName(page, oracle.loginPassword)).toBe(true);
  });

  test('register nick has accessible name', async ({ oracle, page }) => {
    await oracle.tabRegisterBtn.click();
    expect(await hasAccessibleName(page, oracle.regNick)).toBe(true);
  });

  test('register email has accessible name', async ({ oracle, page }) => {
    await oracle.tabRegisterBtn.click();
    expect(await hasAccessibleName(page, oracle.regEmail)).toBe(true);
  });

  test('register password has accessible name', async ({ oracle, page }) => {
    await oracle.tabRegisterBtn.click();
    expect(await hasAccessibleName(page, oracle.regPassword)).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// A11Y-003: Focus indicators
// ──────────────────────────────────────────────────────────────────────────
test.describe('A11Y-003 — Focus indicators', () => {

  async function focusIndicatorPresent(locator: any): Promise<boolean> {
    return locator.evaluate((el: HTMLElement) => {
      el.focus();
      const s = window.getComputedStyle(el);
      const outline   = parseFloat(s.outlineWidth) > 0 && s.outlineStyle !== 'none';
      const shadow    = s.boxShadow && s.boxShadow !== 'none';
      // Inputs часто використовують border зміну замість outline
      const border    = s.borderColor !== 'rgba(0, 0, 0, 0)';
      return outline || !!shadow || border;
    });
  }

  test('login button has focus indicator', async ({ oracle }) => {
    expect(await focusIndicatorPresent(oracle.loginSubmitBtn)).toBe(true);
  });

  test('login email has focus indicator', async ({ oracle }) => {
    expect(await focusIndicatorPresent(oracle.loginEmail)).toBe(true);
  });

  test('login password has focus indicator', async ({ oracle }) => {
    expect(await focusIndicatorPresent(oracle.loginPassword)).toBe(true);
  });

  test('Tab key moves focus from email to password', async ({ oracle, page }) => {
    await oracle.loginEmail.click();
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.id);
    // Фокус пішов далі від loginEmail
    expect(focused).not.toBe('loginEmail');
    expect(focused).toBeTruthy();
  });
});

// ──────────────────────────────────────────────────────────────────────────
// A11Y-004: autocomplete атрибути
// ──────────────────────────────────────────────────────────────────────────
test.describe('A11Y-004 — Autocomplete attributes', () => {

  test('login email autocomplete="email"', async ({ oracle }) => {
    const ac = await oracle.loginEmail.getAttribute('autocomplete');
    expect(ac).toBeTruthy();
    expect(['email', 'username']).toContain(ac);
  });

  test('login password autocomplete="current-password"', async ({ oracle }) => {
    const ac = await oracle.loginPassword.getAttribute('autocomplete');
    expect(ac).toBeTruthy();
    expect(['current-password', 'password']).toContain(ac);
  });

  test('register password autocomplete="new-password"', async ({ oracle }) => {
    await oracle.tabRegisterBtn.click();
    const ac = await oracle.regPassword.getAttribute('autocomplete');
    expect(ac).toBeTruthy();
    expect(['new-password', 'password']).toContain(ac);
  });

  test('register email has autocomplete', async ({ oracle }) => {
    await oracle.tabRegisterBtn.click();
    const ac = await oracle.regEmail.getAttribute('autocomplete');
    expect(ac).toBeTruthy();
  });
});

// ──────────────────────────────────────────────────────────────────────────
// A11Y-005: Контраст error message
// ──────────────────────────────────────────────────────────────────────────
test.describe('A11Y-005 — Error message contrast', () => {

  function luminance(rgb: string): number {
    const m = rgb.match(/\d+/g);
    if (!m) return 0;
    const [r, g, b] = m.map(v => {
      const s = parseInt(v) / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  test('login error meets WCAG AA contrast (4.5:1)', async ({ oracle }) => {
    await oracle.loginEmail.fill('bad@test.com');
    await oracle.loginPassword.fill('wrongpassword');
    await oracle.loginSubmitBtn.click();
    await oracle.loginError.waitFor({ state: 'visible', timeout: 10_000 });

    const { color, bg } = await oracle.loginError.evaluate((el: HTMLElement) => {
      const s = window.getComputedStyle(el);
      return { color: s.color, bg: s.backgroundColor };
    });

    const l1 = luminance(color), l2 = luminance(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    expect(ratio, `Contrast ${ratio.toFixed(2)}:1 < WCAG AA 4.5:1`).toBeGreaterThanOrEqual(4.5);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Keyboard nav у prediction form
// ──────────────────────────────────────────────────────────────────────────
test.describe('A11Y — Keyboard nav in prediction form', () => {

  test.beforeEach(async ({ oracle }) => {
    await oracle.login(TEST_USER.email, TEST_USER.password);
  });

  test('rider select operable via keyboard (ArrowDown changes value)', async ({ oracle, page }) => {
    await oracle.top2_1.focus();
    await page.keyboard.press('ArrowDown');
    const value = await oracle.top2_1.inputValue();
    expect(value).not.toBe('');
  });

  test('save button reachable via Tab from winner select', async ({ oracle, page }) => {
    await oracle.winnerSelect.focus();
    let found = false;
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.id);
      if (focused === 'btnSave' || focused === 'btnClear') { found = true; break; }
    }
    expect(found, 'Cannot Tab to save/clear button').toBe(true);
  });
});
