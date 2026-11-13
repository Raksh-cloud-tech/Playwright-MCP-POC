import { type Locator, type Page } from '@playwright/test';
import { absoluteUrl } from '../Util/constants';

/**
 * Base class for every OrangeHRM page.
 * Holds the behaviour shared by all screens (navigation, loader, toast, dialog, form
 * fields, tables). Contains no assertions: tests decide what to verify.
 */
export abstract class BasePage {
  /** Route of the page, relative to BASE_URL. */
  protected abstract readonly path: string;
  /** A heading that is visible once the page content has rendered. */
  abstract readonly heading: Locator;

  readonly toast: Locator;
  readonly dialog: Locator;
  readonly recordsFound: Locator;
  /** Data rows only: the header row has column headers, not cells. */
  readonly tableRows: Locator;
  /** The app draws its loader with CSS classes only; there is no semantic hook. */
  private readonly spinner: Locator;

  constructor(protected readonly page: Page) {
    this.toast = page.locator('.oxd-toast');
    this.dialog = page.getByRole('dialog');
    // "No Records Found" can also appear in a toast, so take the first match.
    this.recordsFound = page.getByText(/Records? Found/).first();
    this.tableRows = page.getByRole('row').filter({ has: page.getByRole('cell') });
    this.spinner = page.locator('.oxd-loading-spinner');
  }

  /** Opens the page directly and waits for it to finish loading. */
  async goto(): Promise<void> {
    await this.page.goto(absoluteUrl(this.path));
    await this.waitForLoaded();
  }

  /** Waits for the page heading, then for the loader to disappear. */
  async waitForLoaded(): Promise<void> {
    await this.heading.first().waitFor({ state: 'visible' });
    await this.spinner.first().waitFor({ state: 'hidden' });
  }

  /** Inline validation message(s) shown under a field. */
  fieldError(label: string): Locator {
    return this.field(label).locator('.oxd-input-field-error-message');
  }

  /** Table row containing the given text. */
  rowByText(text: string): Locator {
    return this.tableRows.filter({ hasText: text });
  }

  async confirmDeletion(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Yes, Delete' }).click();
  }

  async cancelDeletion(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'No, Cancel' }).click();
  }

  /** Form group (label + control + error) identified by its label text. */
  protected field(label: string): Locator {
    return this.page
      .locator('.oxd-input-group')
      .filter({ has: this.page.getByText(label, { exact: true }) });
  }

  protected async clickButton(name: string): Promise<void> {
    // Exact match: names such as "Post" otherwise also match "Most Recent Posts".
    await this.page.getByRole('button', { name, exact: true }).click();
  }

  protected async fillText(label: string, value: string): Promise<void> {
    await this.field(label).getByRole('textbox').first().fill(value);
  }

  /** Custom dropdown: the trigger is a div, the options are real role=option items. */
  protected async selectOption(label: string, option: string): Promise<void> {
    await this.field(label).locator('.oxd-select-text').click();
    await this.page.getByRole('option', { name: option, exact: true }).click();
  }

  /** Type-ahead field; waits for the (asynchronously loaded) suggestion to appear. */
  protected async fillAutocomplete(label: string, text: string, option: string = text): Promise<void> {
    await this.field(label).getByPlaceholder('Type for hints...').fill(text);
    await this.page.getByRole('option', { name: option }).first().click();
  }
}
