import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object — SGP Oracle (Firebase версія)
 * URL: victorpolishchouk.github.io/sgp-oracle
 * Локатори перевірено на живій сторінці 27.03.2026.
 */
export class OraclePage {
  readonly page: Page;

  // Header
  readonly logoSGP:           Locator;
  readonly logoSub:           Locator;
  readonly compBtnSGP:        Locator;
  readonly compBtnSWC:        Locator;
  readonly userPill:          Locator;
  readonly logoutBtn:         Locator;

  // Race banner
  readonly raceBanner:        Locator;

  // Auth tabs
  readonly tabLoginBtn:       Locator;
  readonly tabRegisterBtn:    Locator;

  // Login
  readonly loginEmail:        Locator;
  readonly loginPassword:     Locator;
  readonly loginSubmitBtn:    Locator;
  readonly loginError:        Locator;

  // Register
  readonly regNick:           Locator;
  readonly regEmail:          Locator;
  readonly regPassword:       Locator;
  readonly regPassword2:      Locator;
  readonly regSubmitBtn:      Locator;
  readonly regError:          Locator;

  // Prediction form
  readonly top2_1:            Locator;
  readonly top2_2:            Locator;
  readonly top8Slots:         Locator[];
  readonly loserSelect:       Locator;
  readonly podium1:           Locator;
  readonly podium2:           Locator;
  readonly podium3:           Locator;
  readonly winnerSelect:      Locator;
  readonly btnSave:           Locator;
  readonly btnClear:          Locator;

  // Toast (role="alert" вже є у Firebase-версії)
  readonly toast:             Locator;

  // SGP Nav
  readonly tabMyPredBtn:      Locator;
  readonly tabAllPredsBtn:    Locator;
  readonly tabResultsBtn:     Locator;
  readonly tabSeasonBtn:      Locator;

  // Round selector
  readonly roundSelectorWrap: Locator;

  // SWC
  readonly swcScreen:         Locator;
  readonly swcBtnSave:        Locator;
  readonly swcBtnClear:       Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.logoSGP         = page.locator('.logo-sgp');
    this.logoSub         = page.locator('.logo-sub');
    this.compBtnSGP      = page.locator('#btnSGP');
    this.compBtnSWC      = page.locator('#btnSWC');
    this.userPill        = page.locator('#userPill');
    this.logoutBtn       = page.locator('#userPill button');

    // Race banner
    this.raceBanner      = page.locator('#raceBanner');

    // Auth — Firebase-версія має aria-label на полях
    this.tabLoginBtn     = page.getByRole('button', { name: 'Увійти',      exact: true });
    this.tabRegisterBtn  = page.getByRole('button', { name: 'Реєстрація',  exact: true });

    this.loginEmail      = page.getByRole('textbox', { name: 'Email для входу' });
    this.loginPassword   = page.getByRole('textbox', { name: 'Пароль для входу' });
    this.loginSubmitBtn  = page.getByRole('button',  { name: 'УВІЙТИ', exact: true });
    this.loginError      = page.locator('#loginError');

    this.regNick         = page.getByRole('textbox', { name: /нікнейм/i });
    this.regEmail        = page.getByRole('textbox', { name: /email для реєстрації/i });
    this.regPassword     = page.getByRole('textbox', { name: /пароль для реєстрації/i });
    this.regPassword2    = page.getByRole('textbox', { name: /повторіть пароль/i });
    this.regSubmitBtn    = page.getByRole('button',  { name: /зареєструватись/i });
    this.regError        = page.locator('#regError');

    // Prediction form — ID локатори
    this.top2_1          = page.locator('#top2_1');
    this.top2_2          = page.locator('#top2_2');
    this.top8Slots       = [
      page.locator('#top8_1'), page.locator('#top8_2'), page.locator('#top8_3'),
      page.locator('#top8_4'), page.locator('#top8_5'), page.locator('#top8_6'),
    ];
    this.loserSelect     = page.locator('#loser');
    this.podium1         = page.locator('#podium1');
    this.podium2         = page.locator('#podium2');
    this.podium3         = page.locator('#podium3');
    this.winnerSelect    = page.locator('#winner');
    this.btnSave         = page.locator('#btnSave');
    this.btnClear        = page.locator('#btnClear');

    // Toast
    this.toast           = page.locator('#toast');

    // SGP Nav tabs
    this.tabMyPredBtn    = page.getByRole('button', { name: 'Мій прогноз' }).first();
    this.tabAllPredsBtn  = page.getByRole('button', { name: 'Всі прогнози' }).first();
    this.tabResultsBtn   = page.locator('#tabResultsBtn');
    this.tabSeasonBtn    = page.getByRole('button', { name: /📊 Сезон/ }).first();

    // Round selector
    this.roundSelectorWrap = page.locator('#roundSelectorWrap');

    // SWC
    this.swcScreen       = page.locator('#swcScreen');
    this.swcBtnSave      = page.locator('#swcBtnSave');
    this.swcBtnClear     = page.locator('#swcScreen .btn-ghost:has-text("Очистити")');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /** Логін через Firebase Auth. Чекає нікнейму у header. */
  async login(email: string, password: string) {
    await this.loginEmail.waitFor({ state: 'visible', timeout: 10_000 });
    await this.loginEmail.fill(email);
    await this.loginPassword.fill(password);
    await this.loginSubmitBtn.click();
    await this.userPill.waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** Logout. Чекає повернення login форми. */
  async logout() {
    await this.logoutBtn.click();
    await this.loginEmail.waitFor({ state: 'visible', timeout: 10_000 });
  }
}
