import { type Locator, type Page } from '@playwright/test';
import { ROUTES } from '../Util/constants';
import { ListPage } from './ListPage';

/** Performance > Manage Reviews > Employee Reviews. */
export class PerformanceReviewsPage extends ListPage {
  protected readonly path = ROUTES.performanceReviews;
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Employee Reviews' });
  }

  async filterByReviewStatus(status: string): Promise<void> {
    await this.searchByOption('Review Status', status);
  }

  async filterByJobTitle(jobTitle: string): Promise<void> {
    await this.searchByOption('Job Title', jobTitle);
  }

  async filterByEmployee(typedText: string, optionText: string = typedText): Promise<void> {
    await this.searchByAutocomplete('Employee Name', typedText, optionText);
  }
}
