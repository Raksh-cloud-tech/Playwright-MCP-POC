import js from '@eslint/js';
import playwright from 'eslint-plugin-playwright';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['node_modules/', 'test-results/', 'playwright-report/', 'reports/', 'blob-report/'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Playwright-specific rules (missing awaits, test.only, focused tests, ...) for specs and fixtures.
    ...playwright.configs['flat/recommended'],
    files: ['tests/**/*.ts', 'Fixtures/**/*.ts'],
  },
);
