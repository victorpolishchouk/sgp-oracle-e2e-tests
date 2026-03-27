# SGP Oracle — Playwright Regression Suite

Автоматизовані регресійні тести для додатку **SGP Oracle**
(`victorpolishchouk.github.io/sgp-oracle`).

Тести покривають усі баги, виявлені під час QA-сесій (26–27.03.2026),
та перевіряють доступність відповідно до WCAG 2.1 AA.

---

## Структура проекту

```
sgp-oracle-tests/
├── playwright.config.ts          # конфіг: baseURL, browsers, retries
├── pages/
│   └── OraclePage.ts             # Page Object Model
├── tests/
│   ├── fixtures.ts               # загальні фікстюри і тестові дані
│   ├── auth.spec.ts              # BUG-001, BUG-002, BUG-003, A11Y-001..005
│   ├── prediction-form.spec.ts   # BUG-004, BUG-005, BUG-006, SEC-002
│   ├── navigation-and-lock.spec.ts # round nav, race lock, leaderboard
│   ├── accessibility.spec.ts     # повне A11Y покриття (WCAG AA)
│   └── live-monitor.spec.ts      # sgp-live-monitor.html smoke + regression
└── README.md
```

---

## Покриття — маппінг багів до тестів

| ID       | Опис                                              | Файл                       | Test name (substr)                         |
|----------|---------------------------------------------------|----------------------------|--------------------------------------------|
| BUG-001  | Login button disabled після logout                | auth.spec.ts               | `login button stays enabled after...`      |
| BUG-002  | Форма реєстрації не очищується після logout       | auth.spec.ts               | `registration form fields are empty...`    |
| BUG-003  | Немає обробки auth/invalid-credential             | auth.spec.ts               | `shows error message for wrong password`   |
| BUG-004  | swcClearForm() not defined                        | prediction-form.spec.ts    | `BUG-004 — SWC "Очистити"...`             |
| BUG-005  | Error msg: червоний на червоному                  | accessibility.spec.ts      | `A11Y-005 — login error message meets...`  |
| BUG-006  | Dropdowns disabled після locked → open round      | prediction-form.spec.ts    | `BUG-006 — dropdowns enabled after...`     |
| SEC-002  | XSS через нікнейм                                 | prediction-form.spec.ts    | `SEC-002 — XSS payload...`                 |
| A11Y-001 | Toast без role="alert"                            | auth.spec.ts / a11y.spec   | `toast has role="alert"`                   |
| A11Y-002 | aria-label відсутні на полях                      | auth.spec.ts / a11y.spec   | `Form field accessible names`              |
| A11Y-003 | Слабкий focus indicator                           | accessibility.spec.ts      | `Focus indicators`                         |
| A11Y-004 | Відсутні autocomplete атрибути                    | auth.spec.ts / a11y.spec   | `autocomplete`                             |
| A11Y-005 | Контраст error message < 4.5:1                    | accessibility.spec.ts      | `meets WCAG AA contrast (4.5:1)`           |

---

## Встановлення

```bash
# Встановити залежності
npm install

# Встановити Playwright browsers
npx playwright install chromium
```

---

## Запуск тестів

```bash
# Всі тести (headless)
npx playwright test

# Тільки auth тести
npm run test:auth

# Тільки A11Y тести
npm run test:a11y

# Тільки Live Monitor
npm run test:monitor

# З браузером (headed) — зручно для дебагу
npm run test:headed

# З конкретним файлом + headed
npx playwright test tests/auth.spec.ts --headed

# Тести з певним тегом у назві
npx playwright test --grep "BUG-001"
npx playwright test --grep "A11Y"

# Показати HTML-звіт після запуску
npm run test:report
```

### Запуск проти іншого URL (локальний dev server)

```bash
BASE_URL=http://localhost:3000 npx playwright test
```

---

## Тестові дані

Тести використовують акаунт `qa_test_playwright@example.com` (пароль `playwright123`).
Цей акаунт **має існувати у Firebase** перед запуском тестів.

Для реєстрації:
1. Відкрийте додаток у браузері
2. Зареєструйте акаунт з цими даними
3. Або запустіть `auth.spec.ts` вперше вручну — він зробить це через UI

---

## Оновлення тестів після змін у коді

| Що змінилось у коді | Що оновити в тестах |
|---|---|
| Нові ID (HTML `id=`) | Локатори в `OraclePage.ts` |
| Новий раунд у SEASON config | `'round selector renders all SGP 2026 rounds'` → оновити count |
| Нові riders у ростері | `'all rider selects are populated with options'` → min count |
| Нова URL структура | `playwright.config.ts` → `baseURL` |
| Новий баг → фікс | Додати тест у відповідний `*.spec.ts` |
| Зміна scoring logic | `navigation-and-lock.spec.ts` → leaderboard тести |

---

## CI/CD (GitHub Actions — приклад)

```yaml
# .github/workflows/regression.yml
name: Regression Tests
on:
  push:
    branches: [main, test]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install deps
        run: npm ci
        working-directory: sgp-oracle-tests
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
        working-directory: sgp-oracle-tests
      - name: Run tests
        run: npx playwright test
        working-directory: sgp-oracle-tests
        env:
          BASE_URL: https://victorpolishchouk.github.io/sgp-oracle
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: sgp-oracle-tests/playwright-report/
```
