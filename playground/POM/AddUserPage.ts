import { type Locator, type Page } from '@playwright/test';
import { ROUTES } from '../Util/constants';
import { FormPage } from './FormPage';

export interface NewUserData {
  role: string;
  status: string;
  /** Text typed into the employee type-ahead. */
  employeeSearch: string;
  /** Suggestion to pick; defaults to employeeSearch. */
  employeeOption?: string;
  username: string;
  password: string;
}

/** Admin > Add User form. */
export class AddUserPage extends FormPage {
  protected readonly path = ROUTES.addUser;
  protected readonly submitLabel = 'Save';
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Add User' });
  }

  async selectRole(role: string): Promise<void> {
    await this.selectOption('User Role', role);
  }

  async selectStatus(status: string): Promise<void> {
    await this.selectOption('Status', status);
  }

  async chooseEmployee(typedText: string, optionText: string = typedText): Promise<void> {
    await this.fillAutocomplete('Employee Name', typedText, optionText);
  }

  async fillUsername(username: string): Promise<void> {
    await this.fillText('Username', username);
  }

  async fillPassword(password: string, confirmation: string = password): Promise<void> {
    await this.fillText('Password', password);
    await this.fillText('Confirm Password', confirmation);
  }

  async fillForm(data: NewUserData): Promise<void> {
    await this.selectRole(data.role);
    await this.chooseEmployee(data.employeeSearch, data.employeeOption);
    await this.selectStatus(data.status);
    await this.fillUsername(data.username);
    await this.fillPassword(data.password);
  }
}
