import { useEffect, useId, useRef, useState, type InputHTMLAttributes, type KeyboardEvent, type Ref } from 'react';
import { Icon } from '../Icon/Icon';
import { ListBoxAvatar } from '../ListBox/ListBox';
import styles from './SearchBar.module.css';

/* ------------------------------------------------------------------------------------------ */
/* Search Input                                                                                */
/* ------------------------------------------------------------------------------------------ */

export type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> & {
  ref?: Ref<HTMLInputElement>;
  /** Accessible name. Figma shows no visible label, only the `Label` placeholder ("Search"). */
  'aria-label'?: string;
  /**
   * compact = the Search Input instance inside "Dropdown Holder › Gallery"
   * (12px padding, Surfaces/Sunken fill).
   */
  compact?: boolean;
  /** Search icon size; the Drop Down - Selector menu uses 24. */
  iconSize?: 20 | 24;
  /** Draws Figma `State=Active` (the field while results are open). Set by SearchBar. */
  active?: boolean;
};

/** Figma Search Bar › Search Input: a search field with a leading search icon. */
export function SearchInput({ compact, active, iconSize = 20, className, disabled, placeholder = 'Search', ...rest }: SearchInputProps) {
  return (
    <div
      className={[styles.field, className].filter(Boolean).join(' ')}
      data-compact={compact || undefined}
      data-active={active || undefined}
      data-disabled={disabled || undefined}
    >
      <Icon name="search" size={iconSize} color="currentColor" className={styles.icon} />
      <input
        type="search"
        className={styles.input}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={rest['aria-label'] ?? placeholder}
        {...rest}
      />
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Searched List Type                                                                          */
/* ------------------------------------------------------------------------------------------ */

export type SearchResult = {
  id: string;
  /** Figma `Name` (Heading 3 Bold). */
  name: string;
  /** Figma `Nickname` (shown as "Company"; Small Regular). */
  description?: string;
  /** Photo for Figma `Type=With Icon`. */
  avatarSrc?: string;
  /** Initials when there is no photo; any avatar makes the row `Type=With Icon`. */
  initials?: string;
  /** `Type=Default` right column: a read-only labelled value ("Title" / "Placeholder" in Figma). */
  detail?: { label: string; value: string };
  /** `Type=With Icon` right column: a secondary text such as "Primary Role". */
  tag?: string;
};

type ResultRowProps = {
  result: SearchResult;
  id?: string;
  active?: boolean;
  selected?: boolean;
  onClick?: () => void;
  onMouseMove?: () => void;
};

/** Figma Search Bar › Searched List Type: one result row (`role="option"`). */
export function SearchResultRow({ result, id, active, selected, onClick, onMouseMove }: ResultRowProps) {
  const withIcon = !!(result.avatarSrc || result.initials);
  return (
    <li
      id={id}
      role="option"
      aria-selected={!!selected}
      className={styles.row}
      data-type={withIcon ? 'icon' : 'default'}
      data-active={active || undefined}
      onClick={onClick}
      onMouseMove={onMouseMove}
    >
      {withIcon && <ListBoxAvatar src={result.avatarSrc} initials={result.initials} size={50} />}
      <div className={styles.rowBody}>
        <div className={styles.names}>
          <span className={styles.name}>{result.name}</span>
          {result.description && <span className={styles.description}>{result.description}</span>}
        </div>
        {result.detail && (
          <div className={styles.detail}>
            <span className={styles.detailLabel}>{result.detail.label}</span>
            <span className={styles.detailValue}>{result.detail.value}</span>
          </div>
        )}
        {result.tag && <span className={styles.tag}>{result.tag}</span>}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* SearchBar                                                                                   */
/* ------------------------------------------------------------------------------------------ */

export type SearchBarProps = {
  /** Figma `Label`: the placeholder and accessible name. */
  placeholder?: string;
  'aria-label'?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (query: string) => void;
  /** Results to show under the field. Filtering is up to you. */
  results?: SearchResult[];
  /** Called when a result is chosen with click or Enter. */
  onSelect?: (result: SearchResult) => void;
  /** Called on Enter when no result is highlighted. */
  onSubmit?: (query: string) => void;
  disabled?: boolean;
  /** Show the results list on first render (Figma `State=Active` in the stories). */
  defaultOpen?: boolean;
  id?: string;
  className?: string;
};

/**
 * Figma Search Bar: a combobox. Typing opens the results; ↓/↑ highlight a result
 * (`aria-activedescendant`, focus stays in the field), Enter chooses, Escape closes.
 */
export function SearchBar({
  placeholder = 'Search',
  'aria-label': ariaLabel,
  value,
  defaultValue = '',
  onChange,
  results = [],
  onSelect,
  onSubmit,
  disabled,
  defaultOpen = false,
  id,
  className,
}: SearchBarProps) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const listId = `${baseId}-results`;
  const [innerQuery, setInnerQuery] = useState(defaultValue);
  const query = value ?? innerQuery;
  const [open, setOpen] = useState(defaultOpen);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const isOpen = open && !disabled && results.length > 0;

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [isOpen]);

  const choose = (r: SearchResult) => {
    onSelect?.(r);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setOpen(true);
        setActive(e.key === 'ArrowDown' ? 0 : results.length - 1);
        return;
      }
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive(i => Math.min(results.length - 1, Math.max(0, i + step)));
    } else if (e.key === 'Enter') {
      if (isOpen && results[active]) {
        e.preventDefault();
        choose(results[active]);
      } else onSubmit?.(query);
    } else if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault();
        setOpen(false);
        setActive(-1);
      }
    }
  };

  return (
    <div ref={rootRef} className={[styles.bar, className].filter(Boolean).join(' ')} data-open={isOpen || undefined}>
      <SearchInput
        id={baseId}
        role="combobox"
        aria-label={ariaLabel ?? placeholder}
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={isOpen && active >= 0 ? `${listId}-${results[active]?.id}` : undefined}
        placeholder={placeholder}
        disabled={disabled}
        active={isOpen}
        value={query}
        autoComplete="off"
        onChange={e => {
          if (value === undefined) setInnerQuery(e.target.value);
          onChange?.(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => query && setOpen(true)}
        onKeyDown={onKeyDown}
      />
      <ul id={listId} role="listbox" aria-label={`${ariaLabel ?? placeholder} results`} className={styles.results} hidden={!isOpen}>
        {results.map((r, i) => (
          <SearchResultRow
            key={r.id}
            id={`${listId}-${r.id}`}
            result={r}
            active={i === active}
            selected={i === active}
            onClick={() => choose(r)}
            onMouseMove={() => setActive(i)}
          />
        ))}
      </ul>
    </div>
  );
}
