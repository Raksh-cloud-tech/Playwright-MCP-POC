import { BasePage } from './BasePage';

/** Base class for Add / Create screens that end in a submit button and a Cancel button. */
export abstract class FormPage extends BasePage {
  /** Caption of the submit button ("Save" on most screens, "Create" on claims). */
  protected abstract readonly submitLabel: string;

  async submit(): Promise<void> {
    await this.clickButton(this.submitLabel);
  }

  async cancel(): Promise<void> {
    await this.clickButton('Cancel');
  }
}
