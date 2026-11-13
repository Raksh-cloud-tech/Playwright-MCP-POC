import { type Locator, type Page } from '@playwright/test';
import { ROUTES } from '../Util/constants';
import { BasePage } from './BasePage';

/** Time > Timesheets > Employee Timesheets. */
export class TimesheetsPage extends BasePage {
  protected readonly path = ROUTES.timesheets;
  readonly heading: Locator;
  readonly pendingActionHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Select Employee' });
    this.pendingActionHeading = page.getByRole('heading', { name: 'Timesheets Pending Action' });
  }

  async selectEmployee(typedText: string, optionText: string = typedText): Promise<void> {
    await this.fillAutocomplete('Employee Name', typedText, optionText);
  }

  async viewTimesheet(): Promise<void> {
    await this.clickButton('View');
  }
}
