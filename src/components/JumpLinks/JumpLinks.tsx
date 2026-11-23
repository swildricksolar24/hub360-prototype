import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type Ref } from 'react';
import { ContextMenu } from '../ContextMenu/ContextMenu';
import { Icon } from '../Icon/Icon';
import styles from './JumpLinks.module.css';

export type JumpLink = { id: string; label: string };

export type JumpLinksProps = {
  /** The links, in order; `id` is what `value` / `onChange` use (e.g. a card's id on the page). */
  items: JumpLink[];
  /** The picked link (controlled). */
  value?: string;
  /** The link picked first when uncontrolled; defaults to the first one. */
  defaultValue?: string;
  /** Called with the link's id when it's clicked. The page does what the link means (e.g. scroll to that card). */
  onChange?: (id: string) => void;
  'aria-label'?: string;
  /**
   * links (default) = links to the sections of a page (`#id` anchors, the Tier 3 row) ·
   * tabs = the same look as a tab list that switches a view (e.g. Stock's By Warehouse | By Item): tab buttons with
   * `aria-selected`, ← / → / Home / End move between them and pick, and no card-bottom padding or background, so the
   * row sits inside any card. Figma draws both with Jump Link instances.
   */
  as?: 'links' | 'tabs';
  /** Tabs mode: the id of the panel the tabs switch (each tab's `aria-controls`). */
  panelId?: string;
  className?: string;
};

/** Extra room needed before a link comes back out of "More", so the row doesn't flicker at the boundary. */
const HYSTERESIS = 16;

/**
 * Jump Links (Figma Base "Jump Links" 3584:2032 and "Jump Link" 3582:11: the row at the bottom of the Tier 3 card): a
 * row of links to the sections of a long page. The picked link is bold, with a 2px Brand Teal underline that slides to
 * it (left and width, 250ms ease-out; no slide with reduced motion). Pass it to NavTier3 `jumpLinks`, which puts it at
 * the bottom of the card and in the Sticky bar. Each link is a real `#id` link; a plain click calls `onChange` instead
 * of following it, and the page scrolls to that section.
 *
 * Not in Figma: the row is always one line. When the links don't all fit, the ones that don't move into a "More ▾" menu
 * at the end of the row (a ContextMenu, like NavTier3's More for its sections). The picked link always stays in the
 * row: if it would be hidden, it takes the last place before More.
 */
export function JumpLinks({
  items,
  value,
  defaultValue,
  onChange,
  'aria-label': ariaLabel = 'Jump to',
  as = 'links',
  panelId,
  className,
}: JumpLinksProps) {
  const [own, setOwn] = useState(defaultValue ?? items[0]?.id);
  const current = value ?? own;
  const nav = useRef<HTMLElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const links = useRef(new Map<string, HTMLElement>());
  const tabs = as === 'tabs';
  const [bar, setBar] = useState<CSSProperties | null>(null);
  // No slide on the first placement: the line just appears under the current link
  const [ready, setReady] = useState(false);
  // How many links fit before More (Infinity = all of them, no More)
  const [fit, setFit] = useState(Infinity);
  const fitRef = useRef(Infinity);
  const [menuOpen, setMenuOpen] = useState(false);
  const moreRef = useRef<HTMLSpanElement>(null);

  const pick = (id: string) => {
    setOwn(id);
    onChange?.(id);
  };

  // The links in the row: the first `fit` of them, with the picked one swapped in for the last if it would be hidden
  const ids = items.map(i => i.id);
  let shown = ids;
  if (fit < ids.length) {
    shown = ids.slice(0, fit);
    if (current && ids.includes(current) && !shown.includes(current)) shown = fit > 0 ? [...shown.slice(0, fit - 1), current] : [current];
  }
  const overflow = items.filter(i => !shown.includes(i.id));

  /*
   * Fit: hidden one-line copies of every link and of "More" give their widths, which are compared with the row's
   * content width. Coming back to a roomier row needs HYSTERESIS more room.
   */
  const measure = useCallback(() => {
    const row = nav.current;
    const ghost = measureRef.current;
    if (!row || !ghost) return;
    const style = getComputedStyle(row);
    const room = row.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const gap = parseFloat(style.columnGap) || 0;
    const widths = [...ghost.querySelectorAll<HTMLElement>('[data-link]')].map(el => el.getBoundingClientRect().width);
    const moreWidth = ghost.querySelector<HTMLElement>('[data-more]')?.getBoundingClientRect().width ?? 0;
    const total = (n: number, more: boolean) =>
      widths.slice(0, n).reduce((a, b) => a + b, 0) + gap * Math.max(0, n - 1) + (more ? (n > 0 ? gap : 0) + moreWidth : 0);
    let next = Infinity;
    if (total(widths.length, false) + (fitRef.current < widths.length ? HYSTERESIS : 0) > room) {
      next = 0;
      for (let n = widths.length - 1; n >= 1; n--) {
        if (total(n, true) + (n > fitRef.current ? HYSTERESIS : 0) <= room) {
          next = n;
          break;
        }
      }
      // At least one link always shows (the picked one), with More beside it
      next = Math.max(1, next);
    }
    fitRef.current = next;
    setFit(next);
  }, []);

  useLayoutEffect(() => {
    measure();
    const observer = new ResizeObserver(() => measure());
    if (nav.current) observer.observe(nav.current);
    if (measureRef.current) observer.observe(measureRef.current);
    return () => observer.disconnect();
  }, [measure, items, current]);

  // Place the underline under the current link: its left and width
  useLayoutEffect(() => {
    const place = () => {
      const link = current ? links.current.get(current) : undefined;
      if (!link) return setBar(null);
      setBar({
        width: link.offsetWidth,
        transform: `translate(${link.offsetLeft}px, ${link.offsetTop + link.offsetHeight}px)`,
      });
    };
    place();
    const id = window.requestAnimationFrame(() => setReady(true));
    const observer = new ResizeObserver(place);
    if (nav.current) observer.observe(nav.current);
    return () => {
      window.cancelAnimationFrame(id);
      observer.disconnect();
    };
  }, [current, items, fit]);

  // More's menu closes on a click outside it
  useEffect(() => {
    if (!menuOpen) return;
    const away = (e: PointerEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [menuOpen]);
  useEffect(() => {
    if (!overflow.length) setMenuOpen(false);
  }, [overflow.length]);

  const closeMenu = () => {
    setMenuOpen(false);
    moreRef.current?.querySelector('button')?.focus();
  };

  const register = (id: string) => (el: HTMLElement | null) => {
    if (el) links.current.set(id, el);
    else links.current.delete(id);
  };
  const shownItems = items.filter(i => shown.includes(i.id));

  // Tabs: ← / → move to the previous / next tab and pick it (Home / End: the first / last); the tabs in the row only
  const onTabKey = (e: KeyboardEvent, id: string) => {
    const at = shownItems.findIndex(i => i.id === id);
    const to =
      e.key === 'ArrowRight' ? (at + 1) % shownItems.length
      : e.key === 'ArrowLeft' ? (at - 1 + shownItems.length) % shownItems.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? shownItems.length - 1
      : -1;
    if (to < 0) return;
    e.preventDefault();
    const next = shownItems[to].id;
    pick(next);
    links.current.get(next)?.focus();
  };

  const Root = tabs ? 'div' : 'nav';
  return (
    <Root
      ref={nav as Ref<HTMLDivElement>}
      className={[styles.links, className].filter(Boolean).join(' ')}
      data-as={tabs ? 'tabs' : undefined}
      aria-label={tabs ? undefined : ariaLabel}
    >
      {tabs ? (
        // display: contents, so the tabs and More sit in one flex row; More is outside the tablist (it isn't a tab)
        <span role="tablist" aria-label={ariaLabel} className={styles.tabList}>
          {shownItems.map(({ id, label }) => (
            <button
              key={id}
              ref={register(id)}
              type="button"
              role="tab"
              id={`${panelId ?? 'jump-tabs'}-${id}`}
              aria-selected={current === id}
              aria-controls={panelId}
              tabIndex={current === id ? 0 : -1}
              className={[styles.link, styles.tab].join(' ')}
              onClick={() => pick(id)}
              onKeyDown={e => onTabKey(e, id)}
            >
              {label}
            </button>
          ))}
        </span>
      ) : (
        shownItems.map(({ id, label }) => (
          <a
            key={id}
            ref={register(id)}
            href={`#${id}`}
            className={styles.link}
            aria-current={current === id ? 'true' : undefined}
            onClick={e => {
              // Ctrl / Cmd / Shift clicks keep the browser's own behaviour
              if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              e.preventDefault();
              pick(id);
            }}
          >
            {label}
          </a>
        ))
      )}
      {overflow.length > 0 && (
        <span ref={moreRef} className={styles.more}>
          <button
            type="button"
            className={[styles.link, styles.moreButton].join(' ')}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}
          >
            More
            <Icon name="chevron-down" size={16} color="currentColor" className={styles.moreChevron} />
          </button>
          {menuOpen && (
            <div className={styles.morePopup}>
              <ContextMenu
                aria-label="More sections"
                autoFocus
                items={overflow.map(item => ({ label: item.label, onSelect: () => pick(item.id) }))}
                onClose={closeMenu}
              />
            </div>
          )}
        </span>
      )}
      {bar && <span className={styles.bar} style={bar} data-ready={ready || undefined} aria-hidden />}
      {/* Hidden one-line copies that measure() reads: every link at its full width, and More */}
      <span ref={measureRef} className={styles.measure} aria-hidden="true">
        {items.map(({ id, label }) => (
          // The picked link is bold, so its copy is too
          <span key={id} className={styles.link} data-link="" aria-current={current === id ? 'true' : undefined}>
            {label}
          </span>
        ))}
        <span className={[styles.link, styles.moreButton].join(' ')} data-more="">
          More
          <Icon name="chevron-down" size={16} color="currentColor" />
        </span>
      </span>
    </Root>
  );
}
