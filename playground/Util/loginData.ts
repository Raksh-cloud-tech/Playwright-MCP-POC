export interface Credentials {
  username: string;
  password: string;
}

/** Public demo credentials; override via environment for other environments. */
export const VALID_USER: Credentials = {
  username: process.env.OHRM_USERNAME ?? 'Admin',
  password: process.env.OHRM_PASSWORD ?? 'admin123',
};

/** Display name shown in the dashboard header for VALID_USER (demo data can change). */
export const EXPECTED_DISPLAY_NAME = process.env.OHRM_DISPLAY_NAME ?? 'John Doe';

/** The public demo has no locked account; supply one via environment to enable that test. */
export const LOCKED_USER: Credentials | undefined =
  process.env.OHRM_LOCKED_USERNAME && process.env.OHRM_LOCKED_PASSWORD
    ? { username: process.env.OHRM_LOCKED_USERNAME, password: process.env.OHRM_LOCKED_PASSWORD }
    : undefined;

export const WRONG_PASSWORD = 'definitely-wrong-password';
export const UNKNOWN_USERNAME = 'no.such.user';
export const SPECIAL_CHAR_PASSWORD = '!@#$%^&*()_+-=[]{}|;:\'",.<>/?`~';

export const SQLI_PAYLOADS: readonly string[] = [
  "' OR '1'='1",
  "admin'--",
  "' OR 1=1; DROP TABLE users; --",
];

/** Each payload sets a flag if executed, so tests can detect script execution. */
export const XSS_PAYLOADS: readonly string[] = [
  '<script>window.__xss=true</script>',
  '"><img src=x onerror=window.__xss=true>',
  '<svg onload=window.__xss=true>',
];

export const LONG_INPUT_LENGTH = 5000;
export const buildLongString = (length: number, char = 'a'): string => char.repeat(length);
