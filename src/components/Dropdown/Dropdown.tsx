import { useId, useState, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import { ListBox, type ListBoxOption, type ListBoxType } from '../ListBox/ListBox';
import { useDropdown, type DropdownOpenProps } from './useDropdown';
import { withRequiredMark } from '../TextInput/requiredMark';
import styles from './Dropdown.module.css';

/**
 * field = Drop Down Label › Default (44px, label above) ·
 * button = Drop Down Button (text), or with `icon` Drop Down Icon + Label Button, in the `size` given ·
 * icon = Drop Down Icon Button (icon, no text), in the `size` given.
 * Deprecated aliases: small = button + size medium · tiny = button + size small.
 */
export type DropdownVariant = 'field' | 'button' | 'icon' | 'small' | 'tiny';

/**
 * Figma's sizes for the button and icon kinds (each family has a Large, Medium and Small set):
 * large = 76px, Heading 4 Bold, 28px icon · medium = 44px, Medium/Semi-Bold, 28px icon · small = 32px, Tiny/Medium,
 * 16px icon and chevron, 8px corners.
 */
export type DropdownSize = 'large' | 'medium' | 'small';

export type DropdownProps = DropdownOpenProps & {
  options: ListBoxOption[];
  /** Figma `Label`, shown above the field. Also the accessible name. */
  label?: string;
  /** Keeps `label` as the accessible name but doesn't show it (Figma had a `Default - No Label` state until Nov 24, 2026). */
  hideLabel?: boolean;
  /** Figma `Select` text shown while nothing is chosen. */
  placeholder?: string;
  variant?: DropdownVariant;
  /** Size of a `button` or `icon` dropdown (Figma Large / Medium / Small sets). Defaults to large. */
  size?: DropdownSize;
  /** Leading icon. With `variant="button"` this is Figma "Icon + Label"; required for `variant="icon"`. */
  icon?: string;
  /** Figma `State=Default - Light` (Gray Fill/Press field). */
  light?: boolean;
  /** Figma `State=Error`. A string is also shown as a message below. */
  error?: boolean | string;
  /** Figma `State=Required` (teal outline). */
  required?: boolean;
  disabled?: boolean;
  /**
   * Shows the trigger in the small buttons' Selected look (Brand Teal Fill/Weaker, 2px Brand Teal Stroke/Weak), e.g. an
   * Actions menu while table rows are checked. Not a Figma Drop Down Button state; it borrows Button Small's Selected.
   */
  selected?: boolean;
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
  /** Where the menu opens. `above` suits a control at the bottom of a page or table (e.g. the Page Tracker). */
  menuPlacement?: 'below' | 'above';
  id?: string;
  className?: string;
};

/** Chevron and leading-icon sizes from the Figma sets */
const chevronSize = (kind: 'field' | 'button' | 'icon', size: DropdownSize, withIcon: boolean) =>
  kind === 'field' ? 20 : size === 'small' ? 16 : size === 'medium' && kind === 'button' && !withIcon ? 20 : 24;
const ICON: Record<DropdownSize, number> = { large: 28, medium: 28, small: 16 };

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
  size: sizeProp,
  icon,
  light = false,
  error,
  required = false,
  disabled = false,
  selected: selectedLook = false,
  multiple = false,
  value,
  defaultValue,
  onChange,
  listType,
  renderValue,
  footer,
  menuPlacement = 'below',
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
  // The old `small` / `tiny` variants are the button kind at medium / small
  const kind = variant === 'small' || variant === 'tiny' ? 'button' : variant;
  const size: DropdownSize = variant === 'small' ? 'medium' : variant === 'tiny' ? 'small' : (sizeProp ?? 'large');
  const showLabel = !!label && !hideLabel && kind === 'field';
  const iconSize = ICON[size];

  return (
    <div
      ref={dd.rootRef}
      className={[styles.dropdown, className].filter(Boolean).join(' ')}
      data-variant={kind}
      data-size={kind === 'field' ? undefined : size}
      data-light={light || undefined}
      data-error={error ? true : undefined}
      data-required={required || undefined}
      data-disabled={disabled || undefined}
      data-selected={(selectedLook && !disabled) || undefined}
      data-placement={menuPlacement === 'above' ? 'above' : undefined}
    >
      {label && (
        <span id={labelId} className={showLabel ? styles.label : styles.srOnly}>
          {withRequiredMark(label)}
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
            {kind !== 'icon' && (
              <span id={valueId} className={styles.text}>
                {shown}
              </span>
            )}
          </span>
          <Icon name="chevron-down" size={chevronSize(kind, size, !!icon)} color="currentColor" className={styles.chevron} />
        </button>
        {dd.isOpen && (
          <div className={styles.popup}>
            <ListBox
              menu
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
