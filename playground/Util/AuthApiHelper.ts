import { request, type APIRequestContext } from '@playwright/test';
import type { Credentials } from './loginData';
import { BASE_URL, ROUTES } from './constants';

export type StorageState = Awaited<ReturnType<APIRequestContext['storageState']>>;

/**
 * Logs in over HTTP. OrangeHRM uses a session cookie plus a CSRF token embedded in
 * the login page, so "extract token" means reading that CSRF token, and the result
 * to store is the cookie, returned as a Playwright storage state.
 */
export class AuthApiHelper {
  /** Login markup embeds the token as `:token="&quot;<value>&quot;"`. */
  private static readonly CSRF_TOKEN_PATTERN = /:token="&quot;([^&]+)&quot;"/;

  constructor(private readonly api: APIRequestContext) {}

  /** Creates an authenticated session and returns its storage state, then disposes the client. */
  static async createSession(
    credentials: Credentials,
    baseUrl: string = BASE_URL,
  ): Promise<StorageState> {
    const api = await request.newContext({ baseURL: baseUrl });
    try {
      await new AuthApiHelper(api).login(credentials);
      return await api.storageState();
    } finally {
      await api.dispose();
    }
  }

  async login(credentials: Credentials): Promise<void> {
    const csrfToken = await this.fetchCsrfToken();
    await this.submitCredentials(csrfToken, credentials);
  }

  private async fetchCsrfToken(): Promise<string> {
    const response = await this.api.get(ROUTES.login);
    if (!response.ok()) {
      throw new Error(`Login page request failed with status ${response.status()}`);
    }
    const match = AuthApiHelper.CSRF_TOKEN_PATTERN.exec(await response.text());
    if (!match) {
      throw new Error('CSRF token not found on the login page; the markup may have changed.');
    }
    return match[1];
  }

  /** A successful login answers 302 to the dashboard; anything else is a rejection. */
  private async submitCredentials(csrfToken: string, credentials: Credentials): Promise<void> {
    const response = await this.api.post(ROUTES.validate, {
      form: { _token: csrfToken, username: credentials.username, password: credentials.password },
      maxRedirects: 0,
    });
    const location = response.headers()['location'] ?? '';
    if (response.status() !== 302 || !location.includes(ROUTES.dashboard)) {
      throw new Error(`API login rejected (status ${response.status()}, redirect "${location}")`);
    }
  }
}
