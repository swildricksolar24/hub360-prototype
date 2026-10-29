import { useId, useState } from 'react';
import { Icon } from '../Icon/Icon';
import { ListBox, type ListBoxOption, type ListBoxType } from '../ListBox/ListBox';
import { useDropdown, type DropdownOpenProps } from '../Dropdown/useDropdown';
import styles from './MainDropDown.module.css';

export type MainDropDownProps = DropdownOpenProps & {
  options: ListBoxOption[];
  /** Figma `Label`. Defaults to the chosen option's label. */
  label?: string;
  /** Accessible name of the button and list, e.g. "Account". */
  'aria-label': string;
  /** Leading icon (Figma uses Account). */
  icon?: string;
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string) => void;
  /** Row style of the menu. */
  listType?: ListBoxType;
  disabled?: boolean;
  id?: string;
  className?: string;
};

/**
 * Figma Main Drop Down*: the compact icon + bold label button used in app headers
 * (account or workspace switcher). It opens a ListBox; choosing an option closes it.
 */
export function MainDropDown({
  options,
  label,
  'aria-label': ariaLabel,
  icon = 'account',
  value,
  defaultValue = null,
  onChange,
  listType = 'default',
  disabled = false,
  id,
  className,
  open,
  defaultOpen,
  onOpenChange,
}: MainDropDownProps) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const listId = `${baseId}-list`;
  const dd = useDropdown({ open, defaultOpen, onOpenChange }, disabled);
  const [inner, setInner] = useState<string | null>(defaultValue);
  const current = value !== undefined ? value : inner;
  const text = label ?? options.find(o => o.value === current)?.label ?? ariaLabel;

  return (
    <div ref={dd.rootRef} className={[styles.root, className].filter(Boolean).join(' ')}>
      <button
        type="button"
        id={baseId}
        className={styles.trigger}
        disabled={disabled}
        aria-label={`${ariaLabel}: ${text}`}
        aria-controls={dd.isOpen ? listId : undefined}
        {...dd.triggerProps}
      >
        <Icon name={icon} size={24} color="currentColor" className={styles.icon} />
        <span className={styles.label}>{text}</span>
      </button>
      {dd.isOpen && (
        <div className={styles.popup}>
          <ListBox
            id={listId}
            aria-label={ariaLabel}
            type={listType}
            options={options}
            value={current}
            onChange={v => {
              if (value === undefined) setInner(v as string);
              onChange?.(v as string);
            }}
            onCommit={dd.close}
            onDismiss={dd.onDismiss}
            autoFocus={dd.focusOnOpen}
          />
        </div>
      )}
    </div>
  );
}
