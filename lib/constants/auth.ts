/**
 * Minimum password length, shared by the server policy and the forms.
 *
 * Better Auth enforces this on sign-up, password reset and password change —
 * never on sign-in — so raising it does not lock out accounts whose existing
 * password is shorter. Keep the forms on this constant: a client minimum below
 * the server's turns a clear field error into a failed request.
 */
export const MIN_PASSWORD_LENGTH = 12;

export const MIN_PASSWORD_MESSAGE = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
