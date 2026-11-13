import { type Locator, type Page } from '@playwright/test';
import type { Credentials } from '../Util/loginData';
import { ROUTES } from '../Util/constants';
import { BasePage } from './BasePage';

/**
 * Page Object for the OrangeHRM login page.
 * Contains locators and user actions only; assertions live in the tests.
 * Note: the app has no "Remember Me" checkbox, so none is modelled here.
 */
export class LoginPage extends BasePage {
  protected readonly path = ROUTES.login;
  readonly heading: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  /** Rendered as a <p>, not an <a>, so role "link" is unavailable; text is the best semantic option. */
  readonly forgotPasswordLink: Locator;
  readonly errorAlert: Locator;
  readonly usernameRequiredError: Locator;
  readonly passwordRequiredError: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Login' });
    this.usernameInput = page.getByRole('textbox', { name: 'Username' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.forgotPasswordLink = page.getByText('Forgot your password?');
    this.errorAlert = page.getByRole('alert');
    this.usernameRequiredError = this.fieldError('Username');
    this.passwordRequiredError = this.fieldError('Password');
  }

  /** Opens the login page and waits until the form is interactive. */
  override async goto(): Promise<void> {
    await this.perform('open the login page', async () => {
      await super.goto();
      await this.usernameInput.waitFor({ state: 'visible' });
    });
  }

  async fillUsername(username: string): Promise<void> {
    await this.perform('fill the username', () => this.usernameInput.fill(username));
  }

  async fillPassword(password: string): Promise<void> {
    await this.perform('fill the password', () => this.passwordInput.fill(password));
  }

  async submit(): Promise<void> {
    await this.perform('click Login', () => this.loginButton.click());
  }

  /** Submits the form from the password field using the keyboard. */
  async submitWithEnter(): Promise<void> {
    await this.perform('submit with Enter', () => this.passwordInput.press('Enter'));
  }

  async clickForgotPassword(): Promise<void> {
    await this.perform('click Forgot password', () => this.forgotPasswordLink.click());
  }

  /** Fills both fields and submits. */
  async login(username: string, password: string): Promise<void> {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.submit();
  }

  async loginAs(credentials: Credentials): Promise<void> {
    await this.login(credentials.username, credentials.password);
  }

  /** Wraps an action so failures say which page step broke. */
  private async perform(description: string, action: () => Promise<void>): Promise<void> {
    try {
      await action();
    } catch (error) {
      throw new Error(`LoginPage: failed to ${description}. ${(error as Error).message}`);
    }
  }
}
