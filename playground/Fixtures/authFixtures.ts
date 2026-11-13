import { test as base, expect, type Page } from '@playwright/test';
import { DashboardPage } from '../POM/DashboardPage';
import { AuthApiHelper, type StorageState } from '../Util/AuthApiHelper';
import { ROUTES, absoluteUrl } from '../Util/constants';
import { VALID_USER } from '../Util/loginData';

interface TestFixtures {
  /** A page in a fresh browser context that is already logged in and sitting on the dashboard. */
  authenticatedPage: Page;
  /** Page object for the dashboard shown in `authenticatedPage`. */
  dashboard: DashboardPage;
}

interface WorkerFixtures {
  /** Session cookies from one API login per worker, reused by every test in that worker. */
  sessionState: StorageState;
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  sessionState: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await use(await AuthApiHelper.createSession(VALID_USER));
    },
    { scope: 'worker' },
  ],

  authenticatedPage: async ({ browser, sessionState }, use) => {
    const context = await browser.newContext({ storageState: sessionState });
    const page = await context.newPage();
    await page.goto(absoluteUrl(ROUTES.dashboard));
    await use(page);
    await context.close();
  },

  dashboard: async ({ authenticatedPage }, use) => {
    await use(new DashboardPage(authenticatedPage));
  },
});

export { expect };
