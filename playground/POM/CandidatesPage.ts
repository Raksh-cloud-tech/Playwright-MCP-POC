import { type Locator, type Page } from '@playwright/test';
import { ROUTES } from '../Util/constants';
import { ListPage } from './ListPage';

/** Recruitment > Candidates. */
export class CandidatesPage extends ListPage {
  protected readonly path = ROUTES.candidates;
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Candidates' });
  }

  async searchByKeywords(keywords: string): Promise<void> {
    await this.searchByText('Keywords', keywords);
  }

  async filterByStatus(status: string): Promise<void> {
    await this.searchByOption('Status', status);
  }

  async filterByVacancy(vacancy: string): Promise<void> {
    await this.searchByOption('Vacancy', vacancy);
  }

  async openAddCandidate(): Promise<void> {
    await this.clickButton('Add');
  }
}
