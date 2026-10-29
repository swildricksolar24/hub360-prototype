import type { ChangeEvent } from 'react';
import { Checkbox } from '../Checkbox/Checkbox';
import styles from './DataCheckbox.module.css';

export type DataCheckboxProps = {
  /** Accessible name, e.g. "Select row 12345" or "Select all rows". Not shown. */
  label: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void;
};

/**
 * The selection checkbox used in data headers and rows: the Checkbox component
 * (Figma Checkbox "Default") at the 32px size the Data Rows / Headers instances use, with a hidden label.
 */
export function DataCheckbox({ label, checked, disabled, onChange }: DataCheckboxProps) {
  return (
    <span className={styles.frame}>
      <Checkbox
        className={styles.select}
        label={<span className={styles.srOnly}>{label}</span>}
        checked={checked ?? false}
        disabled={disabled}
        onChange={event => onChange?.(event.target.checked, event)}
        readOnly={!onChange}
      />
    </span>
  );
}
