import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from '../Icon/Icon';
import { ListBox, type ListBoxOption } from '../ListBox/ListBox';
import { DropdownChips } from '../Dropdown/DropdownChips';
import { useDropdown, type DropdownOpenProps } from '../Dropdown/useDropdown';
import { SearchInput } from '../SearchBar/SearchBar';
import styles from './DropdownSelector.module.css';

/* ------------------------------------------------------------------------------------------ */
/* Chip (Drop Down - Selector › Chip)                                                          */
/* ------------------------------------------------------------------------------------------ */

export type DropdownSelectorChipProps = {
  /** Figma `Label`. */
  label: string;
  /** Pressing the chip (its close icon) removes it. */
  onRemove?: () => void;
  disabled?: boolean;
};

/**
 * Figma Drop Down - Selector › Chip: a small Surfaces/Overlay chip with a close icon.
 * Used inside Multiselect Dropdown and Dropdown Tree fields. The whole chip is the remove button.
 */
export function DropdownSelectorChip({ label, onRemove, disabled }: DropdownSelectorChipProps) {
  return (
    <button
      type="button"
      className={styles.chip}
      aria-label={`Remove ${label}`}
      disabled={disabled}
      onClick={e => {
        e.stopPropagation();
        onRemove?.();
      }}
    >
      <span>{label}</span>
      <Icon name="close-small" size={24} color="currentColor" />
    </button>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Gallery (Dropdown Holder › Gallery)                                                         */
/* ------------------------------------------------------------------------------------------ */

export type DropdownSelectorOption = ListBoxOption & {
  /** Thumbnail for the `gallery` display (Photo Library). */
  image?: string;
};

const GALLERY_COLUMNS = 6;

type GalleryProps = {
  options: DropdownSelectorOption[];
  value: string[];
  onToggle: (value: string) => void;
  onDismiss?: () => void;
  id?: string;
  'aria-label'?: string;
};

/** Grid of 43px thumbnails as a multi-select listbox. Arrow keys move in two dimensions. */
export function DropdownSelectorGallery({ options, value, onToggle, onDismiss, id, ...aria }: GalleryProps) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const move = (to: number) => {
    const i = Math.min(options.length - 1, Math.max(0, to));
    setActive(i);
    refs.current[i]?.focus();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: GALLERY_COLUMNS, ArrowUp: -GALLERY_COLUMNS };
    if (e.key in step) {
      e.preventDefault();
      move(active + step[e.key]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      move(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      move(options.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const o = options[active];
      if (o && !o.disabled) onToggle(o.value);
    } else if (e.key === 'Escape' && onDismiss) {
      e.preventDefault();
      onDismiss();
    }
  };
  return (
    <div id={id} role="listbox" aria-multiselectable className={styles.gallery} onKeyDown={onKeyDown} {...aria}>
      {options.map((o, i) => (
        <div
          key={o.value}
          ref={el => {
            refs.current[i] = el;
          }}
          role="option"
          aria-label={o.label}
          aria-selected={value.includes(o.value)}
          aria-disabled={o.disabled || undefined}
          tabIndex={i === active ? 0 : -1}
          className={styles.tile}
          onClick={() => {
            setActive(i);
            if (!o.disabled) onToggle(o.value);
          }}
        >
          {o.image && <img src={o.image} alt="" />}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* DropdownSelector                                                                            */
/* ------------------------------------------------------------------------------------------ */

export type DropdownSelectorProps = DropdownOpenProps & {
  options: DropdownSelectorOption[];
  /** Figma `Label` on the button ("Select"); shown while nothing is chosen. */
  placeholder?: string;
  /** Accessible name of the button and list. Defaults to `placeholder`. */
  'aria-label'?: string;
  /**
   * list = Autocomplete / Dropdown (chosen labels on the button) ·
   * chips = Autocomplete / Dropdown / Chips (chosen values as chips under the button) ·
   * gallery = Autocomplete / Dropdown / Photo Library (thumbnail grid).
   */
  display?: 'list' | 'chips' | 'gallery';
  /** Chosen values. The selector is always multi-select (its rows are checkboxes). */
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  /** Figma Dropdown Selector `Show Icon`: the checkbox icon on each row. */
  showIcon?: boolean;
  /** Placeholder of the search field at the top of the menu. */
  searchPlaceholder?: string;
  /** Initial search text (Figma `State=Active Input` in the stories). */
  defaultSearch?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
};

/**
 * Figma Drop Down - Selector: a large button that opens a searchable, multi-select list
 * (or photo grid). Opening focuses the search field; ↓ moves into the list; Escape closes.
 */
export function DropdownSelector({
  options,
  placeholder = 'Select',
  'aria-label': ariaLabel,
  display = 'list',
  value,
  defaultValue = [],
  onChange,
  showIcon = true,
  searchPlaceholder = 'Search...',
  defaultSearch = '',
  disabled = false,
  id,
  className,
  open,
  defaultOpen,
  onOpenChange,
}: DropdownSelectorProps) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const listId = `${baseId}-list`;
  const name = ariaLabel ?? placeholder;
  const dd = useDropdown({ open, defaultOpen, onOpenChange }, disabled);
  const [inner, setInner] = useState<string[]>(defaultValue);
  const current = value ?? inner;
  const [query, setQuery] = useState(defaultSearch);
  const listWrap = useRef<HTMLDivElement>(null);

  const change = (next: string[]) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };
  const toggle = (v: string) => change(current.includes(v) ? current.filter(x => x !== v) : [...current, v]);

  const filtered = query ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase())) : options;
  const chosen = options.filter(o => current.includes(o.value));
  const buttonText = display === 'list' && chosen.length ? chosen.map(o => o.label).join(', ') : placeholder;

  const onSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      listWrap.current?.querySelector<HTMLElement>('[role="option"][tabindex="0"]')?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      dd.close();
    }
  };

  const search = (
    <SearchInput
      aria-label={`Search ${name}`}
      aria-controls={listId}
      placeholder={searchPlaceholder}
      compact={display === 'gallery'}
      iconSize={display === 'gallery' ? 20 : 24}
      className={display === 'gallery' ? undefined : styles.search}
      value={query}
      onChange={e => setQuery(e.target.value)}
      onKeyDown={onSearchKey}
      autoFocus={dd.focusOnOpen}
    />
  );

  return (
    <div
      ref={dd.rootRef}
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-display={display}
      data-has-value={chosen.length ? true : undefined}
    >
      <div className={styles.anchor}>
        <button
          type="button"
          id={baseId}
          className={styles.trigger}
          disabled={disabled}
          aria-label={buttonText === placeholder ? name : `${name}: ${buttonText}`}
          aria-controls={dd.isOpen ? listId : undefined}
          {...dd.triggerProps}
        >
          <span className={styles.text}>{buttonText}</span>
          <Icon name="chevron-down" size={24} color="currentColor" className={styles.chevron} />
        </button>
        {dd.isOpen && (
          <div className={styles.popup} data-display={display}>
            {search}
            <div ref={listWrap} className={styles.holder}>
              {display === 'gallery' ? (
                <DropdownSelectorGallery id={listId} aria-label={name} options={filtered} value={current} onToggle={toggle} onDismiss={dd.close} />
              ) : (
                <ListBox
                  id={listId}
                  aria-label={name}
                  appearance="selector"
                  type={showIcon ? 'checkbox' : 'default'}
                  multiple
                  options={filtered}
                  value={current}
                  onChange={v => change(v as string[])}
                  onDismiss={dd.onDismiss}
                />
              )}
            </div>
          </div>
        )}
      </div>
      {display === 'chips' && chosen.length > 0 && (
        <DropdownChips
          className={styles.selectedChips}
          appearance="plain"
          aria-label={`Selected ${name}`}
          items={chosen}
          disabled={disabled}
          onRemove={v => change(current.filter(x => x !== v))}
        />
      )}
    </div>
  );
}
