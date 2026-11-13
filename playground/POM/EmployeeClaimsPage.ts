import { type Locator, type Page } from '@playwright/test';
import { ROUTES } from '../Util/constants';
import { ListPage } from './ListPage';

/** Claim > Employee Claims. */
export class EmployeeClaimsPage extends ListPage {
  protected readonly path = ROUTES.employeeClaims;
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Employee Claims' });
  }

  async searchByReferenceId(referenceId: string): Promise<void> {
    await this.searchByText('Reference Id', referenceId);
  }

  async filterByStatus(status: string): Promise<void> {
    await this.searchByOption('Status', status);
  }

  async filterByEvent(eventName: string): Promise<void> {
    await this.searchByOption('Event Name', eventName);
  }

  async openAssignClaim(): Promise<void> {
    await this.clickButton('Assign Claim');
  }

  /** Opens the details of the first matching claim row. */
  async viewDetails(rowText: string): Promise<void> {
    await this.rowByText(rowText).getByRole('button', { name: 'View Details' }).click();
  }
}
