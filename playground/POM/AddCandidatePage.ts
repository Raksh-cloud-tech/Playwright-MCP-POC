import { type Locator, type Page } from '@playwright/test';
import { ROUTES } from '../Util/constants';
import { FormPage } from './FormPage';

/** Recruitment > Candidates > Add Candidate form. */
export class AddCandidatePage extends FormPage {
  protected readonly path = ROUTES.addCandidate;
  protected readonly submitLabel = 'Save';
  readonly heading: Locator;
  readonly firstNameInput: Locator;
  readonly middleNameInput: Locator;
  readonly lastNameInput: Locator;
  /** The upload control is a hidden native file input; there is no role for it. */
  readonly resumeInput: Locator;
  readonly consentCheckbox: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Add Candidate' });
    this.firstNameInput = page.getByPlaceholder('First Name');
    this.middleNameInput = page.getByPlaceholder('Middle Name');
    this.lastNameInput = page.getByPlaceholder('Last Name');
    this.resumeInput = page.locator('input[type="file"]');
    this.consentCheckbox = page.getByRole('checkbox');
  }

  async fillName(first: string, last: string, middle = ''): Promise<void> {
    await this.firstNameInput.fill(first);
    await this.middleNameInput.fill(middle);
    await this.lastNameInput.fill(last);
  }

  async selectVacancy(vacancy: string): Promise<void> {
    await this.selectOption('Vacancy', vacancy);
  }

  async fillEmail(email: string): Promise<void> {
    await this.fillText('Email', email);
  }

  async fillContactNumber(contactNumber: string): Promise<void> {
    await this.fillText('Contact Number', contactNumber);
  }

  async fillKeywords(keywords: string): Promise<void> {
    await this.fillText('Keywords', keywords);
  }

  async fillNotes(notes: string): Promise<void> {
    await this.fillText('Notes', notes);
  }

  async uploadResume(filePath: string): Promise<void> {
    await this.resumeInput.setInputFiles(filePath);
  }
}
