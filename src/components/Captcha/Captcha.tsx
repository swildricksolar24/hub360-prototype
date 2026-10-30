import type { InputHTMLAttributes, ReactNode } from 'react';
import { Checkbox } from '../Checkbox/Checkbox';
import { Logo } from '../Logo/Logo';
import styles from './Captcha.module.css';

export type CaptchaProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  /** Checkbox label. Figma: "I'm not a robot". */
  label?: ReactNode;
  /** Recaptcha logo height in px; the width follows the artwork. Figma: 45 (47×45). */
  logoHeight?: number;
};

/**
 * Figma "Captcha" (`State` Unchecked / Checked = the native `checked` state).
 * Visual only: it renders the widget frame, a small Checkbox and the Recaptcha logo, with no reCAPTCHA integration.
 * Pass `checked` / `onChange` (or `defaultChecked`) like a checkbox.
 */
export function Captcha({ label = "I'm not a robot", logoHeight = 45, className, ...inputProps }: CaptchaProps) {
  return (
    <div className={[styles.captcha, className].filter(Boolean).join(' ')}>
      <Checkbox size="small" label={label} {...inputProps} />
      {/* Figma Logos* › Recaptcha (543:1693) instance, 47×45 by default */}
      <Logo name="recaptcha" height={logoHeight} label="" />
    </div>
  );
}
