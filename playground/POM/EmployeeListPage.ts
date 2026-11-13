import { type Locator, type Page } from '@playwright/test';
import { ROUTES } from '../Util/constants';
import { ListPage } from './ListPage';

/** PIM > Employee List. */
export class EmployeeListPage extends ListPage {
  protected readonly path = ROUTES.employeeList;
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Employee Information' });
  }

  async searchByEmployeeId(employeeId: string): Promise<void> {
    await this.searchByText('Employee Id', employeeId);
  }

  async searchByEmployeeName(typedText: string, optionText: string = typedText): Promise<void> {
    await this.searchByAutocomplete('Employee Name', typedText, optionText);
  }

  async filterByJobTitle(jobTitle: string): Promise<void> {
    await this.searchByOption('Job Title', jobTitle);
  }

  async filterByEmploymentStatus(status: string): Promise<void> {
    await this.searchByOption('Employment Status', status);
  }

  async openAddEmployee(): Promise<void> {
    await this.clickButton('Add');
  }
}
