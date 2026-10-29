import type { ButtonHTMLAttributes, KeyboardEvent } from 'react';
import { useRef } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './NavTabBar.module.css';

export type NavTabSmallProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  /** Accessible name; the button shows only an icon. */
  label: string;
  /** Figma uses `home` (first) and `plus` (last). */
  icon: string;
};

/** Figma "Tab Small": the 48×24 icon button at either end of the bar (Home, New tab). */
export function NavTabSmall({ label, icon, type = 'button', className, ...rest }: NavTabSmallProps) {
  return (
    <button type={type} aria-label={label} title={label} className={[styles.small, className].filter(Boolean).join(' ')} {...rest}>
      <Icon name={icon} size={16} color="currentColor" />
    </button>
  );
}

export type NavTabProps = {
  /** Figma "Tab Label" `Label` text property. */
  label: string;
  /** Figma "Tab Button" `State=Active`. Rendered as `aria-selected` on the tab. */
  active?: boolean;
  /** Draws the 10px divider after the tab (Figma `State=Inactive`; `First / Last` has none). */
  divider?: boolean;
  onSelect?: () => void;
  /** Shows the close icon. Called when it is clicked. */
  onClose?: () => void;
  /** Accessible name of the close button. */
  closeLabel?: string;
  id?: string;
  /** Keeps the tab in the Tab order when no tab is active. */
  focusable?: boolean;
  tabRef?: (el: HTMLButtonElement | null) => void;
};

/** Figma "Tab Button" (and its "Tab Label"): one closable tab. Use inside `role="tablist"`. */
export function NavTab({ label, active = false, divider = false, onSelect, onClose, closeLabel, id, focusable, tabRef }: NavTabProps) {
  return (
    <div className={styles.tab} data-active={active || undefined} data-divider={divider || undefined}>
      <button
        ref={tabRef}
        id={id}
        type="button"
        role="tab"
        aria-selected={active}
        tabIndex={active || focusable ? 0 : -1}
        className={styles.tabButton}
        onClick={onSelect}
      >
        {label}
      </button>
      {onClose && (
        <button type="button" className={styles.close} aria-label={closeLabel ?? `Close ${label}`} onClick={onClose}>
          <Icon name="close-small" size={16} color="currentColor" />
        </button>
      )}
    </div>
  );
}

export type NavTabBarItem = { id: string; label: string };

export type NavTabBarProps = {
  /** The open tabs. */
  tabs: NavTabBarItem[];
  /** Figma `Active Tab` (First–Fourth): the id of the active tab. */
  activeId?: string;
  onSelect?: (id: string) => void;
  /** Shows a close icon on every tab. */
  onClose?: (id: string) => void;
  /** Shows the leading Home button. */
  onHome?: () => void;
  /** Shows the trailing "+" button. */
  onAdd?: () => void;
  homeLabel?: string;
  addLabel?: string;
  /** Accessible name of the tab list. */
  'aria-label'?: string;
  className?: string;
};

/** Figma Main Nav "Tab Bar": browser-style open-record tabs with Home and New tab buttons. */
export function NavTabBar({
  tabs,
  activeId,
  onSelect,
  onClose,
  onHome,
  onAdd,
  homeLabel = 'Home',
  addLabel = 'New tab',
  'aria-label': ariaLabel = 'Open tabs',
  className,
}: NavTabBarProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const activeIndex = tabs.findIndex(t => t.id === activeId);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = {
      ArrowRight: (activeIndex + 1) % tabs.length,
      ArrowLeft: (activeIndex - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    if (!(e.key in keys) || !tabs.length) return;
    e.preventDefault();
    const next = tabs[keys[e.key]];
    onSelect?.(next.id);
    refs.current[next.id]?.focus();
  };

  return (
    <div className={[styles.bar, className].filter(Boolean).join(' ')}>
      {onHome && <NavTabSmall icon="home" label={homeLabel} onClick={onHome} />}
      <div role="tablist" aria-label={ariaLabel} className={styles.list} onKeyDown={onKeyDown}>
        {tabs.map((t, i) => (
          <NavTab
            key={t.id}
            label={t.label}
            active={i === activeIndex}
            focusable={activeIndex === -1 && i === 0}
            divider={i !== activeIndex && i + 1 !== activeIndex && i < tabs.length - 1}
            onSelect={() => onSelect?.(t.id)}
            onClose={onClose && (() => onClose(t.id))}
            tabRef={el => {
              refs.current[t.id] = el;
            }}
          />
        ))}
      </div>
      {onAdd && <NavTabSmall icon="plus" label={addLabel} onClick={onAdd} />}
    </div>
  );
}
