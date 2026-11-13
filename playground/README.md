# Playwright Test Framework

Playwright + TypeScript end-to-end and API-assisted tests using the Page Object Model.
The default target is the public OrangeHRM demo; point `BASE_URL` at your own environment for real runs.

## Structure

| Folder | Purpose |
|---|---|
| `tests/` | Spec files (`*.spec.ts`). Assertions live here. |
| `POM/` | Page objects. Locators and user actions only, no assertions. `BasePage`, `ListPage` and `FormPage` hold shared behaviour. |
| `Fixtures/` | Custom fixtures. `authFixtures` provides an API-authenticated page (`authenticatedPage`, `dashboard`). |
| `Util/` | Shared constants, test data, the API auth helper and `loadEnv`. |
| `APIPayloads/` | API request payloads and clients (created on first use). |

## Setup

```bash
npm install
npm run install:browsers      # downloads Chromium
cp .env.example .env          # Windows: copy .env.example .env
```

Requires Node 20.12 or newer.

## Running tests

| Command | What it does |
|---|---|
| `npm test` | Run everything headless |
| `npm run test:smoke` | Only tests tagged `@smoke` |
| `npm run test:regression` | Only tests tagged `@regression` |
| `npm run test:headed` | Run with a visible browser |
| `npm run test:ui` | Playwright UI mode |
| `npm run test:debug` | Step through with the inspector |
| `npm run test:login` / `npm run test:auth` | Run one spec file |
| `npm run report` | Open the last HTML report |

Run a single test by title: `npx playwright test -g "masks the password field"`.

## Code quality

| Command | What it does |
|---|---|
| `npm run typecheck` | Type-check all TypeScript (`tsc --noEmit`) |
| `npm run lint` / `npm run lint:fix` | ESLint with the Playwright plugin (missing awaits, `test.only`, ...) |
| `npm run format` / `npm run format:check` | Prettier |

## Tags

Every test is `@regression`; the core happy paths are also `@smoke`. Add a tag with the `tag` option:

```ts
test('my test', { tag: '@smoke' }, async ({ page }) => { /* ... */ });
```

## Configuration

Settings come from `playwright.config.ts` and environment variables (or a local `.env`):

| Variable | Default | Purpose |
|---|---|---|
| `BASE_URL` | public OrangeHRM demo | Application under test |
| `OHRM_USERNAME` / `OHRM_PASSWORD` | demo credentials | Standard test user |
| `OHRM_DISPLAY_NAME` | `John Doe` | Expected name in the dashboard header (the shared demo's data can change) |
| `OHRM_LOCKED_USERNAME` / `OHRM_LOCKED_PASSWORD` | unset | Enables the locked-user test |
| `CROSS_BROWSER` | unset | `true` adds Firefox and WebKit |
| `CI` | unset | Enables retries, `forbidOnly`, JUnit and a non-interactive HTML report |

## CI notes

- A GitHub Actions workflow runs type-check and tests on every push and pull request, and uploads the reports.
- Set `CI=true` (most CI systems already do). Runs retry twice, use 2 workers and produce `playwright-report/` and `reports/junit.xml`.
- Traces are captured on the first retry; screenshots and videos are kept on failure. Publish `test-results/` and `playwright-report/` as build artifacts.
- Provide credentials through the CI secret store, not the repository.

## Conventions

- TypeScript only, ES module syntax, no `require()`.
- Locators prefer roles, labels and text; CSS classes are a documented last resort.
- No fixed waits: rely on auto-waiting assertions and explicit response waits.
- Page objects contain no `expect()`; tests own every assertion.
- Shared setup (such as logging in) goes in fixtures, not in mutable variables inside spec files.
- Test data and credentials come from `Util/` and environment variables, never inline in specs.

## Notes

- The default target is a shared public demo: its data can change and it can be slow. The security tests send injection
  payloads, so only run them against systems you are allowed to test.
