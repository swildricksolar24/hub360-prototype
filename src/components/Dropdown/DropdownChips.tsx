import { Icon } from '../Icon/Icon';
import styles from './Dropdown.module.css';

export type DropdownChipsProps = {
  /** The chosen options, one teal "Chip Tiny / Icon Right" each. */
  items: { value: string; label: string }[];
  /** Called with the chip's value when its close icon (the whole chip) is pressed. */
  onRemove?: (value: string) => void;
  /** brand = teal-tinted panel (Figma "chips", Filter Chip `Press`) · plain = no fill (Filter Chip `Press - Alt`). */
  appearance?: 'brand' | 'plain';
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  /** Accessible name of the list, e.g. "Selected states". */
  'aria-label'?: string;
  className?: string;
};

/** Figma Drop Down Label › chips: the selected values as removable teal chips. */
export function DropdownChips({
  items,
  onRemove,
  appearance = 'brand',
  error,
  required,
  disabled,
  className,
  'aria-label': ariaLabel = 'Selected',
}: DropdownChipsProps) {
  return (
    <ul
      className={[styles.chips, className].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
      data-appearance={appearance}
      data-error={error || undefined}
      data-required={required || undefined}
      data-disabled={disabled || undefined}
    >
      {items.map(item => (
        <li key={item.value}>
          <button
            type="button"
            className={styles.chip}
            disabled={disabled}
            aria-label={`Remove ${item.label}`}
            onClick={() => onRemove?.(item.value)}
          >
            {item.label}
            <Icon name="close-small" size={16} color="currentColor" />
          </button>
        </li>
      ))}
    </ul>
  );
}
