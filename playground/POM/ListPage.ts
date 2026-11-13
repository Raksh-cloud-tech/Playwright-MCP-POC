import { BasePage } from './BasePage';

/**
 * Base class for screens with a filter panel and a results table
 * (Search / Reset buttons). Each action waits for the data request it triggers,
 * so no fixed waits are needed.
 */
export abstract class ListPage extends BasePage {
  async search(): Promise<void> {
    await this.clickAndWaitForData('Search');
  }

  async reset(): Promise<void> {
    await this.clickAndWaitForData('Reset');
  }

  async searchByText(label: string, value: string): Promise<void> {
    await this.fillText(label, value);
    await this.search();
  }

  async searchByOption(label: string, option: string): Promise<void> {
    await this.selectOption(label, option);
    await this.search();
  }

  async searchByAutocomplete(label: string, text: string, option: string = text): Promise<void> {
    await this.fillAutocomplete(label, text, option);
    await this.search();
  }

  /** Clicks a button and waits for the API GET it triggers to complete. */
  private async clickAndWaitForData(buttonName: string): Promise<void> {
    await Promise.all([
      this.page.waitForResponse(
        (response) => response.url().includes('/api/v2/') && response.request().method() === 'GET',
      ),
      this.clickButton(buttonName),
    ]);
  }
}
