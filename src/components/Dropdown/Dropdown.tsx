import { useId, useState, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import { ListBox, type ListBoxOption, type ListBoxType } from '../ListBox/ListBox';
import { useDropdown, type DropdownOpenProps } from './useDropdown';
import styles from './Dropdown.module.css';

/**
 * field = Drop Down Label › Default (44px, label above) ·
 * button = Drop Down Button › Default / Icon and Label (76px, Heading 4 Bold) ·
 * small = Drop Down Button › Small (44px, Medium Semi-Bold) ·
 * icon = Drop Down Button › Icon (40px icon, no text).
 */
export type DropdownVariant = 'field' | 'button' | 'small' | 'icon';

export type DropdownProps = DropdownOpenProps & {
  options: ListBoxOption[];
  /** Figma `Label`, shown above the field. Also the accessible name. */
  label?: string;
  /** Figma `State=Default - No Label`: keeps `label` as the accessible name but doesn't show it. */
  hideLabel?: boolean;
  /** Figma `Select` text shown while nothing is chosen. */
  placeholder?: string;
  variant?: DropdownVariant;
  /** Leading icon. With `variant="button"` this is Figma "Icon and Label"; required for `variant="icon"`. */
  icon?: string;
  /** Figma `State=Default - Light` (Gray Fill/Press field). */
  light?: boolean;
  /** Figma `State=Error`. A string is also shown as a message below. */
  error?: boolean | string;
  /** Figma `State=Required` (teal outline). */
  required?: boolean;
  disabled?: boolean;
  /** Multi-select: the list stays open and `value` is an array. */
  multiple?: boolean;
  value?: string | string[] | null;
  defaultValue?: string | string[] | null;
  onChange?: (value: string | string[]) => void;
  /** Row style inside the menu (Figma ListViews `Type`). Defaults to checkbox when `multiple`. */
  listType?: ListBoxType;
  /** What the button shows for the current selection. Defaults to the selected labels. */
  renderValue?: (selected: ListBoxOption[]) => ReactNode;
  /** Accessible name when there is no `label` (required for `variant="icon"`). */
  'aria-label'?: string;
  /** Rendered under the field, inside the component (FilterChipDropdown puts its chips here). */
  footer?: ReactNode;
  id?: string;
  className?: string;
};

const CHEVRON: Record<DropdownVariant, number> = { field: 20, small: 20, button: 24, icon: 24 };

/**
 * Select-style dropdown (Figma Drop Down Label and Drop Down Button pages): a button with
 * `aria-haspopup="listbox"` that opens a ListBox. ↓/↑ or click opens and focuses the list,
 * Enter/Space chooses, Escape closes and returns focus.
 */
export function Dropdown({
  options,
  label,
  hideLabel = false,
  placeholder = 'Select',
  variant = 'field',
  icon,
  light = false,
  error,
  required = false,
  disabled = false,
  multiple = false,
  value,
  defaultValue,
  onChange,
  listType,
  renderValue,
  footer,
  id,
  className,
  open,
  defaultOpen,
  onOpenChange,
  'aria-label': ariaLabel,
}: DropdownProps) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const labelId = `${baseId}-label`;
  const valueId = `${baseId}-value`;
  const listId = `${baseId}-list`;
  const errorId = `${baseId}-error`;
  const dd = useDropdown({ open, defaultOpen, onOpenChange }, disabled);

  const [inner, setInner] = useState<string | string[] | null>(defaultValue ?? (multiple ? [] : null));
  const current = value !== undefined ? value : inner;
  const selectedValues = current == null ? [] : Array.isArray(current) ? current : [current];
  const selected = options.filter(o => selectedValues.includes(o.value));

  const change = (v: string | string[]) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
  };

  const shown = renderValue ? renderValue(selected) : selected.length ? selected.map(o => o.label).join(', ') : placeholder;
  const showLabel = !!label && !hideLabel && variant === 'field';
  const iconSize = variant === 'icon' ? 40 : 24;

  return (
    <div
      ref={dd.rootRef}
      className={[styles.dropdown, className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-light={light || undefined}
      data-error={error ? true : undefined}
      data-required={required || undefined}
      data-disabled={disabled || undefined}
    >
      {label && (
        <span id={labelId} className={showLabel ? styles.label : styles.srOnly}>
          {label}
        </span>
      )}
      <div className={styles.anchor}>
        <button
          type="button"
          id={baseId}
          className={styles.trigger}
          disabled={disabled}
          aria-controls={dd.isOpen ? listId : undefined}
          aria-labelledby={label ? `${labelId} ${valueId}` : undefined}
          aria-label={label ? undefined : ariaLabel}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          aria-describedby={typeof error === 'string' && error ? errorId : undefined}
          {...dd.triggerProps}
        >
          <span className={styles.value}>
            {icon && <Icon name={icon} size={iconSize} color="currentColor" className={styles.icon} />}
            {variant !== 'icon' && (
              <span id={valueId} className={styles.text}>
                {shown}
              </span>
            )}
          </span>
          <Icon name="chevron-down" size={CHEVRON[variant]} color="currentColor" className={styles.chevron} />
        </button>
        {dd.isOpen && (
          <div className={styles.popup}>
            <ListBox
              id={listId}
              aria-labelledby={label ? labelId : undefined}
              aria-label={label ? undefined : ariaLabel}
              options={options}
              type={listType ?? (multiple ? 'checkbox' : 'default')}
              multiple={multiple}
              value={current}
              onChange={change}
              onCommit={multiple ? undefined : dd.close}
              onDismiss={dd.onDismiss}
              autoFocus={dd.focusOnOpen}
            />
          </div>
        )}
      </div>
      {footer}
      {typeof error === 'string' && error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
