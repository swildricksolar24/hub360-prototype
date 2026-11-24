import type { InputHTMLAttributes, ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Checkbox.module.css';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  label: ReactNode;
  /** medium = 44px box (Figma "Medium", was "Default") · small = 24px box (Figma "Small"). Deprecated: `default` = medium. */
  size?: 'medium' | 'small' | 'default';
  /** Figma `State=Error`. */
  error?: boolean;
  /** Adds the information icon after the label (Figma "Medium - Icon" / "Small - Icon"). */
  infoIcon?: boolean;
};

export function Checkbox({ label, size: sizeProp = 'medium', error = false, infoIcon = false, className, ...inputProps }: CheckboxProps) {
  const size = sizeProp === 'default' ? 'medium' : sizeProp;
  return (
    <label className={[styles.checkbox, className].filter(Boolean).join(' ')} data-size={size} data-error={error || undefined}>
      <input type="checkbox" className={styles.input} aria-invalid={error || undefined} {...inputProps} />
      <span className={styles.box}>
        <Icon name="check" size={size === 'small' ? 24 : 42} color="currentColor" className={styles.check} />
      </span>
      {infoIcon ? (
        /* Figma "Medium - Icon" groups the label and icon in a 4px-gap frame; "Small - Icon" keeps the 12px gap */
        <span className={styles.labelGroup}>
          <span className={styles.label}>{label}</span>
          <Icon name="information" size={24} color="currentColor" className={styles.info} />
        </span>
      ) : (
        <span className={styles.label}>{label}</span>
      )}
    </label>
  );
}
