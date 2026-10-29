import type { InputHTMLAttributes, ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Checkbox.module.css';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  label: ReactNode;
  /** default = 44px box (Figma "Default") · small = 24px box (Figma "Small"). */
  size?: 'default' | 'small';
  /** Figma `State=Error`. */
  error?: boolean;
  /** Adds the information icon after the label (Figma "Default - Icon" / "Small - Icon"). */
  infoIcon?: boolean;
};

export function Checkbox({ label, size = 'default', error = false, infoIcon = false, className, ...inputProps }: CheckboxProps) {
  return (
    <label className={[styles.checkbox, className].filter(Boolean).join(' ')} data-size={size} data-error={error || undefined}>
      <input type="checkbox" className={styles.input} aria-invalid={error || undefined} {...inputProps} />
      <span className={styles.box}>
        <Icon name="check" size={size === 'small' ? 24 : 42} color="currentColor" className={styles.check} />
      </span>
      <span className={styles.label}>{label}</span>
      {infoIcon && <Icon name="information" size={24} color="currentColor" className={styles.info} />}
    </label>
  );
}
