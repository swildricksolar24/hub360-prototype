import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/Button/Button';
import { Checkbox } from '../../../components/Checkbox/Checkbox';
import { Message } from '../../../components/Message/Message';
import { TextInput } from '../../../components/TextInput/TextInput';
import { AppLink } from '../../components/AppLink';
import { useAuth } from '../../auth/AuthContext';
import { AuthError, rememberedIdentifier } from '../../auth/authService';
import { AuthLayout } from './AuthLayout';
import { PasswordField } from './PasswordField';
import styles from './auth.module.css';

type Errors = { identifier?: string; password?: string };

/**
 * Figma "Sign In (Desktop Only)": Login Default, Input…, Show Password, Remember Me Checked,
 * Signing In, Wrong Credentials, Account Locked and Session Expired.
 */
export function SignInPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const notice = (location.state as { notice?: string } | null)?.notice;

  const [identifier, setIdentifier] = useState(rememberedIdentifier.get);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(() => rememberedIdentifier.get() !== '');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [locked, setLocked] = useState(false);
  const expired = params.get('reason') === 'expired';

  const canSubmit = identifier.trim() !== '' && password !== '' && !busy;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setErrors({});
    try {
      await signIn(identifier, password, remember);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from.startsWith('/app') ? from : '/app', { replace: true });
    } catch (err) {
      setBusy(false);
      const code = err instanceof AuthError ? err.code : null;
      if (code === 'account-locked') setLocked(true);
      else if (code === 'invalid-identifier') setErrors({ identifier: 'Incorrect email or phone number' });
      else setErrors({ password: 'Incorrect password' });
    }
  }

  const alert = locked ? (
    <Message type="error" title="Account Locked" body="Too many failed attempts. Please reset your password to continue." />
  ) : expired ? (
    <Message type="caution" title="Your session has expired. Please sign in again." />
  ) : notice ? (
    <Message type="success" title={notice} />
  ) : null;

  return (
    <AuthLayout
      pageTitle="Sign In"
      title="Welcome"
      subtitle="Please sign in to access your account"
      alert={alert}
      below={
        <>
          <span className={styles.inline}>
            Don’t have an account? <AppLink to="/sign-up" size="medium">Sign Up</AppLink>
          </span>
          <AppLink to="/forgot-password" state={{ email: identifier }} size="medium">
            Forgot Password
          </AppLink>
        </>
      }
    >
      <form className={styles.form} onSubmit={submit} noValidate>
        <TextInput
          label="Email Address or Phone Number"
          name="username"
          autoComplete="username"
          value={identifier}
          onChange={e => setIdentifier(e.target.value)}
          error={errors.identifier}
          disabled={locked}
          autoFocus={!identifier}
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          error={errors.password}
          disabled={locked}
          autoFocus={identifier !== '' && !locked}
        />
        {!locked && (
          <div className={styles.row}>
            <Checkbox size="small" label="Remember me" checked={remember} onChange={e => setRemember(e.target.checked)} />
          </div>
        )}
        {locked ? (
          <Button size="base" variant="brand" block onClick={() => navigate('/forgot-password', { state: { email: identifier } })}>
            Reset Password
          </Button>
        ) : (
          <Button
            type="submit"
            size="base"
            variant="brand"
            block
            disabled={!canSubmit}
            icon={busy ? 'progress-activity' : undefined}
            className={busy ? styles.busy : undefined}
            aria-busy={busy || undefined}
          >
            {busy ? 'Signing In' : 'Sign In'}
          </Button>
        )}
      </form>
    </AuthLayout>
  );
}
