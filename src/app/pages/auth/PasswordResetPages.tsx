import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/Button/Button';
import { Icon } from '../../../components/Icon/Icon';
import { Message } from '../../../components/Message/Message';
import { Hyperlink } from '../../../components/Hyperlink/Hyperlink';
import { TextInput } from '../../../components/TextInput/TextInput';
import { AppLink } from '../../components/AppLink';
import { DEMO_VERIFICATION_CODE, demoCredentials, requestPasswordReset, resendCode, resetPassword, verifyCode } from '../../auth/authService';
import { AuthLayout } from './AuthLayout';
import { PasswordField } from './PasswordField';
import styles from './auth.module.css';

/** The email being reset survives a refresh during the three-step flow. */
const flow = {
  key: 'hub360.resetEmail',
  get: () => {
    try {
      return sessionStorage.getItem(flow.key) ?? '';
    } catch {
      return '';
    }
  },
  set: (email: string | null) => {
    try {
      if (email) sessionStorage.setItem(flow.key, email);
      else sessionStorage.removeItem(flow.key);
    } catch {
      /* in-memory only */
    }
  },
};

const PROBLEM =
  'Sorry, there was a problem verifying your email address, phone number, or password. Please double-check your information and try again.';

const signUpLinks = (
  <>
    <span className={styles.inline}>
      Don’t have an account? <AppLink to="/sign-up" size="medium">Sign Up</AppLink>
    </span>
    <AppLink to="/sign-in" size="medium">
      Back to Sign In
    </AppLink>
  </>
);

/** Step 1 — Figma "Login: Email Verification" (email entry, with the problem message on failure). */
export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const prefill = (useLocation().state as { email?: string } | null)?.email ?? flow.get();
  const [email, setEmail] = useState(prefill.includes('@') ? prefill : '');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await requestPasswordReset(email);
      flow.set(email.trim());
      navigate('/verify-email');
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      pageTitle="Forgot Password"
      title="Forgot Password"
      subtitle="Please enter your email address to reset your password"
      alert={failed ? <Message type="error" title={PROBLEM} /> : null}
      tools={
        // Prototype shortcut (not in Figma): fill in the demo account's email.
        <Button
          size="small"
          variant="outline"
          icon="email"
          onClick={() => {
            setEmail(demoCredentials().identifier);
            setFailed(false);
          }}
          disabled={busy}
        >
          Use demo email
        </Button>
      }
      below={signUpLinks}
    >
      <form className={styles.form} onSubmit={submit} noValidate>
        <TextInput label="Email Address" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
        <Button
          type="submit"
          size="base"
          variant="brand"
          block
          disabled={!email.trim() || busy}
          icon={busy ? 'progress-activity' : undefined}
          className={busy ? styles.busy : undefined}
          aria-busy={busy || undefined}
        >
          Send Verification Code
        </Button>
      </form>
    </AuthLayout>
  );
}

/** Step 2 — Figma "Login: Email Verification (Code Resent)". */
export function VerifyEmailPage() {
  const navigate = useNavigate();
  const email = flow.get();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  if (!email) return <Navigate to="/forgot-password" replace />;

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (code.length !== 6 || busy) return;
    setBusy(true);
    setInvalid(false);
    try {
      await verifyCode(email, code);
      navigate('/reset-password');
    } catch {
      setInvalid(true);
      setResent(false);
      setBusy(false);
    }
  }

  async function resend() {
    setResending(true);
    await resendCode(email);
    setResending(false);
    setResent(true);
    setInvalid(false);
    setCode('');
  }

  return (
    <AuthLayout
      pageTitle="Email Verification"
      title="Email Verification"
      subtitle="Enter the verification code sent to your email"
      tools={
        // Prototype shortcut (not in Figma): fill in the code the prototype accepts.
        <Button
          size="small"
          variant="outline"
          icon="lock"
          onClick={() => {
            setCode(DEMO_VERIFICATION_CODE);
            setInvalid(false);
          }}
          disabled={busy}
        >
          Use demo code
        </Button>
      }
      below={signUpLinks}
    >
      <form className={styles.form} onSubmit={submit} noValidate>
        {/* Figma "inputs": one code field, the resend status and the Resend Code link */}
        <div className={styles.codeGroup}>
          <TextInput
            className={styles.code}
            label="Verification Code"
            placeholder="— — — — — —"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={e => {
              setCode(e.target.value.replace(/\D/g, ''));
              setInvalid(false);
            }}
            error={invalid ? 'That code is incorrect or has expired' : undefined}
            autoFocus
          />
          <p className={styles.resent} role="status">
            {resent ? 'Code resent! Check your inbox.' : ''}
          </p>
          <Hyperlink
            size="medium"
            href="#"
            role="button"
            disabled={resending}
            onClick={e => {
              e.preventDefault();
              resend();
            }}
          >
            Resend Code
          </Hyperlink>
        </div>
        <Button
          type="submit"
          size="base"
          variant="brand"
          block
          disabled={code.length !== 6 || busy}
          icon={busy ? 'progress-activity' : undefined}
          className={busy ? styles.busy : undefined}
          aria-busy={busy || undefined}
        >
          Verify
        </Button>
      </form>
    </AuthLayout>
  );
}

/** Step 3 — Figma "Forgot Password: Default / Button Enabled / Button Clicked / Passwords Do Not Match". */
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const email = flow.get();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [mismatch, setMismatch] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!email) return <Navigate to="/forgot-password" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!password || !confirm || busy) return;
    if (password !== confirm) {
      setMismatch(true);
      return;
    }
    setBusy(true);
    await resetPassword(email, password);
    flow.set(null);
    navigate('/reset-password/success', { replace: true });
  }

  return (
    <AuthLayout
      pageTitle="Reset Password"
      title="Reset Password"
      subtitle="Enter a new password for your account"
      tools={
        // Prototype shortcut (not in Figma): reuse the demo account's current password in both fields.
        <Button
          size="small"
          variant="outline"
          icon="lock"
          onClick={() => {
            const { password: demo } = demoCredentials();
            setPassword(demo);
            setConfirm(demo);
            setMismatch(false);
          }}
          disabled={busy}
        >
          Use demo password
        </Button>
      }
      below={signUpLinks}
    >
      <form className={styles.form} onSubmit={submit} noValidate>
        <PasswordField label="New Password" autoComplete="new-password" value={password} onChange={e => { setPassword(e.target.value); setMismatch(false); }} autoFocus />
        <PasswordField
          label="Confirm Password"
          autoComplete="new-password"
          value={confirm}
          onChange={e => { setConfirm(e.target.value); setMismatch(false); }}
          error={mismatch ? 'Passwords do not match' : undefined}
        />
        <Button
          type="submit"
          size="base"
          variant="brand"
          block
          disabled={!password || !confirm || busy}
          icon={busy ? 'progress-activity' : undefined}
          className={busy ? styles.busy : undefined}
          aria-busy={busy || undefined}
        >
          Reset Password
        </Button>
      </form>
    </AuthLayout>
  );
}

/** Figma "Password Reset: Success". */
export function ResetSuccessPage() {
  const navigate = useNavigate();
  return (
    <AuthLayout
      pageTitle="Password Reset"
      title="Password Reset Successfully!"
      subtitle="Your password has been updated. You can now sign in with your new password."
      alert={
        <div className={styles.successIcon}>
          <Icon name="success" size={48} color="var(--color-semantic-fill-success-strong)" />
        </div>
      }
    >
      <Button size="base" variant="brand" block onClick={() => navigate('/sign-in', { replace: true })} autoFocus>
        Sign In
      </Button>
    </AuthLayout>
  );
}
