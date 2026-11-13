import { type Locator, type Page } from '@playwright/test';
import { ROUTES } from '../Util/constants';
import { BasePage } from './BasePage';

/** My Info / PIM employee "Personal Details" screen and its section tabs. */
export class PersonalDetailsPage extends BasePage {
  protected readonly path = ROUTES.myInfo;
  readonly heading: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Personal Details' });
    this.firstNameInput = page.getByPlaceholder('First Name');
    this.lastNameInput = page.getByPlaceholder('Last Name');
  }

  /** Section tab (Contact Details, Emergency Contacts, Job, ...). */
  tab(name: string): Locator {
    return this.page.getByRole('link', { name, exact: true });
  }

  async openTab(name: string): Promise<void> {
    await this.tab(name).click();
  }

  /** The first Save button belongs to the Personal Details form. */
  async savePersonalDetails(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save', exact: true }).first().click();
  }
}
