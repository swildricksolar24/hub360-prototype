import { useId, useLayoutEffect, useState, type CSSProperties, type HTMLInputTypeAttribute } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon/Icon';
import { ListBox } from '../ListBox/ListBox';
import { useDropdown } from '../Dropdown/useDropdown';
import dropdownStyles from '../Dropdown/Dropdown.module.css';
import styles from './EditableCell.module.css';

export type EditableCellOption = string | { value: string; label: string };

export type EditableCellProps = {
  /** Accessible name (usually the column header). Figma has no visible label. */
  label: string;
  /**
   * Figma `Type`: input = free text, select = a button with the sort icon that opens a ListBox menu (like Dropdown),
   * read-only = plain value.
   */
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
  /** `type="select"`: render with the menu open (used by the stories to show the open state, like Dropdown). */
  defaultOpen?: boolean;
  /** Native input type for `type="input"` (text, number, date…). */
  inputType?: HTMLInputTypeAttribute;
  placeholder?: string;
  name?: string;
  className?: string;
};

type SelectCellProps = Pick<EditableCellProps, 'label' | 'value' | 'defaultValue' | 'onValueChange' | 'error' | 'disabled' | 'name' | 'defaultOpen'> & {
  common: Record<string, unknown>;
  options: EditableCellOption[];
};

/**
 * `type="select"`: the cell is a button (aria-haspopup="listbox") that opens a ListBox `menu`, the same menu as
 * Dropdown (Dropdown's popup look and its useDropdown open / close and keyboard).
 *
 * The menu is a popover in the top layer, anchored to the cell with CSS anchor positioning (EditableCell.module.css
 * .menu): it is in place on the first painted frame, 4px under the cell and at least as wide, moves with the page and
 * any scrolling table with no lag (the browser keeps it on its anchor), and nothing clips it, not a table's scroll box,
 * a card's overflow or a modal. It opens below like Dropdown, and above only when it wouldn't fit below. Browsers
 * without anchor positioning get a one-time fixed position under the cell.
 */
function SelectCell({ common, label, value, defaultValue, onValueChange, options, error, disabled, name, defaultOpen }: SelectCellProps) {
  const ids = useId();
  const labelId = `${ids}-label`;
  const valueId = `${ids}-value`;
  const listId = `${ids}-list`;
  // A unique anchor name per cell (useId's characters aren't valid in a CSS name)
  const anchor = `--editable-cell-${ids.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const dd = useDropdown({ defaultOpen }, disabled);
  const list = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o));
  const [inner, setInner] = useState(defaultValue);
  // Like a native select, the first option shows when nothing is chosen
  const current = value ?? inner ?? list[0]?.value;
  const currentLabel = list.find(o => o.value === current)?.label ?? current ?? '';

  // Show the popover before ListBox focuses an option (its focus runs in a passive effect, after this)
  useLayoutEffect(() => {
    const popup = dd.popupRef.current;
    if (!dd.isOpen || !popup) return;
    if (!CSS.supports('anchor-name: --a')) {
      const r = dd.rootRef.current!.getBoundingClientRect();
      Object.assign(popup.style, { top: `${r.bottom}px`, left: `${r.left}px`, minWidth: `${r.width}px` });
    }
    popup.showPopover();
    return () => {
      if (popup.matches(':popover-open')) popup.hidePopover();
    };
  }, [dd.isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const change = (v: string | string[]) => {
    const next = Array.isArray(v) ? v[0] : v;
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };

  return (
    <div ref={dd.rootRef} {...common} data-open={dd.isOpen || undefined} style={{ anchorName: anchor } as CSSProperties}>
      <span id={labelId} className={styles.srOnly}>
        {label}
      </span>
      <button
        type="button"
        className={styles.field}
        disabled={disabled}
        aria-labelledby={`${labelId} ${valueId}`}
        aria-invalid={error || undefined}
        aria-controls={dd.isOpen ? listId : undefined}
        {...dd.triggerProps}
      >
        <span id={valueId} className={styles.value}>
          {currentLabel}
        </span>
      </button>
      <Icon name="sort" size={16} color="currentColor" className={styles.icon} />
      {name && <input type="hidden" name={name} value={current ?? ''} />}
      {dd.isOpen && (
        <div
          ref={dd.popupRef}
          popover="manual"
          className={[dropdownStyles.popup, styles.menu].join(' ')}
          style={{ positionAnchor: anchor } as CSSProperties}
        >
          <ListBox
            menu
            id={listId}
            aria-labelledby={labelId}
            options={list}
            value={current ?? null}
            onChange={change}
            onCommit={dd.close}
            onDismiss={dd.onDismiss}
            autoFocus={dd.focusOnOpen}
          />
        </div>
      )}
    </div>
  );
}

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
  defaultOpen,
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
      <SelectCell
        common={common}
        label={label}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        options={options}
        error={error}
        disabled={disabled}
        name={name}
        defaultOpen={defaultOpen}
      />
    );
  }

  return (
    <div {...common}>
      <input {...field} type={inputType} placeholder={placeholder} onChange={e => onValueChange?.(e.target.value)} />
    </div>
  );
}
