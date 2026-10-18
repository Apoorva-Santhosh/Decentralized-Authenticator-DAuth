// Shared input limits; never trim, normalize, or truncate a valid password.
export const MIN_PASSWORD_LENGTH = 15;
export const MAX_PASSWORD_LENGTH = 128;

export function passwordError(password, registration = false) {
  if (typeof password !== 'string' || !password.trim()) return 'Please enter a non-empty password.';
  const length = Array.from(password).length;
  if (length > MAX_PASSWORD_LENGTH) return `Use at most ${MAX_PASSWORD_LENGTH} characters.`;
  if (registration && length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters. A passphrase is welcome.`;
  return '';
}
