import { expect, test } from '../Fixtures/authFixtures';
import { LoginPage } from '../POM/LoginPage';
import { AuthApiHelper } from '../Util/AuthApiHelper';
import { SESSION_COOKIE_NAME, URL_PATTERNS } from '../Util/constants';
import { EXPECTED_DISPLAY_NAME, VALID_USER, WRONG_PASSWORD } from '../Util/loginData';

// The `authenticatedPage` and `dashboard` fixtures log in over the API (one login per worker)
// and open a fresh, already-authenticated browser context for each test.
test.describe('API-authenticated session (UI login skipped)', { tag: '@regression' }, () => {
  test(
    'opens the dashboard directly without touching the login form',
    { tag: '@smoke' },
    async ({ authenticatedPage, dashboard }) => {
      await expect(authenticatedPage).toHaveURL(URL_PATTERNS.dashboard);
      await expect(dashboard.heading).toBeVisible();
    },
  );

  test('shows the logged-in user details', async ({ dashboard }) => {
    await expect(dashboard.userDisplayName).toHaveText(EXPECTED_DISPLAY_NAME);
  });

  test('stores a hardened session cookie', async ({ authenticatedPage }) => {
    const cookies = await authenticatedPage.context().cookies();
    const session = cookies.find((cookie) => cookie.name === SESSION_COOKIE_NAME);

    expect(session, 'session cookie should exist').toBeDefined();
    expect(session?.httpOnly).toBe(true);
    expect(session?.secure).toBe(true);
    expect(session?.sameSite).toBe('Lax');
  });

  test('can log out from the injected session', async ({ authenticatedPage, dashboard }) => {
    await dashboard.logout();
    await expect(authenticatedPage).toHaveURL(URL_PATTERNS.login);
    await expect(new LoginPage(authenticatedPage).usernameInput).toBeVisible();
  });

  // Requests no browser fixture, so no browser context is created for this test.
  test('API helper rejects invalid credentials', async () => {
    await expect(
      AuthApiHelper.createSession({ username: VALID_USER.username, password: WRONG_PASSWORD }),
    ).rejects.toThrow(/API login rejected/);
  });
});
