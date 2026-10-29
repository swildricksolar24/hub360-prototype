import { Fragment, useEffect, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode, type Ref } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './ListBox.module.css';

/**
 * Figma "ListViews" `Type`, minus Category (categories come from `group` on the options):
 * default = List Item / Default · chevron = List Item / Icon · avatar = List Item / Avatar ·
 * checkbox = List Item / Checkbox.
 */
export type ListBoxType = 'default' | 'chevron' | 'avatar' | 'checkbox';

/**
 * list = the ListBox page items (List Item / *, 44–56px rows on Surfaces/Overlay).
 * selector = the compact "Dropdown Selector" rows (36px) used inside "Dropdown Holder"
 * on the Drop Down - Selector, Multiselect and Dropdown Tree pages.
 */
export type ListBoxAppearance = 'list' | 'selector';

export type ListBoxOption = {
  value: string;
  label: string;
  disabled?: boolean;
  /** Figma `State=Error` on a single item. */
  error?: boolean;
  /** Options with the same `group` render under a "List Item / Category" heading. */
  group?: string;
  /** Avatar photo (type `avatar`). */
  avatarSrc?: string;
  /** Avatar initials when there is no photo (type `avatar`). */
  initials?: string;
  /** Leading icon for the `selector` appearance (Figma "Show Icon"). */
  icon?: string;
};

/* ------------------------------------------------------------------------------------------ */
/* Item                                                                                        */
/* ------------------------------------------------------------------------------------------ */

export type ListBoxItemProps = Omit<HTMLAttributes<HTMLLIElement>, 'children'> & {
  ref?: Ref<HTMLLIElement>;
  /** Figma `Label`. */
  label: ReactNode;
  /** Which List Item set to draw. `tree` = List Item / Tree. */
  type?: ListBoxType | 'tree';
  appearance?: ListBoxAppearance;
  /** `aria-selected`. Checkbox items show the check; others use a teal tint (not in Figma). */
  selected?: boolean;
  /** Tree items: chevron right (collapsed) or down (expanded). */
  expanded?: boolean;
  /** Tree depth. In the selector appearance level 1+ is Figma `State=Indent`. */
  level?: number;
  /** Figma `State=Error`. */
  error?: boolean;
  /** Figma `State=Disabled`, rendered as `aria-disabled`. */
  disabled?: boolean;
  avatarSrc?: string;
  initials?: string;
  /** Leading icon (selector appearance, Figma "Show Icon"). */
  icon?: string;
};

/** Small round avatar used by List Item / Avatar (32px) and Searched List Type (50px). */
export function ListBoxAvatar({ src, initials, size = 32 }: { src?: string; initials?: string; size?: 32 | 50 }) {
  return (
    <span className={styles.avatar} data-size={size} aria-hidden>
      {src ? <img src={src} alt="" /> : initials}
    </span>
  );
}

/** One "List Item" row. Rendered as `role="option"` (or `treeitem` when used by TreeList). */
export function ListBoxItem({
  label,
  type = 'default',
  appearance = 'list',
  selected,
  expanded,
  level = 0,
  error,
  disabled,
  avatarSrc,
  initials,
  icon,
  className,
  role = 'option',
  ...rest
}: ListBoxItemProps) {
  const iconSize = appearance === 'selector' ? 20 : 24;
  let lead: ReactNode = null;
  let trail: ReactNode = null;

  if (type === 'tree') {
    const dir = appearance === 'selector' ? (expanded ? 'up' : 'down') : expanded ? 'down' : 'right';
    lead =
      expanded === undefined ? (
        <span className={styles.spacer} data-size={iconSize} />
      ) : (
        <Icon name={`chevron-${dir}`} size={iconSize} color="currentColor" className={styles.icon} />
      );
  } else if (type === 'checkbox') {
    lead =
      appearance === 'selector' ? (
        <Icon name={selected ? 'checkbox-checked' : 'checkbox'} size={20} color="currentColor" className={styles.icon} />
      ) : (
        <span className={styles.box}>
          <Icon name="check" size={24} color="currentColor" className={styles.check} />
        </span>
      );
  } else if (type === 'avatar') {
    lead = <ListBoxAvatar src={avatarSrc} initials={initials} />;
  } else if (icon) {
    lead = <Icon name={icon} size={iconSize} color="currentColor" className={styles.icon} />;
  } else if (appearance === 'selector' && level > 0) {
    // Figma `State=Indent` keeps a 20px "None" icon slot before the label
    lead = <span className={styles.spacer} data-size={20} />;
  }
  if (type === 'chevron') {
    trail = <Icon name="chevron-right" size={24} color="currentColor" className={styles.icon} />;
  }

  return (
    <li
      role={role}
      className={[styles.item, className].filter(Boolean).join(' ')}
      data-type={type}
      data-appearance={appearance}
      data-level={level || undefined}
      data-error={error || undefined}
      aria-selected={role === 'option' ? !!selected : undefined}
      aria-disabled={disabled || undefined}
      style={level && appearance === 'list' ? { ['--level' as string]: level } : undefined}
      {...rest}
    >
      {lead}
      <span className={styles.label}>{label}</span>
      {trail}
    </li>
  );
}

/** Figma "List Item / Category": a non-interactive group heading. */
export function ListBoxCategory({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <div className={styles.category} id={id}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Keyboard helpers shared by ListBox and TreeList                                             */
/* ------------------------------------------------------------------------------------------ */

/** Next enabled index in `list` from `from`, moving `step`; clamps at the ends. */
export function moveIndex<T>(list: T[], from: number, step: 1 | -1, enabled: (x: T) => boolean) {
  for (let i = from + step; i >= 0 && i < list.length; i += step) if (enabled(list[i])) return i;
  return from;
}

/* ------------------------------------------------------------------------------------------ */
/* ListBox                                                                                     */
/* ------------------------------------------------------------------------------------------ */

export type ListBoxProps = {
  options: ListBoxOption[];
  /** Figma "ListViews" `Type`. */
  type?: ListBoxType;
  appearance?: ListBoxAppearance;
  /** Multi-select (`aria-multiselectable`). Checkbox type implies it in the dropdowns. */
  multiple?: boolean;
  /** Selected value (single) or values (multiple). */
  value?: string | string[] | null;
  onChange?: (value: string | string[]) => void;
  /** Fires after an option is chosen with click, Enter or Space; dropdowns close on it. */
  onCommit?: (option: ListBoxOption) => void;
  /** Escape or Tab; dropdowns close on it and return focus to their button. */
  onDismiss?: (reason: 'escape' | 'tab') => void;
  /** Move focus to the selected (or first) option on mount. */
  autoFocus?: boolean;
  /** Accessible name. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  id?: string;
  className?: string;
  /** Text shown when `options` is empty. */
  emptyMessage?: ReactNode;
};

/**
 * Figma ListBox › ListViews. A keyboard-accessible listbox: roving focus on the options,
 * ↑/↓/Home/End to move, Enter/Space to choose, type-ahead by first letter.
 */
export function ListBox({
  options,
  type = 'default',
  appearance = 'list',
  multiple = false,
  value,
  onChange,
  onCommit,
  onDismiss,
  autoFocus,
  id,
  className,
  emptyMessage = 'No results',
  ...aria
}: ListBoxProps) {
  const autoId = useId();
  const listId = id ?? autoId;
  const selected = new Set(value == null ? [] : Array.isArray(value) ? value : [value]);
  const enabled = options.filter(o => !o.disabled);
  const firstSelected = enabled.find(o => selected.has(o.value));
  const [active, setActive] = useState<string | undefined>(firstSelected?.value ?? enabled[0]?.value);
  const refs = useRef(new Map<string, HTMLLIElement>());
  const activeValue = enabled.some(o => o.value === active) ? active : enabled[0]?.value;

  useEffect(() => {
    // Only on mount: the dropdowns mount the list when they open
    if (autoFocus && activeValue !== undefined) refs.current.get(activeValue)?.focus();
  }, []);

  const focusOption = (v: string | undefined) => {
    if (v === undefined) return;
    setActive(v);
    refs.current.get(v)?.focus();
  };

  const choose = (o: ListBoxOption) => {
    if (o.disabled) return;
    setActive(o.value);
    if (multiple) {
      const next = selected.has(o.value) ? [...selected].filter(v => v !== o.value) : [...selected, o.value];
      onChange?.(next);
    } else {
      onChange?.(o.value);
    }
    onCommit?.(o);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const i = Math.max(0, options.findIndex(o => o.value === activeValue));
    const isEnabled = (o: ListBoxOption) => !o.disabled;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusOption(options[moveIndex(options, i, 1, isEnabled)].value);
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusOption(options[moveIndex(options, i, -1, isEnabled)].value);
        break;
      case 'Home':
        e.preventDefault();
        focusOption(enabled[0]?.value);
        break;
      case 'End':
        e.preventDefault();
        focusOption(enabled[enabled.length - 1]?.value);
        break;
      case 'Enter':
      case ' ': {
        e.preventDefault();
        const o = options.find(x => x.value === activeValue);
        if (o) choose(o);
        break;
      }
      case 'Escape':
        if (onDismiss) {
          e.preventDefault();
          e.stopPropagation();
          onDismiss('escape');
        }
        break;
      case 'Tab':
        onDismiss?.('tab');
        break;
      default:
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const k = e.key.toLowerCase();
          const start = Math.max(0, enabled.findIndex(o => o.value === activeValue));
          const ordered = [...enabled.slice(start + 1), ...enabled.slice(0, start + 1)];
          const hit = ordered.find(o => o.label.toLowerCase().startsWith(k));
          if (hit) focusOption(hit.value);
        }
    }
  };

  const renderOption = (o: ListBoxOption) => (
    <ListBoxItem
      key={o.value}
      id={`${listId}-${o.value}`}
      ref={(el: HTMLLIElement | null) => {
        if (el) refs.current.set(o.value, el);
        else refs.current.delete(o.value);
      }}
      label={o.label}
      type={type}
      appearance={appearance}
      selected={selected.has(o.value)}
      disabled={o.disabled}
      error={o.error}
      avatarSrc={o.avatarSrc}
      initials={o.initials}
      icon={o.icon}
      tabIndex={o.value === activeValue ? 0 : -1}
      onClick={() => choose(o)}
    />
  );

  // Group consecutive options that share a `group` under a Category heading
  const blocks: { group?: string; items: ListBoxOption[] }[] = [];
  for (const o of options) {
    const last = blocks[blocks.length - 1];
    if (last && last.group === o.group) last.items.push(o);
    else blocks.push({ group: o.group, items: [o] });
  }

  return (
    <ul
      id={listId}
      role="listbox"
      aria-multiselectable={multiple || undefined}
      className={[styles.listbox, className].filter(Boolean).join(' ')}
      data-appearance={appearance}
      onKeyDown={onKeyDown}
      {...aria}
    >
      {options.length === 0 && <li className={styles.empty}>{emptyMessage}</li>}
      {blocks.map((b, bi) =>
        b.group ? (
          <li key={`g${bi}`} role="presentation" className={styles.groupWrap}>
            <ListBoxCategory id={`${listId}-g${bi}`}>{b.group}</ListBoxCategory>
            <ul role="group" aria-labelledby={`${listId}-g${bi}`} className={styles.group}>
              {b.items.map(renderOption)}
            </ul>
          </li>
        ) : (
          <Fragment key={`b${bi}`}>{b.items.map(renderOption)}</Fragment>
        ),
      )}
    </ul>
  );
}
