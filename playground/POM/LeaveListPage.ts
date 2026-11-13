import { type Locator, type Page } from '@playwright/test';
import { ROUTES } from '../Util/constants';
import { ListPage } from './ListPage';

/** Leave > Leave List. */
export class LeaveListPage extends ListPage {
  protected readonly path = ROUTES.leaveList;
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Leave List' });
  }

  async filterByLeaveType(leaveType: string): Promise<void> {
    await this.searchByOption('Leave Type', leaveType);
  }

  async filterBySubUnit(subUnit: string): Promise<void> {
    await this.searchByOption('Sub Unit', subUnit);
  }

  async filterByEmployee(typedText: string, optionText: string = typedText): Promise<void> {
    await this.searchByAutocomplete('Employee Name', typedText, optionText);
  }

  /** Dates use the app's configured format (yyyy-dd-mm on the demo). */
  async fillDateRange(from: string, to: string): Promise<void> {
    await this.fillText('From Date', from);
    await this.fillText('To Date', to);
  }
}
