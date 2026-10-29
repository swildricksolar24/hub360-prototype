import type { HTMLInputTypeAttribute } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './EditableCell.module.css';

export type EditableCellOption = string | { value: string; label: string };

export type EditableCellProps = {
  /** Accessible name (usually the column header). Figma has no visible label. */
  label: string;
  /** Figma `Type`: input = free text, select = native select with the sort icon, read-only = plain value. */
  type?: 'input' | 'select' | 'read-only';
  /** Figma `Value` text property. Controlled value. */
  value?: string;
  /** Initial value when uncontrolled (input and select). */
  defaultValue?: string;
  /** Called with the new value when the user edits or picks one. */
  onValueChange?: (value: string) => void;
  /** Choices for `type="select"`. */
  options?: EditableCellOption[];
  /** Figma `State=Error`. */
  error?: boolean;
  disabled?: boolean;
  /** Native input type for `type="input"` (text, number, date…). */
  inputType?: HTMLInputTypeAttribute;
  placeholder?: string;
  name?: string;
  className?: string;
};

/** Editable Cell (Figma "Editable Cell"): a compact table-cell field. */
export function EditableCell({
  label,
  type = 'input',
  value,
  defaultValue,
  onValueChange,
  options = [],
  error = false,
  disabled,
  inputType = 'text',
  placeholder,
  name,
  className,
}: EditableCellProps) {
  const common = {
    className: [styles.cell, className].filter(Boolean).join(' '),
    'data-type': type,
    'data-error': error || undefined,
  };
  const field = {
    className: styles.field,
    'aria-label': label,
    'aria-invalid': error || undefined,
    value,
    defaultValue,
    disabled,
    name,
  };

  if (type === 'read-only') {
    return (
      <div {...common} role="textbox" aria-readonly="true" aria-label={label}>
        <span className={styles.value}>{value ?? defaultValue}</span>
      </div>
    );
  }

  if (type === 'select') {
    return (
      <div {...common}>
        <select {...field} onChange={e => onValueChange?.(e.target.value)}>
          {options.map(o => {
            const opt = typeof o === 'string' ? { value: o, label: o } : o;
            return (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            );
          })}
        </select>
        <Icon name="sort" size={16} color="currentColor" className={styles.icon} />
      </div>
    );
  }

  return (
    <div {...common}>
      <input {...field} type={inputType} placeholder={placeholder} onChange={e => onValueChange?.(e.target.value)} />
    </div>
  );
}
