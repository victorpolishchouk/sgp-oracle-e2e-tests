/**
 * PREDICTION FORM TESTS — Firebase версія
 * Покриває: BUG-004, BUG-006, SEC-002, SGP/SWC форми
 */

import { test, expect, TEST_USER, uniqueEmail } from './fixtures';

// ──────────────────────────────────────────────────────────────────────────
// SGP Prediction Form
// ──────────────────────────────────────────────────────────────────────────
test.describe('SGP Prediction Form', () => {

  test.beforeEach(async ({ oracle }) => {
    await oracle.login(TEST_USER.email, TEST_USER.password);
  });

  test('prediction form renders with all required selects', async ({ oracle }) => {
    await expect(oracle.top2_1).toBeVisible();
    await expect(oracle.top2_2).toBeVisible();
    for (const slot of oracle.top8Slots) {
      await expect(slot).toBeVisible();
    }
    await expect(oracle.loserSelect).toBeVisible();
    await expect(oracle.podium1).toBeVisible();
    await expect(oracle.podium2).toBeVisible();
    await expect(oracle.podium3).toBeVisible();
    await expect(oracle.winnerSelect).toBeVisible();
  });

  test('all rider selects populated with 16 riders', async ({ oracle }) => {
    const count = await oracle.top2_1.locator('option[value]:not([value=""])').count();
    expect(count).toBe(16);
  });

  test('top2 — same rider disabled in second slot', async ({ oracle }) => {
    const firstOpt = oracle.top2_1.locator('option[value]:not([value=""])').first();
    const val = await firstOpt.getAttribute('value');
    await oracle.top2_1.selectOption(val!);
    const opt2 = oracle.top2_2.locator(`option[value="${val}"]`);
    await expect(opt2).toBeDisabled();
  });

  test('top8 — duplicate rider disabled across slots', async ({ oracle }) => {
    const firstOpt = oracle.top8Slots[0].locator('option[value]:not([value=""])').first();
    const val = await firstOpt.getAttribute('value');
    await oracle.top8Slots[0].selectOption(val!);
    const opt2 = oracle.top8Slots[1].locator(`option[value="${val}"]`);
    await expect(opt2).toBeDisabled();
  });

  test('score preview updates when fields filled', async ({ oracle }) => {
    const before = await oracle.page.locator('#previewFilled').innerText();
    await oracle.top2_1.selectOption({ index: 1 });
    const after = await oracle.page.locator('#previewFilled').innerText();
    expect(before).not.toBe(after);
  });

  // BUG-006: Дропдауни після переходу locked → open round
  test('BUG-006 — dropdowns enabled after switching locked → open round', async ({ oracle, page }) => {
    await test.step('Перейти на перший round (done/locked)', async () => {
      const firstPill = page.locator('#roundSelectorWrap .round-pill').first();
      await firstPill.click();
      await page.waitForTimeout(500);
    });

    await test.step('Перейти на другий round (open)', async () => {
      const pills = page.locator('#roundSelectorWrap .round-pill');
      const count = await pills.count();
      for (let i = 1; i < count; i++) {
        const cls = await pills.nth(i).getAttribute('class');
        if (!cls?.includes('done')) {
          await pills.nth(i).click();
          await page.waitForTimeout(500);
          break;
        }
      }
    });

    await test.step('Дропдауни enabled (BUG-006)', async () => {
      await expect(oracle.top2_1).toBeEnabled();
      await expect(oracle.top2_2).toBeEnabled();
      await expect(oracle.loserSelect).toBeEnabled();
      await expect(oracle.winnerSelect).toBeEnabled();
    });
  });

  test('"Очистити" resets SGP selects', async ({ oracle }) => {
    await oracle.top2_1.selectOption({ index: 1 });
    await oracle.top2_2.selectOption({ index: 2 });
    await oracle.loserSelect.selectOption({ index: 1 });
    await oracle.btnClear.click();
    await expect(oracle.top2_1).toHaveValue('');
    await expect(oracle.top2_2).toHaveValue('');
    await expect(oracle.loserSelect).toHaveValue('');
  });

  test('save button shows error toast when form incomplete', async ({ oracle }) => {
    await oracle.btnSave.click();
    await oracle.toast.waitFor({ state: 'visible', timeout: 5_000 });
    await expect(oracle.toast).toHaveClass(/error/);
  });

  // SEC-002: XSS через нікнейм
  test('SEC-002 — XSS payload in nickname not executed', async ({ oracle, page }) => {
    await oracle.logout();
    let alertFired = false;
    page.on('dialog', async (dialog) => { alertFired = true; await dialog.dismiss(); });

    await oracle.tabRegisterBtn.click();
    await oracle.regNick.fill('<img src=x onerror=alert(1)>');
    await oracle.regEmail.fill(uniqueEmail('xss'));
    await oracle.regPassword.fill('password123');
    await oracle.regPassword2.fill('password123');
    await oracle.regSubmitBtn.click();
    await page.waitForTimeout(2_000);

    expect(alertFired, 'XSS alert fired — нікнейм не екранується').toBe(false);

    // Якщо реєстрація пройшла — перевірити що img tag не рендериться
    if (await oracle.userPill.isVisible()) {
      const imgCount = await page.locator('img[src="x"]').count();
      expect(imgCount).toBe(0);
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────
// BUG-004: SWC "Очистити" (swcClearForm)
// ──────────────────────────────────────────────────────────────────────────
test.describe('SWC Prediction Form — BUG-004', () => {

  test.beforeEach(async ({ oracle, page }) => {
    await oracle.login(TEST_USER.email, TEST_USER.password);
    await oracle.compBtnSWC.click();
    await oracle.swcScreen.waitFor({ state: 'visible' });
  });

  test('BUG-004 — swcClearForm is defined on window', async ({ oracle, page }) => {
    const isDefined = await page.evaluate(
      () => typeof (window as any).swcClearForm === 'function'
    );
    expect(isDefined, 'swcClearForm is not defined').toBe(true);
  });

  test('BUG-004 — SWC clear button clickable without JS error', async ({ oracle, page }) => {
    await expect(oracle.swcBtnClear).toBeVisible();
    await expect(oracle.swcBtnClear).toBeEnabled();

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await oracle.swcBtnClear.click();
    await page.waitForTimeout(500);

    const critical = errors.filter(e => e.includes('is not defined') || e.includes('TypeError'));
    expect(critical, 'JS errors after clear click: ' + critical.join(', ')).toHaveLength(0);
  });

  test('BUG-004 — SWC clear resets team selects to empty', async ({ oracle, page }) => {
    const selects = page.locator('.swc-team-select');
    const count   = await selects.count();
    if (count > 0) {
      await selects.first().selectOption({ index: 1 });
    }
    await oracle.swcBtnClear.click();
    for (let i = 0; i < count; i++) {
      await expect(selects.nth(i)).toHaveValue('');
    }
  });

  test('SGP ↔ SWC switcher toggles correct screen', async ({ oracle }) => {
    await expect(oracle.swcScreen).toBeVisible();
    await oracle.compBtnSGP.click();
    await expect(oracle.swcScreen).toBeHidden();
    await expect(oracle.top2_1).toBeVisible();
  });

  test('SWC round pills render (min 3)', async ({ oracle, page }) => {
    const pills = page.locator('#swcRoundSelectorWrap .round-pill');
    await expect(pills.first()).toBeVisible({ timeout: 5_000 });
    const count = await pills.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });
});
