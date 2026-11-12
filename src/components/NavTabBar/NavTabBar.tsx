import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './NavTabBar.module.css';

/** Duration of tab and underline slides when tabs move (ms). */
const SLIDE_MS = 200;
/** Duration of the underline rising up under a tab that has just opened (ms): slow on purpose. */
const RISE_MS = 700;
/** Marks the rise animation, so a move of its tab mid-rise continues it instead of replacing it. */
const RISE_ID = 'tab-underline-rise';
/**
 * A named tab hugs its label: its padding, icon, gaps and close button take a fixed 76px (16 + 16 + 8 + 8 + 16 + 12),
 * plus the name. When the tabs don't fit, names shrink and end in "…". A name stays while at least 3 letters and the
 * "…" still fit, about 44px in the tab font (14px Inter: "New…" is 42px, 43px semi-bold on the active tab); with less
 * it would be unreadable, so the tabs show their icons instead. (A name shorter than that just has to fit whole.)
 */
const NAMED_TAB_FIXED_PX = 76;
const NAME_MIN_PX = 44;
/** How far a press must move before it becomes a drag instead of a click (px). */
const DRAG_START_PX = 4;

export type NavTabSmallProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  /** Accessible name; the button shows only an icon. */
  label: string;
  /** Figma uses `home` (first) and `plus` (last). */
  icon: string;
};

/** Figma "Tab Small": the 48×24 icon button at either end of the bar (All tabs, Home, New tab). */
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
  /**
   * Not in Figma: shows only the icon (the name stays in the tooltip and for screen readers), with the close button
   * on hover, focus or the active tab. NavTabBar sets it when the bar is too crowded for readable names.
   */
  compact?: boolean;
  /** The narrowest the tab may shrink to (px), e.g. to keep 3 letters of its name. Set by NavTabBar. */
  minWidth?: number;
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
  compact = false,
  minWidth,
}: NavTabProps) {
  // Only a tab with an icon can drop its name
  const iconOnly = compact && !!icon;
  return (
    <div
      className={styles.tab}
      data-active={active || undefined}
      data-divider={divider || undefined}
      data-dragging={dragging || undefined}
      data-compact={iconOnly || undefined}
      style={iconOnly ? undefined : { minWidth }}
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
        <span className={styles.tabLabel}>{label}</span>
      </button>
      {onClose && (
        <button type="button" className={styles.close} aria-label={closeLabel ?? `Close ${title ?? label}`} onClick={onClose}>
          <Icon name="close-small" size={16} color="currentColor" />
        </button>
      )}
    </div>
  );
}

/**
 * `icon` and `title` are optional: see NavTab. `blank` marks an empty tab (like a browser's new tab from "+"): when it
 * turns into a page, its underline rises in as it does for a newly opened tab.
 */
export type NavTabBarItem = { id: string; label: string; icon?: string; title?: string; blank?: boolean };

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
  /**
   * Shows an "All tabs" button at the far right of the bar (Figma Tab Bar, 2133:4457). Called when it's clicked, e.g. to open an
   * overview of every open tab.
   */
  onShowAll?: () => void;
  /**
   * Extra buttons at the right end of the bar, just left of All tabs (e.g. a NavTabSmall that opens a panel). Not in
   * Figma. They stay at the far right whether or not All tabs shows.
   */
  actions?: ReactNode;
  /** Shows the leading Home button. */
  onHome?: () => void;
  /** Shows the trailing "+" button. */
  onAdd?: () => void;
  /** Accessible name and tooltip of the All tabs button. Defaults to "All tabs (N)" with the open tab count. */
  showAllLabel?: string;
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
  onShowAll,
  actions,
  onHome,
  onAdd,
  showAllLabel,
  homeLabel = 'Home',
  addLabel = 'New tab',
  'aria-label': ariaLabel = 'Open tabs',
  className,
}: NavTabBarProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const listRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const activeIndex = tabs.findIndex(t => t.id === activeId);

  // Crowded bar (Figma Tab Bar "Active Tab=Crowded" and the Compact tab states): tabs hug their labels and shrink when they don't all fit, the longer names giving way
  // first. Each tab keeps at least 3 letters of its name (or the whole name if it's shorter), set as its min-width;
  // once even those minimums don't fit, the tabs show only their icons. Worked out from each name's full width in
  // the tab font and the room the bar gives the tab list (not from the drawn labels), so hiding names can't flip it
  // back and forth. While there's room, every tab hugs its full label.
  type Fit = { compact: boolean; minWidths: Record<string, number> };
  const [fit, setFit] = useState<Fit>({ compact: false, minWidths: {} });
  const compact = fit.compact;
  const measurer = useRef<CanvasRenderingContext2D | null>(null);
  useLayoutEffect(() => {
    const bar = barRef.current;
    const list = listRef.current;
    if (!bar || !list) return;
    const measure = () => {
      const style = getComputedStyle(bar);
      let room = bar.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      for (const child of Array.from(bar.children)) if (child !== list) room -= (child as HTMLElement).offsetWidth;
      const ctx = (measurer.current ??= document.createElement('canvas').getContext('2d'));
      if (!ctx || !tabs.length) return setFit({ compact: false, minWidths: {} });
      const font = getComputedStyle(list);
      const minWidths: Record<string, number> = {};
      let needed = 0;
      for (const t of tabs) {
        // the active tab's name is semi-bold (600), the others medium (500)
        ctx.font = `${t.id === activeId ? 600 : 500} ${font.fontSize} ${font.fontFamily}`;
        const name = ctx.measureText(t.label).width;
        const fixed = t.icon ? NAMED_TAB_FIXED_PX : NAMED_TAB_FIXED_PX - 24; // no icon: no 16px icon and 8px gap
        minWidths[t.id] = Math.ceil(fixed + Math.min(name, NAME_MIN_PX));
        needed += minWidths[t.id];
      }
      setFit({ compact: needed > room, minWidths });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    // Names are measured in the tab font: measure again once it has loaded
    document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [tabs, activeId]);

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
      // A crowded list scrolls sideways: keep the active tab in view (without scrolling the page)
      if (tab && list.scrollWidth > list.clientWidth) {
        if (tab.offsetLeft < list.scrollLeft) list.scrollLeft = tab.offsetLeft;
        else if (tab.offsetLeft + tab.offsetWidth > list.scrollLeft + list.clientWidth)
          list.scrollLeft = tab.offsetLeft + tab.offsetWidth - list.clientWidth;
      }
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
  // A tab that has just opened gets its underline rising up slowly from the bar's bottom edge instead (described on the Figma Tab Bar; motion isn't drawable there).
  // Open tab ids, each with whether it was a blank tab
  const seen = useRef<Map<string, boolean> | null>(null);
  useLayoutEffect(() => {
    const el = indicatorRef.current;
    const from = previous.current;
    previous.current = indicator;
    if (!el || !indicator) return;
    // The tabs that were open the last time the underline sat on a tab. (While a new tab opens the underline is
    // briefly unset; recording the tabs then would already count the new one as open.) Only the tabs open right
    // now count, so a tab that was closed and opened again rises too.
    const known = seen.current;
    seen.current = new Map(tabs.map(t => [t.id, !!t.blank]));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // A new tab: one that wasn't open before, and either the bar now holds more tabs, or it took the place of a blank
    // tab (a blank tab being filled with a page). A tab that takes the place of an ordinary one (a record's previous /
    // next arrows) isn't new. `known` is null on the first render, so the tabs open from the start don't animate.
    const ids = new Set(tabs.map(t => t.id));
    const filledBlank = !!known && [...known].some(([id, blank]) => blank && !ids.has(id));
    const added = !!known && tabs.length > known.size;
    // The rise, at the tab's current position; `progress` (ms) resumes one already under way
    const rise = (progress = 0) => {
      const x = `translateX(${indicator.left}px)`;
      const animation = el.animate(
        [
          { transform: `${x} translateY(100%) scaleY(0)`, opacity: 0 },
          { transform: `${x} translateY(0) scaleY(1)`, opacity: 1 },
        ],
        { duration: RISE_MS, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
      );
      animation.id = RISE_ID;
      animation.currentTime = progress;
    };
    if (known && !known.has(indicator.id) && (added || filledBlank) && from?.id !== indicator.id) {
      el.getAnimations().forEach(a => a.cancel());
      if (!reduced) rise();
      return;
    }
    if (!from || from.left === indicator.left) return;
    // Opening a tab shrinks the tabs before it (their widths follow the tab count), so the new tab moves while its
    // underline is still rising: keep rising from where it is, at the tab's new position, instead of sliding over.
    const rising = from.id === indicator.id ? el.getAnimations().find(a => a.id === RISE_ID && a.playState === 'running') : undefined;
    if (rising) {
      const progress = Number(rising.currentTime ?? 0);
      rising.cancel();
      rise(progress);
      return;
    }
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
    const list = listRef.current;
    // In list coordinates: a crowded list may be scrolled sideways
    const listLeft = (list?.getBoundingClientRect().left ?? 0) - (list?.scrollLeft ?? 0);
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
    // In list coordinates (offsetLeft), which include any sideways scroll of a crowded list
    const pointer = d.lastX - list.getBoundingClientRect().left + list.scrollLeft;
    const left = Math.max(0, Math.min(list.scrollWidth - el.offsetWidth, pointer - d.grab));
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
    <div ref={barRef} className={[styles.bar, className].filter(Boolean).join(' ')}>
      {onHome && <NavTabSmall icon="home" label={homeLabel} onClick={onHome} />}
      <div
        ref={listRef}
        role="tablist"
        aria-label={ariaLabel}
        className={styles.list}
        onKeyDown={onKeyDown}
      >
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
            compact={compact}
            minWidth={compact ? undefined : fit.minWidths[t.id]}
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
      {(actions || onShowAll) && (
        <div className={styles.end}>
          {actions}
          {onShowAll && (
            <NavTabSmall
              icon="dashboard"
              label={showAllLabel ?? `All tabs (${tabs.length})`}
              aria-haspopup="dialog"
              onClick={onShowAll}
            />
          )}
        </div>
      )}
    </div>
  );
}
