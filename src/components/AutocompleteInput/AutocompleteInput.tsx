import { useId, useLayoutEffect, useRef, useState, type InputHTMLAttributes, type KeyboardEvent } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './AutocompleteInput.module.css';

export type AutocompleteInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size' | 'value' | 'defaultValue' | 'onChange' | 'onSelect'
> & {
  /** Accessible name. Figma shows no visible label, so it is set as `aria-label`. */
  label: string;
  /** Suggestions to filter as the user types (Figma's dropdown list). */
  options: string[];
  /** Controlled text in the field. */
  value?: string;
  /** Initial text when uncontrolled. */
  defaultValue?: string;
  /** Called on every change of the field text. */
  onValueChange?: (value: string) => void;
  /** Called when the user picks a suggestion (Figma `State=Selected`). */
  onSelect?: (option: string) => void;
  /**
   * Completes the first match inline and selects the completed part
   * (the highlighted "shburger" in Figma `State=Active Input`).
   */
  inlineComplete?: boolean;
  /** Custom matcher. Defaults to a case-insensitive prefix match. */
  filter?: (option: string, query: string) => boolean;
  /** Accessible name for the clear button. */
  clearLabel?: string;
  /** Opens the suggestion list on first render (when `defaultValue` has matches). */
  defaultOpen?: boolean;
};

const prefixMatch = (option: string, query: string) => option.toLowerCase().startsWith(query.toLowerCase());

/**
 * Text Input - Autocomplete (Figma "Text Input - Autocomplete*"). Figma `State` maps to:
 * Default = idle, Activated Search = focused, Active Input = focused with suggestions open,
 * Selected = a suggestion was picked. Follows the WAI-ARIA combobox pattern.
 */
export function AutocompleteInput({
  label,
  options,
  value,
  defaultValue = '',
  onValueChange,
  onSelect,
  inlineComplete = true,
  filter = prefixMatch,
  clearLabel = 'Clear',
  defaultOpen = false,
  placeholder = 'Search',
  id,
  className,
  disabled,
  onKeyDown,
  onBlur,
  ...inputProps
}: AutocompleteInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const listId = `${inputId}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const controlled = value !== undefined;
  const [draft, setDraft] = useState(defaultValue);
  const text = controlled ? value : draft;
  // What the user typed, without the inline completion
  const [query, setQuery] = useState(defaultValue);
  const [open, setOpen] = useState(defaultOpen);
  const [active, setActive] = useState(-1);
  const [selected, setSelected] = useState(false);
  const pendingSelection = useRef<[number, number] | null>(null);

  const matches = query ? options.filter(o => filter(o, query)) : [];
  const expanded = open && matches.length > 0;

  const setText = (next: string) => {
    if (!controlled) setDraft(next);
    onValueChange?.(next);
  };

  // Select the inline completion after React has written the new value
  useLayoutEffect(() => {
    if (pendingSelection.current && inputRef.current) {
      inputRef.current.setSelectionRange(...pendingSelection.current);
      pendingSelection.current = null;
    }
  });

  const choose = (option: string) => {
    setText(option);
    setQuery(option);
    setOpen(false);
    setActive(-1);
    setSelected(true);
    onSelect?.(option);
  };

  const handleInput = (typed: string, inserting: boolean) => {
    setQuery(typed);
    setOpen(true);
    setActive(-1);
    setSelected(false);
    const first = typed && inlineComplete && inserting ? options.find(o => prefixMatch(o, typed)) : undefined;
    if (first && first.length > typed.length) {
      setText(typed + first.slice(typed.length));
      pendingSelection.current = [typed.length, first.length];
    } else {
      setText(typed);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!expanded) {
        setOpen(true);
        return;
      }
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      setActive(i => (i + delta + matches.length) % matches.length);
    } else if (e.key === 'Enter' && expanded) {
      e.preventDefault();
      // Enter accepts the active option, or the inline completion / exact match (in the option's casing)
      const pick = active >= 0 ? matches[active] : matches.find(o => o.toLowerCase() === text.toLowerCase());
      if (pick) choose(pick);
      else setOpen(false);
    } else if (e.key === 'Escape') {
      if (expanded) {
        e.preventDefault();
        setOpen(false);
        setActive(-1);
      } else if (text) {
        e.preventDefault();
        clear();
      }
    }
  };

  const clear = () => {
    setText('');
    setQuery('');
    setOpen(false);
    setActive(-1);
    setSelected(false);
    inputRef.current?.focus();
  };

  return (
    <div
      className={[styles.field, className].filter(Boolean).join(' ')}
      data-open={expanded || undefined}
      data-selected={selected || undefined}
      data-disabled={disabled || undefined}
    >
      <div className={styles.control}>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-label={label}
          aria-autocomplete={inlineComplete ? 'both' : 'list'}
          aria-expanded={expanded}
          aria-controls={listId}
          aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          className={styles.input}
          value={text}
          placeholder={placeholder}
          disabled={disabled}
          onChange={e => {
            const native = e.nativeEvent as InputEvent;
            handleInput(e.target.value, native.inputType?.startsWith('insert') ?? true);
          }}
          onKeyDown={handleKeyDown}
          onBlur={e => {
            onBlur?.(e);
            setOpen(false);
            setActive(-1);
          }}
          {...inputProps}
        />
        {text && !disabled && (
          <button type="button" className={styles.clear} aria-label={clearLabel} onClick={clear}>
            <Icon name="close" size={24} color="currentColor" />
          </button>
        )}
      </div>
      <ul id={listId} role="listbox" aria-label={label} className={styles.list} hidden={!expanded}>
        {matches.map((option, i) => (
          <li
            key={option}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            className={styles.option}
            // Keep focus in the input so the list does not close before the click lands
            onMouseDown={e => e.preventDefault()}
            onClick={() => choose(option)}
          >
            {option}
          </li>
        ))}
      </ul>
    </div>
  );
}
