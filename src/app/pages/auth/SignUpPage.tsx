import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/Button/Button';
import { Captcha } from '../../../components/Captcha/Captcha';
import { Dropdown } from '../../../components/Dropdown/Dropdown';
import { TextArea } from '../../../components/TextArea/TextArea';
import { TextInput } from '../../../components/TextInput/TextInput';
import { AppLink } from '../../components/AppLink';
import { requestAccount } from '../../auth/authService';
import { AuthLayout } from './AuthLayout';
import { US_STATES } from './usStates';
import styles from './auth.module.css';

type FieldKey =
  | 'fullName' | 'email' | 'phone'
  | 'company' | 'dba' | 'address1' | 'address2' | 'city' | 'state' | 'zip' | 'ein' | 'registrationState' | 'website' | 'comments';

/** Figma "Sign Up" fields; `*` = required, matching the Figma labels. */
const FIELDS: Record<FieldKey, { label: string; required?: boolean; type?: string; autoComplete?: string }> = {
  // Figma has separate First Name / Last Name fields; the prototype combines them into one.
  fullName: { label: 'Full Name', required: true, autoComplete: 'name' },
  email: { label: 'Email Address', required: true, type: 'email', autoComplete: 'email' },
  phone: { label: 'Phone Number', required: true, type: 'tel', autoComplete: 'tel' },
  company: { label: 'Company Name', required: true, autoComplete: 'organization' },
  dba: { label: 'DBA Name' },
  address1: { label: 'Address Line 1', autoComplete: 'address-line1' },
  address2: { label: 'Address Line 2', autoComplete: 'address-line2' },
  city: { label: 'City', autoComplete: 'address-level2' },
  state: { label: 'State' },
  zip: { label: 'Zip Code', autoComplete: 'postal-code' },
  ein: { label: 'EIN', required: true },
  registrationState: { label: 'Registration State' },
  website: { label: 'Business Website', type: 'url', autoComplete: 'url' },
  comments: { label: 'Comments' },
};
const REQUIRED = (Object.keys(FIELDS) as FieldKey[]).filter(k => FIELDS[k].required);

/** Fictional details for the "Fill sample info" prototype button (example.com email, 555 phone number). */
const SAMPLE: Record<FieldKey, string> = {
  fullName: 'Oswald Cobblepot',
  email: 'oswald@example.com',
  phone: '(555) 010-2468',
  company: 'Iceberg Solar LLC',
  dba: 'Iceberg Solar',
  address1: '100 Harbor Way',
  address2: 'Suite 200',
  city: 'Austin',
  state: 'Texas',
  zip: '78701',
  ein: '12-3456789',
  registrationState: 'Texas',
  website: 'https://example.com',
  comments: 'Looking to manage our solar installs in HUB 360.',
};

/** Figma "Sign Up: Default / All required Info Filled In / Button Pressed / Error". */
export function SignUpPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<Partial<Record<FieldKey, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [human, setHuman] = useState(false);
  const [busy, setBusy] = useState(false);

  const missing = REQUIRED.filter(k => !values[k]?.trim());
  const canSubmit = missing.length === 0 && human && !busy;
  const errorFor = (k: FieldKey) => (touched[k] && FIELDS[k].required && !values[k]?.trim() ? `${FIELDS[k].label} is Required` : undefined);

  const set = (k: FieldKey) => (value: string) => setValues(v => ({ ...v, [k]: value }));
  const text = (k: FieldKey) => (
    <TextInput
      label={
        <>
          {FIELDS[k].label}
          {/* Red like "*Indicates Required Field"; aria-required already tells screen readers */}
          {FIELDS[k].required && (
            <span className={styles.requiredMark} aria-hidden="true">
              *
            </span>
          )}
        </>
      }
      name={k}
      type={FIELDS[k].type}
      autoComplete={FIELDS[k].autoComplete}
      aria-required={FIELDS[k].required || undefined}
      value={values[k] ?? ''}
      onChange={e => set(k)(e.target.value)}
      onBlur={() => setTouched(t => ({ ...t, [k]: true }))}
      error={errorFor(k)}
    />
  );
  const stateSelect = (k: 'state' | 'registrationState') => (
    <Dropdown
      label={FIELDS[k].label}
      placeholder="Select"
      options={US_STATES}
      value={values[k] ?? null}
      onChange={v => set(k)(String(v))}
    />
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(Object.fromEntries(REQUIRED.map(k => [k, true])));
    if (!canSubmit) return;
    setBusy(true);
    await requestAccount(values as Record<string, string>);
    navigate('/sign-in', { replace: true, state: { notice: 'Thanks! Your account request was submitted. We’ll email you when it’s approved.' } });
  }

  return (
    <AuthLayout
      pageTitle="Sign Up"
      title="Welcome"
      subtitle="Create Your Account to Access All Features"
      wide
      tools={
        // Prototype shortcuts (not in Figma): fill or clear the contact and business fields; the captcha stays for the user.
        <>
          <Button
            size="small"
            variant="outline"
            icon="edit"
            onClick={() => {
              setValues(SAMPLE);
              setTouched({});
            }}
            disabled={busy}
          >
            Fill sample info
          </Button>
          <Button
            size="small"
            variant="outline"
            icon="delete"
            onClick={() => {
              setValues({});
              setTouched({});
            }}
            disabled={busy}
          >
            Remove sample info
          </Button>
        </>
      }
      below={
        <span className={styles.inline}>
          Already have an account? <AppLink to="/sign-in" size="medium">Sign In</AppLink>
        </span>
      }
    >
      <form className={styles.form} style={{ gap: 'var(--space-48)' }} onSubmit={submit} noValidate>
        {/* Required-field note, right-aligned just above the first section */}
        <div className={styles.firstSection}>
          <p className={`${styles.required} ${styles.requiredNote}`}>*Indicates Required Field</p>
          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>Contact Information</legend>
            <div className={styles.grid}>
              <div className={styles.full}>{text('fullName')}</div>
              {text('email')}
              {text('phone')}
            </div>
          </fieldset>
        </div>

        <fieldset className={styles.section}>
          <legend className={styles.sectionTitle}>Business Information</legend>
          <div className={styles.grid}>
            {text('company')}
            {text('dba')}
            {text('address1')}
            {text('address2')}
            {text('city')}
            <div className={styles.pair}>
              {stateSelect('state')}
              {text('zip')}
            </div>
            {text('ein')}
            {stateSelect('registrationState')}
            {text('website')}
            <div />
            <div className={styles.full}>
              <TextArea label="Comments" name="comments" value={values.comments ?? ''} onChange={e => set('comments')(e.target.value)} />
            </div>
          </div>
        </fieldset>

        <div className={styles.legal}>
          <p>
            <strong>Disclaimer</strong>
          </p>
          <p>
            By signing this form, you affirm that all information provided herein is complete, true, and correct to the best of your knowledge and
            belief. You understand that any misrepresentation, falsification, or omission of any facts called for in the application may render the
            application void and will cause for immediate termination of any relationship, whenever discovered. You authorize the Company to contact
            you via any method including phone, text, email, and mail-in connection with this application. You authorize the Company to conduct any
            investigation it deems appropriate concerning your application. You hereby authorize and request former employers, employees, agents,
            contractors, customers, or any other persons to disclose credit, employment, criminal, or any other information that may be sought in
            connection with this application. You hereby release all of the above-mentioned from all liability in connection with those disclosures.
            If your application is successfully processed and you are offered a position in the Company’s network, you agree to abide by all rules,
            regulations, policies, and procedures of the Company, which may change from time to time, without prior notice or your consent.
          </p>
          <p>By clicking sign up you indicate that you have read and agree to the Terms and Conditions and Privacy Policy.</p>
        </div>

        <div className={styles.captcha}>
          {/* Logo a little larger than Figma's 45px so it stays legible */}
          <Captcha className={styles.captchaWidget} logoHeight={51} checked={human} onChange={e => setHuman(e.target.checked)} />
        </div>

        <div className={styles.actions}>
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
            Sign Up
          </Button>
          <Button size="base" variant="outline" block onClick={() => navigate('/sign-in')}>
            Cancel
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
