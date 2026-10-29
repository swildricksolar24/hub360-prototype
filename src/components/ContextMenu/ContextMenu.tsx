import { useEffect, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode, type Ref } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './ContextMenu.module.css';

export type MenuItemProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'disabled'> & {
  /** Figma `Label`. */
  children: ReactNode;
  /** Figma `Show Icon` + the icon instance. Leave out to hide the leading icon. */
  icon?: string;
  /** Figma `Show Submenu`: shows the trailing chevron and marks the item as opening a submenu. */
  submenu?: boolean;
  ref?: Ref<HTMLButtonElement>;
  /** Figma `State=Disabled`. Uses `aria-disabled` so the item stays reachable with the arrow keys. */
  disabled?: boolean;
};

/** One row of a ContextMenu (Figma "Menu Item"). Render it inside a ContextMenu, which manages focus. */
export function MenuItem({ children, icon, submenu = false, disabled = false, className, onClick, tabIndex = -1, ...rest }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className={[styles.item, className].filter(Boolean).join(' ')}
      aria-disabled={disabled || undefined}
      aria-haspopup={submenu ? 'menu' : undefined}
      tabIndex={tabIndex}
      onClick={disabled ? undefined : onClick}
      {...rest}
    >
      <span className={styles.content}>
        {icon && <Icon name={icon} size={24} color="currentColor" className={styles.icon} />}
        <span className={styles.label}>{children}</span>
      </span>
      {submenu && <Icon name="chevron-right" size={24} color="currentColor" className={styles.icon} />}
    </button>
  );
}

export type ContextMenuItem = {
  label: ReactNode;
  icon?: string;
  submenu?: boolean;
  disabled?: boolean;
  /** Called when the item is chosen with a click, Enter or Space. */
  onSelect?: () => void;
};

export type ContextMenuProps = {
  items: ContextMenuItem[];
  /** Accessible name of the menu. */
  'aria-label': string;
  /** Called on Escape or Tab, and after an item is chosen. */
  onClose?: () => void;
  /** Moves focus to the first item when the menu mounts. */
  autoFocus?: boolean;
  className?: string;
};

/**
 * Figma "Context Menu": a raised list of Menu Items. Implements the WAI-ARIA menu pattern:
 * one tab stop, Arrow Up / Down (wrapping), Home / End, Escape and Tab close it.
 */
export function ContextMenu({ items, onClose, autoFocus = false, className, ...aria }: ContextMenuProps) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const move = (index: number) => {
    const next = (index + items.length) % items.length;
    setActive(next);
    refs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        move(active + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        move(active - 1);
        break;
      case 'Home':
        e.preventDefault();
        move(0);
        break;
      case 'End':
        e.preventDefault();
        move(items.length - 1);
        break;
      case 'Escape':
        e.preventDefault();
        onClose?.();
        break;
      case 'Tab':
        onClose?.();
        break;
    }
  };

  return (
    <div role="menu" aria-orientation="vertical" className={[styles.menu, className].filter(Boolean).join(' ')} onKeyDown={onKeyDown} {...aria}>
      {items.map((item, i) => (
        <MenuItem
          key={i}
          ref={el => {
            refs.current[i] = el;
          }}
          icon={item.icon}
          submenu={item.submenu}
          disabled={item.disabled}
          tabIndex={i === active ? 0 : -1}
          onFocus={() => setActive(i)}
          onClick={() => {
            item.onSelect?.();
            onClose?.();
          }}
        >
          {item.label}
        </MenuItem>
      ))}
    </div>
  );
}
