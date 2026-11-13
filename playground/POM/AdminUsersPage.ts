import { type Locator, type Page } from '@playwright/test';
import { ROUTES } from '../Util/constants';
import { ListPage } from './ListPage';

/** Admin > User Management > Users (System Users). */
export class AdminUsersPage extends ListPage {
  protected readonly path = ROUTES.adminUsers;
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'System Users' });
  }

  async searchByUsername(username: string): Promise<void> {
    await this.searchByText('Username', username);
  }

  async filterByRole(role: string): Promise<void> {
    await this.searchByOption('User Role', role);
  }

  async filterByStatus(status: string): Promise<void> {
    await this.searchByOption('Status', status);
  }

  async filterByEmployee(typedText: string, optionText: string = typedText): Promise<void> {
    await this.searchByAutocomplete('Employee Name', typedText, optionText);
  }

  async openAddUser(): Promise<void> {
    await this.clickButton('Add');
  }

  /** Action buttons are icon-only (no accessible name): the first is Delete, the second Edit. */
  deleteButtonFor(username: string): Locator {
    return this.rowByText(username).getByRole('button').first();
  }

  editButtonFor(username: string): Locator {
    return this.rowByText(username).getByRole('button').last();
  }

  async deleteUser(username: string): Promise<void> {
    await this.deleteButtonFor(username).click();
    await this.confirmDeletion();
  }

  get usernameFilter(): Locator {
    return this.field('Username').getByRole('textbox');
  }
}
