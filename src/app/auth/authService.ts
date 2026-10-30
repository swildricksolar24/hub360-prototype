/**
 * Mock authentication backend for the prototype. Everything lives in memory (plus localStorage for
 * "remember me"), with a short delay so loading states are visible. Swap this module for real API calls;
 * the screens only depend on the functions and error codes exported here.
 */

export type User = { id: string; name: string; email: string; initials: string };

export type AuthErrorCode =
  | 'invalid-identifier' // Figma "Login: Wrong Credentials" — email/phone not found
  | 'invalid-password' // Figma "Login: Wrong Credentials" — password wrong
  | 'account-locked' // Figma "Login: Account Locked"
  | 'unknown-email' // Figma "Login: Email Verification" problem message
  | 'invalid-code';

export class AuthError extends Error {
  constructor(public code: AuthErrorCode) {
    super(code);
  }
}

/** Failed sign-ins allowed before the account locks (Figma: "Too many failed attempts"). */
export const MAX_FAILED_ATTEMPTS = 3;
/** Signed-in sessions expire after this long without activity (Figma: "Login: Session Expired"). */
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
/** The prototype accepts this verification code (filled in by the verification screen's "Use demo code" button). */
export const DEMO_VERIFICATION_CODE = '123456';

type Account = User & { phone: string; password: string; failedAttempts: number; locked: boolean };

// Demo account taken from the Figma screens (oswaldc@gmail.com / bat8992).
const accounts: Account[] = [
  { id: 'u1', name: 'Oswald Cobblepot', email: 'oswaldc@gmail.com', phone: '1234567891', initials: 'OC', password: 'bat8992', failedAttempts: 0, locked: false },
];

/** The demo account's current sign-in details, for the sign-in screen's "Use demo account" button. */
export const demoCredentials = () => ({ identifier: accounts[0].email, password: accounts[0].password });

const delay = (ms = 700) => new Promise(resolve => setTimeout(resolve, ms));
const normalize = (identifier: string) => identifier.trim().toLowerCase().replace(/[\s()-]/g, '');
const find = (identifier: string) => accounts.find(a => a.email === normalize(identifier) || a.phone === normalize(identifier));
const toUser = ({ id, name, email, initials }: Account): User => ({ id, name, email, initials });

export async function signIn(identifier: string, password: string): Promise<User> {
  await delay();
  const account = find(identifier);
  if (!account) throw new AuthError('invalid-identifier');
  if (account.locked) throw new AuthError('account-locked');
  if (account.password !== password) {
    account.failedAttempts += 1;
    if (account.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      account.locked = true;
      throw new AuthError('account-locked');
    }
    throw new AuthError('invalid-password');
  }
  account.failedAttempts = 0;
  return toUser(account);
}

/** Step 1 of password reset: sends a verification code to the account's email. */
export async function requestPasswordReset(email: string): Promise<void> {
  await delay();
  if (!find(email)) throw new AuthError('unknown-email');
}

export async function resendCode(email: string): Promise<void> {
  await delay(400);
  if (!find(email)) throw new AuthError('unknown-email');
}

/** Step 2: checks the 6-digit code. */
export async function verifyCode(email: string, code: string): Promise<void> {
  await delay();
  if (!find(email) || code !== DEMO_VERIFICATION_CODE) throw new AuthError('invalid-code');
}

/** Step 3: sets the new password and unlocks the account. */
export async function resetPassword(email: string, password: string): Promise<void> {
  await delay();
  const account = find(email);
  if (!account) throw new AuthError('unknown-email');
  account.password = password;
  account.failedAttempts = 0;
  account.locked = false;
}

export type SignUpRequest = Record<string, string>;

/** Sign-up submits an account request; there is no instant account in the prototype. */
export async function requestAccount(request: SignUpRequest): Promise<void> {
  await delay();
  void request;
}

const REMEMBER_KEY = 'hub360.rememberedIdentifier';

export const rememberedIdentifier = {
  get(): string {
    try {
      return localStorage.getItem(REMEMBER_KEY) ?? '';
    } catch {
      return '';
    }
  },
  set(value: string | null) {
    try {
      if (value) localStorage.setItem(REMEMBER_KEY, value);
      else localStorage.removeItem(REMEMBER_KEY);
    } catch {
      /* storage unavailable: remember me is best-effort */
    }
  },
};
