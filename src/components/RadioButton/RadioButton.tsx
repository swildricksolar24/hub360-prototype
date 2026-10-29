import type { InputHTMLAttributes, ReactNode } from 'react';
import styles from './RadioButton.module.css';

export type RadioButtonProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  /** Figma `Label` text property. */
  label: ReactNode;
  /** Figma `Description` text property. Setting it renders the "Hint" set. */
  description?: ReactNode;
  /** Figma `State=Error`. */
  error?: boolean;
};

/**
 * Radio Button (Figma "Default*" and "Hint*" sets). Figma's `Show Selected` boolean maps to the
 * native `checked` / `defaultChecked` state; group radios with a shared `name`.
 */
export function RadioButton({ label, description, error = false, className, ...inputProps }: RadioButtonProps) {
  return (
    <label className={[styles.radio, className].filter(Boolean).join(' ')} data-error={error || undefined}>
      <input type="radio" className={styles.input} aria-invalid={error || undefined} {...inputProps} />
      <span className={styles.box}>
        <span className={styles.dot} />
      </span>
      {description ? (
        <span className={styles.text}>
          <span className={styles.label}>{label}</span>
          <span className={styles.description}>{description}</span>
        </span>
      ) : (
        <span className={styles.label}>{label}</span>
      )}
    </label>
  );
}
