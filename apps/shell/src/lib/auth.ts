export const ACCESS_COOKIE_NAME = "moa_token";
export const REFRESH_COOKIE_NAME = "moa_refresh";
export const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 15;
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9._-]{1,30}[a-z0-9])?$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;

export function validateEmail(email: string) {
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}

export function validateUsername(username: string) {
  return USERNAME_REGEX.test(username.trim().toLowerCase());
}

export function validatePassword(password: string) {
  return PASSWORD_REGEX.test(password);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}
