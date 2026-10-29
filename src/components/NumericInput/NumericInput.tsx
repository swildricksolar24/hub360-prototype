import { useId, useState, type InputHTMLAttributes } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './NumericInput.module.css';

export type NumericInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'step'
> & {
  /** Figma `Label` text property. */
  label: string;
  /** Figma `Error` text property. Setting it shows `State=Error`. */
  error?: string;
  /** Controlled value. `null` is an empty field. */
  value?: number | null;
  /** Initial value when uncontrolled. */
  defaultValue?: number | null;
  /** Called with the parsed number (or `null` when the field is cleared). */
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  /** Amount the stepper buttons and arrow keys add or remove. */
  step?: number;
  /** Accessible names for the stepper buttons. */
  decrementLabel?: string;
  incrementLabel?: string;
};

const clamp = (n: number, min?: number, max?: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
const decimals = (n: number) => (String(n).split('.')[1] ?? '').length;

/** Text Input - Numeric (Figma "Text Input - Numeric*"): a number field with down / up steppers. */
export function NumericInput({
  label,
  error,
  value,
  defaultValue = null,
  onValueChange,
  min,
  max,
  step = 1,
  decrementLabel = 'Decrease',
  incrementLabel = 'Increase',
  id,
  className,
  disabled,
  readOnly,
  ...inputProps
}: NumericInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  const controlled = value !== undefined;
  const [draft, setDraft] = useState(defaultValue == null ? '' : String(defaultValue));
  const text = controlled ? (value == null ? '' : String(value)) : draft;

  const commit = (next: string) => {
    if (!controlled) setDraft(next);
    const n = next.trim() === '' ? null : Number(next);
    if (n === null || !Number.isNaN(n)) onValueChange?.(n);
  };

  const stepBy = (dir: 1 | -1) => {
    // An empty field steps to 0 (or the nearest bound) first
    const current = text.trim() === '' ? null : Number(text);
    if (Number.isNaN(current)) return;
    const next = clamp(current === null ? 0 : current + dir * step, min, max);
    // Round away floating-point noise (0.1 + 0.2) without padding trailing zeros
    commit(String(Number(next.toFixed(Math.max(decimals(step), decimals(current ?? 0))))));
  };

  const n = Number(text);
  const atMin = min !== undefined && text !== '' && n <= min;
  const atMax = max !== undefined && text !== '' && n >= max;
  const locked = disabled || readOnly;

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
        <input
          id={inputId}
          type="number"
          inputMode="decimal"
          className={styles.input}
          value={text}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={e => commit(e.target.value)}
          {...inputProps}
        />
        <span className={styles.steppers}>
          <button
            type="button"
            tabIndex={-1}
            className={styles.stepper}
            aria-label={decrementLabel}
            aria-controls={inputId}
            disabled={locked || atMin}
            onClick={() => stepBy(-1)}
          >
            <Icon name="chevron-down" size={20} color="currentColor" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            className={styles.stepper}
            aria-label={incrementLabel}
            aria-controls={inputId}
            disabled={locked || atMax}
            onClick={() => stepBy(1)}
          >
            <Icon name="chevron-up" size={20} color="currentColor" />
          </button>
        </span>
      </div>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
