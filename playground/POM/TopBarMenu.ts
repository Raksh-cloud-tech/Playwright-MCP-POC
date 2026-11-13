import { type Locator, type Page } from '@playwright/test';

/**
 * Module tab bar shown under the page header (e.g. Admin > Job > Job Titles).
 * Tabs with a drop-down need the item name as well; plain tabs navigate directly.
 * Note: on narrow viewports the app moves overflow tabs under "More".
 */
export class TopBarMenu {
  private readonly bar: Locator;

  constructor(private readonly page: Page) {
    this.bar = page.getByRole('navigation', { name: 'Topbar Menu' });
  }

  async select(tab: string, item?: string): Promise<void> {
    await this.bar.getByText(tab, { exact: true }).click();
    if (item) {
      await this.page.getByRole('menuitem', { name: item, exact: true }).click();
    }
  }
}
