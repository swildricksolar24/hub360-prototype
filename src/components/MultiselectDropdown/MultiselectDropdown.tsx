import { useId, useState } from 'react';
import { Icon } from '../Icon/Icon';
import { ListBox, type ListBoxOption } from '../ListBox/ListBox';
import { DropdownSelectorChip } from '../DropdownSelector/DropdownSelector';
import { useDropdown, type DropdownOpenProps } from '../Dropdown/useDropdown';
import styles from './MultiselectDropdown.module.css';

export type MultiselectDropdownProps = DropdownOpenProps & {
  options: ListBoxOption[];
  /** Accessible name of the field and its list (Figma shows no visible label). */
  label: string;
  /** Figma `Select` text, shown while nothing is chosen. */
  placeholder?: string;
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
};

/**
 * Figma Multiselect Dropdown: a field whose chosen options sit inside it as removable chips,
 * over a checkbox list (Dropdown Holder). The list stays open while you pick.
 */
export function MultiselectDropdown({
  options,
  label,
  placeholder = 'Select',
  value,
  defaultValue = [],
  onChange,
  disabled = false,
  id,
  className,
  open,
  defaultOpen,
  onOpenChange,
}: MultiselectDropdownProps) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const listId = `${baseId}-list`;
  const dd = useDropdown({ open, defaultOpen, onOpenChange }, disabled);
  const [inner, setInner] = useState<string[]>(defaultValue);
  const current = value ?? inner;
  const change = (next: string[]) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };
  const chosen = options.filter(o => current.includes(o.value));

  return (
    <div ref={dd.rootRef} className={[styles.root, className].filter(Boolean).join(' ')} data-disabled={disabled || undefined}>
      <div
        className={styles.field}
        data-has-value={chosen.length ? true : undefined}
        data-open={dd.isOpen || undefined}
        onClick={e => {
          if (e.target === e.currentTarget && !disabled) dd.triggerRef.current?.click();
        }}
      >
        {chosen.length > 0 && (
          <ul className={styles.chips} aria-label={`Selected ${label}`}>
            {chosen.map(o => (
              <li key={o.value}>
                <DropdownSelectorChip label={o.label} disabled={disabled} onRemove={() => change(current.filter(v => v !== o.value))} />
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          id={baseId}
          className={styles.trigger}
          disabled={disabled}
          aria-label={chosen.length ? `${label}, ${chosen.length} selected` : label}
          aria-controls={dd.isOpen ? listId : undefined}
          {...dd.triggerProps}
        >
          {chosen.length === 0 && <span className={styles.text}>{placeholder}</span>}
          <Icon name="chevron-down" size={20} color="currentColor" className={styles.chevron} />
        </button>
      </div>
      {dd.isOpen && (
        <div className={styles.popup}>
          <ListBox
            id={listId}
            aria-label={label}
            appearance="selector"
            type="checkbox"
            multiple
            options={options}
            value={current}
            onChange={v => change(v as string[])}
            onDismiss={dd.onDismiss}
            autoFocus={dd.focusOnOpen}
          />
        </div>
      )}
    </div>
  );
}
