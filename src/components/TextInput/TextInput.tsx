import { useId, type InputHTMLAttributes } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './TextInput.module.css';

export type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label: string;
  /** Error message. Setting it shows Figma `State=Error`. */
  error?: string;
  /** Icon before the text (Figma "Left Icon"). */
  leftIcon?: string;
  /** Up to two icons after the text (Figma "Right Icon" / "Right Double Icon"). */
  rightIcons?: [string] | [string, string];
};

export function TextInput({ label, error, leftIcon, rightIcons, id, className, disabled, ...inputProps }: TextInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  return (
    <div
      className={[styles.field, className].filter(Boolean).join(' ')}
      data-error={error ? true : undefined}
      data-disabled={disabled || undefined}
      data-required={inputProps.required || undefined}
    >
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <div className={styles.control}>
        {leftIcon && (
          <span className={styles.adornment}>
            <Icon name={leftIcon} size={20} color="currentColor" />
            <span className={styles.divider} />
          </span>
        )}
        <input
          id={inputId}
          className={styles.input}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
        />
        {rightIcons && (
          <span className={styles.adornment}>
            <span className={styles.divider} />
            {rightIcons.map((name, i) => (
              <Icon key={i} name={name} size={20} color="currentColor" />
            ))}
          </span>
        )}
      </div>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
