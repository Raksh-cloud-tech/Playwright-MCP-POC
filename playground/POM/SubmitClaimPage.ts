import { type Locator, type Page } from '@playwright/test';
import { ROUTES } from '../Util/constants';
import { FormPage } from './FormPage';

/** Claim > Submit Claim ("Create Claim Request") form. */
export class SubmitClaimPage extends FormPage {
  protected readonly path = ROUTES.submitClaim;
  protected readonly submitLabel = 'Create';
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Create Claim Request' });
  }

  async selectEvent(eventName: string): Promise<void> {
    await this.selectOption('Event', eventName);
  }

  async selectCurrency(currency: string): Promise<void> {
    await this.selectOption('Currency', currency);
  }

  async fillRemarks(remarks: string): Promise<void> {
    await this.fillText('Remarks', remarks);
  }
}
