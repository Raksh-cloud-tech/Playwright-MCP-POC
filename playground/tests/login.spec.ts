import { expect, test, type Page } from '@playwright/test';
import { DashboardPage } from '../POM/DashboardPage';
import { LoginPage } from '../POM/LoginPage';
import {
  EXPECTED_DISPLAY_NAME,
  LOCKED_USER,
  LONG_INPUT_LENGTH,
  SPECIAL_CHAR_PASSWORD,
  SQLI_PAYLOADS,
  UNKNOWN_USERNAME,
  VALID_USER,
  WRONG_PASSWORD,
  XSS_PAYLOADS,
  buildLongString,
} from '../Util/loginData';
import { MESSAGES, ROUTES, URL_PATTERNS, absoluteUrl } from '../Util/constants';

// Tags: every test is @regression; the Positive group is also @smoke (run with `npm run test:smoke`).
test.describe('Login page', { tag: '@regression' }, () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  const expectStillOnLogin = async (page: Page): Promise<void> => {
    await expect(page).toHaveURL(URL_PATTERNS.login);
    await expect(new DashboardPage(page).heading).toBeHidden();
  };

  const expectInvalidCredentials = async (page: Page): Promise<void> => {
    await expect(loginPage.errorAlert).toHaveText(MESSAGES.invalidCredentials);
    await expectStillOnLogin(page);
  };

  test.describe('Positive', { tag: '@smoke' }, () => {
    test('logs in with valid credentials and lands on the dashboard', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await loginPage.loginAs(VALID_USER);

      await expect(page).toHaveURL(URL_PATTERNS.dashboard);
      await expect(dashboard.heading).toBeVisible();
      await expect(dashboard.userDisplayName).toHaveText(EXPECTED_DISPLAY_NAME);
    });

    test('submits the form with the Enter key', async ({ page }) => {
      await loginPage.fillUsername(VALID_USER.username);
      await loginPage.fillPassword(VALID_USER.password);
      await loginPage.submitWithEnter();

      await expect(page).toHaveURL(URL_PATTERNS.dashboard);
    });

    test('masks the password field', async () => {
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    });
  });

  test.describe('Validation', () => {
    test('shows "Required" when the username is empty', async ({ page }) => {
      await loginPage.login('', VALID_USER.password);

      await expect(loginPage.usernameRequiredError).toHaveText(MESSAGES.required);
      await expect(loginPage.passwordRequiredError).toBeHidden();
      await expectStillOnLogin(page);
    });

    test('shows "Required" when the password is empty', async ({ page }) => {
      await loginPage.login(VALID_USER.username, '');

      await expect(loginPage.passwordRequiredError).toHaveText(MESSAGES.required);
      await expect(loginPage.usernameRequiredError).toBeHidden();
      await expectStillOnLogin(page);
    });

    test('shows "Required" on both fields when both are empty', async ({ page }) => {
      await loginPage.submit();

      await expect(loginPage.usernameRequiredError).toHaveText(MESSAGES.required);
      await expect(loginPage.passwordRequiredError).toHaveText(MESSAGES.required);
      await expectStillOnLogin(page);
    });
  });

  test.describe('Negative', () => {
    test('rejects a valid username with an invalid password', async ({ page }) => {
      await loginPage.login(VALID_USER.username, WRONG_PASSWORD);
      await expectInvalidCredentials(page);
    });

    test('rejects an unknown username with a valid password', async ({ page }) => {
      await loginPage.login(UNKNOWN_USERNAME, VALID_USER.password);
      await expectInvalidCredentials(page);
    });

    test('rejects a password containing special characters', async ({ page }) => {
      await loginPage.login(VALID_USER.username, SPECIAL_CHAR_PASSWORD);
      await expectInvalidCredentials(page);
    });

    test('rejects a locked user', async ({ page }) => {
      test.skip(!LOCKED_USER, 'Set OHRM_LOCKED_USERNAME / OHRM_LOCKED_PASSWORD; the public demo has no locked account.');
      if (!LOCKED_USER) return; // narrows the type for the compiler

      await loginPage.loginAs(LOCKED_USER);

      await expect(loginPage.errorAlert).toBeVisible();
      await expectStillOnLogin(page);
    });
  });

  test.describe('Security', () => {
    SQLI_PAYLOADS.forEach((payload, index) => {
      test(`SQL injection payload #${index + 1} is rejected`, async ({ page }) => {
        await loginPage.login(payload, payload);
        await expectInvalidCredentials(page);
      });
    });

    XSS_PAYLOADS.forEach((payload, index) => {
      test(`XSS payload #${index + 1} is not executed`, async ({ page }) => {
        await loginPage.login(payload, VALID_USER.password);

        await expectInvalidCredentials(page);
        const executed = await page.evaluate(
          () => (window as unknown as { __xss?: boolean }).__xss === true,
        );
        expect(executed).toBe(false);
      });
    });

    test('redirects unauthenticated dashboard access to the login page', async ({ page }) => {
      await page.goto(absoluteUrl(ROUTES.dashboard));
      await expect(page).toHaveURL(URL_PATTERNS.login);
    });
  });

  test.describe('Boundary', () => {
    test('handles a very long username', async ({ page }) => {
      await loginPage.login(buildLongString(LONG_INPUT_LENGTH), VALID_USER.password);

      await expectStillOnLogin(page);
      await expect(loginPage.loginButton).toBeEnabled();
    });

    test('handles a very long password', async ({ page }) => {
      await loginPage.login(VALID_USER.username, buildLongString(LONG_INPUT_LENGTH));

      await expectStillOnLogin(page);
      await expect(loginPage.loginButton).toBeEnabled();
    });
  });

  test.describe('Navigation and session', () => {
    test('opens the password reset page from "Forgot your password?"', async ({ page }) => {
      await loginPage.clickForgotPassword();

      await expect(page).toHaveURL(URL_PATTERNS.forgotPassword);
      await expect(page.getByRole('heading', { name: 'Reset Password' })).toBeVisible();
    });

    // Guard test: replace with real persistence tests if a Remember Me option is ever added.
    test('does not offer a Remember Me checkbox', async ({ page }) => {
      await expect(page.getByRole('checkbox')).toHaveCount(0);
    });

    test('logs out and returns to the login page', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await loginPage.loginAs(VALID_USER);
      await expect(dashboard.heading).toBeVisible();

      await dashboard.logout();

      await expect(page).toHaveURL(URL_PATTERNS.login);
      await expect(loginPage.usernameInput).toBeVisible();
    });

    test('redirects to login after the session cookie is lost (timeout simulation)', async ({ page, context }) => {
      await loginPage.loginAs(VALID_USER);
      await expect(page).toHaveURL(URL_PATTERNS.dashboard);

      await context.clearCookies();
      await page.reload();

      await expect(page).toHaveURL(URL_PATTERNS.login);
    });
  });
});
