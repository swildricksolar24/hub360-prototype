import { useId, type TextareaHTMLAttributes } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './TextArea.module.css';

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** Figma `Label` text property. */
  label: string;
  /** Figma `Error` text property. Setting it shows `State=Error`. */
  error?: string;
  /** Lets the user drag the bottom-right corner to change the height (Figma's resize icon). */
  resizable?: boolean;
};

/** Text Area (Figma "Text Area › Default"). Placeholder and value use native textarea props. */
export function TextArea({ label, error, resizable = true, id, className, disabled, rows = 3, ...textareaProps }: TextAreaProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  return (
    <div
      className={[styles.field, className].filter(Boolean).join(' ')}
      data-error={error ? true : undefined}
      data-disabled={disabled || undefined}
      data-required={textareaProps.required || undefined}
    >
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <div className={styles.control}>
        <textarea
          id={inputId}
          rows={rows}
          className={styles.input}
          data-resizable={resizable || undefined}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...textareaProps}
        />
        {resizable && <Icon name="resize" size={24} color="currentColor" className={styles.grip} />}
      </div>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
