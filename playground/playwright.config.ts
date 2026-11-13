import './Util/loadEnv'; // must stay first: loads .env before other modules read process.env
import { defineConfig, devices } from '@playwright/test';
import { BASE_URL } from './Util/constants';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  outputDir: 'test-results',

  /* Tests are independent (each logs in itself or reuses an API session), so run them in parallel. */
  fullyParallel: true,
  /* Fail the build if a stray test.only is committed. */
  // forbidOnly: isCI,
  // retries: isCI ? 2 : 0,
  /* The default target is a shared public demo; keep CI concurrency modest to avoid rate limiting. */
  workers:  1,

  timeout: 30_000,
  expect: { timeout: 10_000 },

  reporter: isCI
    ? [
        ['list'],
        ['html', { open: 'never' }],
        ['junit', { outputFile: 'reports/junit.xml' }],
      ]
    : [['list'], ['html', { open: 'on-failure' }]],

  use: {
    baseURL: BASE_URL,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    locale: 'en-US',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    /* Opt in with CROSS_BROWSER=true (needs `npx playwright install` for each browser). */
    ...(process.env.CROSS_BROWSER === 'true'
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        ]
      : []),
  ],
});
