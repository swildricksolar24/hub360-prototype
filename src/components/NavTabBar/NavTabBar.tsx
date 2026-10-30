import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, KeyboardEvent } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './NavTabBar.module.css';

/** Duration of tab and underline slides when tabs move (ms). */
const SLIDE_MS = 200;
/** How far a press must move before it becomes a drag instead of a click (px). */
const DRAG_START_PX = 4;

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
  /** Figma "Tab Label" `Label` text property. Keep it short (e.g. the page name); put the full name in `title`. */
  label: string;
  /** Icon before the label (e.g. the section's icon). */
  icon?: string;
  /** Full name shown as a tooltip, e.g. "Inventory · Warehouses" when the label is "Warehouses". */
  title?: string;
  /** Figma "Tab Button" `State=Active`. Rendered as `aria-selected` on the tab. */
  active?: boolean;
  /**
   * Figma `State=Inactive` (vs `First / Last`): marks where Figma draws a divider after the tab. The current
   * underline style (explorations/tab-bar-options.html, option 3) draws no dividers; kept as `data-divider`.
   */
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
  /** Pointer handlers for live drag-to-reorder (set by NavTabBar when `onReorder` is given). */
  dragProps?: HTMLAttributes<HTMLDivElement>;
  /** The tab is being dragged (drawn lifted, following the pointer). */
  dragging?: boolean;
};

/** Figma "Tab Button" (and its "Tab Label"): one closable tab. Use inside `role="tablist"`. */
export function NavTab({
  label,
  icon,
  title,
  active = false,
  divider = false,
  onSelect,
  onClose,
  closeLabel,
  id,
  focusable,
  tabRef,
  dragProps,
  dragging = false,
}: NavTabProps) {
  return (
    <div
      className={styles.tab}
      data-active={active || undefined}
      data-divider={divider || undefined}
      data-dragging={dragging || undefined}
      title={title}
      {...dragProps}
    >
      <button
        ref={tabRef}
        id={id}
        type="button"
        role="tab"
        aria-selected={active}
        aria-label={title}
        tabIndex={active || focusable ? 0 : -1}
        className={styles.tabButton}
        onClick={onSelect}
      >
        {icon && <Icon name={icon} size={16} color="currentColor" />}
        {label}
      </button>
      {onClose && (
        <button type="button" className={styles.close} aria-label={closeLabel ?? `Close ${title ?? label}`} onClick={onClose}>
          <Icon name="close-small" size={16} color="currentColor" />
        </button>
      )}
    </div>
  );
}

/** `icon` and `title` are optional: see NavTab. */
export type NavTabBarItem = { id: string; label: string; icon?: string; title?: string };

export type NavTabBarProps = {
  /** The open tabs. */
  tabs: NavTabBarItem[];
  /** Figma `Active Tab` (First–Fourth): the id of the active tab. */
  activeId?: string;
  onSelect?: (id: string) => void;
  /** Shows a close icon on every tab. */
  onClose?: (id: string) => void;
  /**
   * Makes tabs reorderable: drag a tab to another slot, or press Ctrl+Shift+←/→ on a focused tab.
   * Called with the tab ids in their new order.
   */
  onReorder?: (ids: string[]) => void;
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
  onReorder,
  onHome,
  onAdd,
  homeLabel = 'Home',
  addLabel = 'New tab',
  'aria-label': ariaLabel = 'Open tabs',
  className,
}: NavTabBarProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const listRef = useRef<HTMLDivElement>(null);
  const activeIndex = tabs.findIndex(t => t.id === activeId);

  // Sliding underline: one indicator moves to the active tab instead of each tab drawing its own.
  type Indicator = { id: string; left: number; width: number };
  const [indicator, setIndicator] = useState<Indicator | null>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const previous = useRef<Indicator | null>(null);
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const place = () => {
      const tab = activeId ? refs.current[activeId]?.parentElement : null;
      setIndicator(tab && activeId ? { id: activeId, left: tab.offsetLeft, width: tab.offsetWidth } : null);
    };
    place();
    // Labels can change width (fonts loading, a tab closing), so follow the list's size too
    const observer = new ResizeObserver(place);
    observer.observe(list);
    return () => observer.disconnect();
  }, [activeId, tabs]);
  // When the active tab changes, the underline first shrinks in place to 25% of its width around its own center,
  // then travels to the new tab while expanding to its width. When the active tab only moves to another slot
  // (reordering, a tab closing) the underline slides along with it; while it is being dragged it rides with it.
  useLayoutEffect(() => {
    const el = indicatorRef.current;
    const from = previous.current;
    previous.current = indicator;
    if (!el || !indicator || !from || from.left === indicator.left) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (from.id === indicator.id) {
      el.getAnimations().forEach(a => a.cancel());
      if (!reduced && drag.current?.id !== indicator.id) {
        el.animate([{ transform: `translateX(${from.left}px)` }, { transform: `translateX(${indicator.left}px)` }], {
          duration: SLIDE_MS,
          easing: 'ease-out',
        });
      }
      return;
    }
    if (reduced) return;

    // Start from where the underline is right now, in case a previous move is still running
    const running = el.getAnimations();
    const start = running.length
      ? { left: new DOMMatrix(getComputedStyle(el).transform).m41, width: el.getBoundingClientRect().width }
      : from;
    running.forEach(a => a.cancel());

    const shrunk = start.width * 0.25; // length of the underline once it has shrunk
    const shrunkLeft = start.left + start.width / 2 - shrunk / 2; // centered on the line it is leaving
    el.animate(
      [
        // 1. shrink toward its own center
        { transform: `translateX(${start.left}px)`, width: `${start.width}px`, easing: 'ease-in' },
        // 2. travel to the new tab, expanding as it goes
        { transform: `translateX(${shrunkLeft}px)`, width: `${shrunk}px`, offset: 0.35, easing: 'ease-out' },
        { transform: `translateX(${indicator.left}px)`, width: `${indicator.width}px` },
      ],
      { duration: 380 },
    );
  }, [indicator]);

  // Reordering: the order a move produces, or null when nothing changes
  const moved = (id: string, toIndex: number) => {
    const from = tabs.findIndex(t => t.id === id);
    const to = Math.max(0, Math.min(tabs.length - 1, toIndex));
    if (from === -1 || from === to) return null;
    const ids = tabs.map(t => t.id);
    ids.splice(to, 0, ...ids.splice(from, 1));
    return ids;
  };

  const wrapper = (id: string) => refs.current[id]?.parentElement ?? null;
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Where each tab is drawn right now (left edge within the list, including any slide in progress). Taken
  // just before a reorder so the tabs that move can slide from where they were seen.
  const positions = useRef<Record<string, number>>({});
  const snapshot = () => {
    const listLeft = listRef.current?.getBoundingClientRect().left ?? 0;
    for (const t of tabs) {
      const el = wrapper(t.id);
      if (el) positions.current[t.id] = el.getBoundingClientRect().left - listLeft;
    }
  };
  const reorder = (ids: string[] | null) => {
    if (!ids || !onReorder) return;
    snapshot();
    onReorder(ids);
  };

  // Live dragging: the tab follows the pointer and the tabs it passes slide aside. Once a tab is pressed the
  // whole page tracks the pointer, so quick or sloppy drags still work; a press that moves less than
  // DRAG_START_PX stays a normal click.
  type Drag = { id: string; pointerId: number; startX: number; grab: number; lastX: number; active: boolean; stop: () => void };
  const drag = useRef<Drag | null>(null);
  const swallowClick = useRef(false);
  const [dragId, setDragId] = useState<string | null>(null);

  /** Puts the dragged tab under the pointer; returns its edges within the list and its offset from its slot. */
  const followPointer = () => {
    const d = drag.current;
    const list = listRef.current;
    const el = d && wrapper(d.id);
    if (!d?.active || !list || !el) return null;
    const left = Math.max(0, Math.min(list.offsetWidth - el.offsetWidth, d.lastX - list.getBoundingClientRect().left - d.grab));
    const dx = left - el.offsetLeft;
    el.style.transform = `translateX(${dx}px)`;
    if (d.id === activeId) indicatorRef.current?.style.setProperty('--dx', `${dx}px`);
    return { left, right: left + el.offsetWidth, dx };
  };

  const onDragMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    d.lastX = e.clientX;
    if (!d.active) {
      if (Math.abs(e.clientX - d.startX) < DRAG_START_PX) return;
      d.active = true;
      document.documentElement.style.cursor = 'grabbing'; // keep the grab cursor when the pointer leaves the tab
      setDragId(d.id);
    }
    e.preventDefault();
    const pos = followPointer();
    if (!pos) return;
    // A tab gives up its slot as soon as the leading edge of the dragged tab reaches its middle
    const edge = pos.dx > 0 ? pos.right : pos.left;
    const target = tabs.filter(t => {
      const el = t.id !== d.id && wrapper(t.id);
      return el && el.offsetLeft + el.offsetWidth / 2 < edge;
    }).length;
    reorder(moved(d.id, target));
  };

  const endDrag = () => {
    const d = drag.current;
    drag.current = null;
    d?.stop();
    if (!d?.active) return;
    document.documentElement.style.removeProperty('cursor');
    // Settle the tab (and the underline riding with it) into its slot
    const el = wrapper(d.id);
    const ind = indicatorRef.current;
    const settle = (node: HTMLElement, fromTransform: string, toTransform: string) => {
      if (!reducedMotion()) node.animate([{ transform: fromTransform }, { transform: toTransform }], { duration: SLIDE_MS, easing: 'ease-out' });
    };
    if (el) {
      const from = el.style.transform;
      el.style.transform = '';
      if (from) settle(el, from, 'translateX(0px)');
    }
    if (ind && indicator && d.id === activeId) {
      const dx = ind.style.getPropertyValue('--dx');
      ind.style.removeProperty('--dx');
      if (dx) settle(ind, `translateX(calc(${indicator.left}px + ${dx}))`, `translateX(${indicator.left}px)`);
    }
    // The press ended a drag, not a click on the tab
    swallowClick.current = true;
    setTimeout(() => (swallowClick.current = false), 0);
    setDragId(null);
  };

  // Page-level listeners call the latest handlers (the tab list changes while dragging)
  const handlers = useRef({ move: onDragMove, end: endDrag });
  handlers.current = { move: onDragMove, end: endDrag };
  useLayoutEffect(() => () => drag.current?.stop(), []);

  const dragProps = (id: string): HTMLAttributes<HTMLDivElement> | undefined =>
    onReorder && {
      onPointerDown: e => {
        if (e.button !== 0 || (e.target as Element).closest(`.${styles.close}`)) return;
        drag.current?.stop();
        const move = (ev: PointerEvent) => handlers.current.move(ev);
        const end = () => handlers.current.end();
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', end);
        window.addEventListener('pointercancel', end);
        drag.current = {
          id,
          pointerId: e.pointerId,
          startX: e.clientX,
          grab: e.clientX - e.currentTarget.getBoundingClientRect().left,
          lastX: e.clientX,
          active: false,
          stop: () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', end);
            window.removeEventListener('pointercancel', end);
          },
        };
      },
      onClickCapture: e => {
        if (!swallowClick.current) return;
        e.preventDefault();
        e.stopPropagation();
      },
    };

  // After any change to the tabs: keep the dragged tab under the pointer, and slide every other tab that
  // moved from where it was drawn to its new slot.
  useLayoutEffect(() => {
    followPointer();
    const reduced = reducedMotion();
    const next: Record<string, number> = {};
    for (const t of tabs) {
      const el = wrapper(t.id);
      if (!el) continue;
      next[t.id] = el.offsetLeft;
      const was = positions.current[t.id];
      if (reduced || was === undefined || was === el.offsetLeft || t.id === drag.current?.id) continue;
      el.getAnimations().forEach(a => a.cancel());
      el.animate([{ transform: `translateX(${was - el.offsetLeft}px)` }, { transform: 'translateX(0px)' }], {
        duration: SLIDE_MS,
        easing: 'ease-out',
      });
    }
    positions.current = next;
    // followPointer reads the latest drag state from refs, so only a new tab list needs to re-run this
  }, [tabs]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Ctrl+Shift+←/→ (⌘+Shift on Mac) moves the focused tab one slot
    if (onReorder && e.shiftKey && (e.ctrlKey || e.metaKey) && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      const id = Object.keys(refs.current).find(k => refs.current[k] === document.activeElement);
      if (!id) return;
      e.preventDefault();
      reorder(moved(id, tabs.findIndex(t => t.id === id) + (e.key === 'ArrowRight' ? 1 : -1)));
      return;
    }
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
      <div ref={listRef} role="tablist" aria-label={ariaLabel} className={styles.list} onKeyDown={onKeyDown}>
        {tabs.map((t, i) => (
          <NavTab
            key={t.id}
            label={t.label}
            icon={t.icon}
            title={t.title}
            active={i === activeIndex}
            focusable={activeIndex === -1 && i === 0}
            divider={i !== activeIndex && i + 1 !== activeIndex && i < tabs.length - 1}
            onSelect={() => onSelect?.(t.id)}
            onClose={onClose && (() => onClose(t.id))}
            tabRef={el => {
              refs.current[t.id] = el;
            }}
            dragProps={dragProps(t.id)}
            dragging={dragId === t.id}
          />
        ))}
        {indicator && (
          <span
            ref={indicatorRef}
            className={styles.indicator}
            style={{ '--x': `${indicator.left}px`, '--w': `${indicator.width}px` } as CSSProperties}
            aria-hidden="true"
          />
        )}
      </div>
      {onAdd && <NavTabSmall icon="plus" label={addLabel} onClick={onAdd} />}
    </div>
  );
}
