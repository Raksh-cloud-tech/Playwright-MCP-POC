/**
 * Side-effect module: loads variables from a local `.env` file (if present) into process.env.
 * Import it before any module that reads process.env (see playwright.config.ts).
 *
 * Uses Node's built-in loader (Node 20.12+), so no extra dependency is needed.
 * Variables that are already set (for example by a CI system) are never overwritten.
 */
try {
  process.loadEnvFile();
} catch {
  // No .env file (normal on CI) or an older Node version: rely on the real environment and defaults.
}

export {};
