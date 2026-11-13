import { type Locator, type Page } from '@playwright/test';
import { ROUTES, UserMenuItem } from '../Util/constants';
import { BasePage } from './BasePage';

/** Page Object for the post-login dashboard and its user menu. No assertions. */
export class DashboardPage extends BasePage {
  protected readonly path = ROUTES.dashboard;
  readonly heading: Locator;
  readonly userMenuTrigger: Locator;
  /** The display name has no role or label, so a scoped CSS class is the fallback. */
  readonly userDisplayName: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Dashboard' });
    this.userMenuTrigger = page.getByRole('banner').getByRole('img', { name: 'profile picture' });
    this.userDisplayName = page.getByRole('banner').locator('.oxd-userdropdown-name');
  }

  async openUserMenu(): Promise<void> {
    await this.userMenuTrigger.click();
  }

  async selectUserMenuItem(item: UserMenuItem): Promise<void> {
    await this.openUserMenu();
    await this.page.getByRole('menuitem', { name: item }).click();
  }

  async logout(): Promise<void> {
    await this.selectUserMenuItem(UserMenuItem.Logout);
  }
}
