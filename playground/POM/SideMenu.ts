import { type Locator, type Page } from '@playwright/test';
import type { MainMenuItem } from '../Util/constants';

/** Left-hand main menu (Admin, PIM, Leave, ...). */
export class SideMenu {
  private readonly menu: Locator;

  constructor(page: Page) {
    this.menu = page.getByRole('navigation', { name: 'Sidepanel' });
  }

  async open(item: MainMenuItem): Promise<void> {
    await this.menu.getByRole('link', { name: item, exact: true }).click();
  }
}
