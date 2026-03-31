# SGP Oracle — E2E (Playwright)

End-to-end tests for **[SGP / SWC Оракул](https://victorpolishchouk.github.io/sgp-oracle/)**.

## Setup

```bash
npm install
npx playwright install
```

## Run

```bash
npm test
npm run test:sgp-auth
npm run test:sgp-happy
```

HTML report after a run:

```bash
npm run test:report
```

## Happy path credentials

Override Firebase test credentials (otherwise defaults from `tests/sgp-oracle-happy-path.spec.ts` are used):

```bash
# PowerShell
$env:SGP_ORACLE_E2E_EMAIL='you@example.com'
$env:SGP_ORACLE_E2E_PASSWORD='***'
npm run test:sgp-happy
```

Optional: `SGP_ORACLE_BASE_URL` to point at another deployment.

## License

MIT
