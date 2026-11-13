import { type Locator, type Page } from '@playwright/test';
import { ROUTES } from '../Util/constants';
import { FormPage } from './FormPage';

export interface LoginDetailsData {
  username: string;
  password: string;
  enabled?: boolean;
}

/** PIM > Add Employee form (with the optional "Create Login Details" section). */
export class AddEmployeePage extends FormPage {
  protected readonly path = ROUTES.addEmployee;
  protected readonly submitLabel = 'Save';
  readonly heading: Locator;
  readonly firstNameInput: Locator;
  readonly middleNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly employeeIdInput: Locator;
  /** Toggle is a styled switch with no role or label, so a CSS class is the fallback. */
  readonly createLoginDetailsSwitch: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Add Employee' });
    this.firstNameInput = page.getByPlaceholder('First Name');
    this.middleNameInput = page.getByPlaceholder('Middle Name');
    this.lastNameInput = page.getByPlaceholder('Last Name');
    this.employeeIdInput = this.field('Employee Id').getByRole('textbox');
    this.createLoginDetailsSwitch = page.locator('.oxd-switch-wrapper');
  }

  async fillName(first: string, last: string, middle = ''): Promise<void> {
    await this.firstNameInput.fill(first);
    await this.middleNameInput.fill(middle);
    await this.lastNameInput.fill(last);
  }

  async fillEmployeeId(employeeId: string): Promise<void> {
    await this.employeeIdInput.fill(employeeId);
  }

  async enableLoginDetails(): Promise<void> {
    await this.createLoginDetailsSwitch.click();
  }

  async fillLoginDetails(data: LoginDetailsData): Promise<void> {
    await this.fillText('Username', data.username);
    await this.fillText('Password', data.password);
    await this.fillText('Confirm Password', data.password);
    await this.selectLoginStatus(data.enabled ?? true);
  }

  /** The status radios are custom-styled, so the wrapper text is used to pick one. */
  private async selectLoginStatus(enabled: boolean): Promise<void> {
    const caption = enabled ? 'Enabled' : 'Disabled';
    await this.page.locator('.oxd-radio-wrapper').filter({ hasText: caption }).click();
  }
}
