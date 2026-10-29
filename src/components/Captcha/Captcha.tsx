import type { InputHTMLAttributes, ReactNode } from 'react';
import { Checkbox } from '../Checkbox/Checkbox';
import styles from './Captcha.module.css';

export type CaptchaProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  /** Checkbox label. Figma: "I'm not a robot". */
  label?: ReactNode;
};

/**
 * Figma "Captcha" (`State` Unchecked / Checked = the native `checked` state).
 * Visual only: it renders the widget frame and a small Checkbox, with no reCAPTCHA integration.
 * Pass `checked` / `onChange` (or `defaultChecked`) like a checkbox.
 */
export function Captcha({ label = "I'm not a robot", className, ...inputProps }: CaptchaProps) {
  return (
    <div className={[styles.captcha, className].filter(Boolean).join(' ')}>
      <Checkbox size="small" label={label} {...inputProps} />
      <CaptchaMark />
    </div>
  );
}

/**
 * Placeholder for the Recaptcha logo (Figma Logos* › Recaptcha, 543:1693), which isn't exported to code.
 * A neutral arrow mark drawn with tokens, not the Google artwork.
 */
function CaptchaMark() {
  return (
    <svg className={styles.mark} viewBox="0 0 47 45" aria-hidden>
      <path className={styles.markArc} d="M23.5 6a14 14 0 1 1-13.2 9.3" />
      <path className={styles.markHead} d="M6.5 10.5l4.5 6.5 6.5-4.2z" />
      <text className={styles.markText} x="23.5" y="44" textAnchor="middle">
        reCAPTCHA
      </text>
    </svg>
  );
}
