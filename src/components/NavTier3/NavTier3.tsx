import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Breadcrumb, type BreadcrumbItem } from '../Breadcrumb/Breadcrumb';
import { Button, type ButtonProps } from '../Button/Button';
import { ContextMenu } from '../ContextMenu/ContextMenu';
import { Icon } from '../Icon/Icon';
import { IconButton } from '../IconButton/IconButton';
import { SubMenu, type SubMenuItem } from '../SubMenu/SubMenu';
import styles from './NavTier3.module.css';

/* ---------- Tier 3 Label / Labels ---------- */

export type NavTier3LabelProps = {
  /** Figma `Label` text property (shown with a trailing colon). */
  label: string;
  /** Figma `Value` text property (bold). */
  value: ReactNode;
};

/** Figma "Tier 3 Label" (2642:3631): "Label: **Value**". */
export function NavTier3Label({ label, value }: NavTier3LabelProps) {
  return (
    <span className={styles.labelItem}>
      <span>{label}:</span>
      <strong className={styles.labelValue}>{value}</strong>
    </span>
  );
}

export type NavTier3LabelsProps = { items: NavTier3LabelProps[]; className?: string };

/** Figma "Tier 3 Labels" (2642:3610): label/value pairs separated by "|" (`Labels` 1–4). */
export function NavTier3Labels({ items, className }: NavTier3LabelsProps) {
  return (
    <p className={[styles.labels, className].filter(Boolean).join(' ')} data-many={items.length >= 4 || undefined}>
      {items.map((item, i) => (
        <Fragment key={`${item.label}-${i}`}>
          {i > 0 && (
            <span className={styles.labelSeparator} aria-hidden="true">
              |
            </span>
          )}
          <NavTier3Label {...item} />
        </Fragment>
      ))}
    </p>
  );
}

/* ---------- Tier 3 Icon ---------- */

export type NavTier3IconProps = {
  /** Icon name from the Icon component (Figma: warehouse). */
  icon: string;
  /** Figma `Size`: large = 98px circle (Expanded) · small = 62px circle (Collapsed). */
  size?: 'large' | 'small';
  /** Shows the "View Photo" button on hover and focus (Figma `State=Hover`). */
  onViewPhoto?: () => void;
  viewPhotoLabel?: string;
  className?: string;
};

/** Figma "Tier 3 Icon" (2648:4086): the record's icon in a circle, with an optional "View Photo" action. */
export function NavTier3Icon({ icon, size = 'large', onViewPhoto, viewPhotoLabel = 'View Photo', className }: NavTier3IconProps) {
  return (
    <span className={[styles.recordIcon, className].filter(Boolean).join(' ')} data-size={size}>
      <Icon name={icon} size={size === 'large' ? 65 : 41} color="currentColor" />
      {onViewPhoto && (
        <Button className={styles.viewPhoto} size="tiny" variant="brand" onClick={onViewPhoto}>
          {viewPhotoLabel}
        </Button>
      )}
    </span>
  );
}

/* ---------- More / section picker (compact collapsed header) ---------- */

/** A menu button in the Sub Menu Tiny style: Button Tiny / Primary with a trailing chevron ("More ▾", "History ▾"). */
function MenuButton(props: Omit<ButtonProps, 'size' | 'variant' | 'icon' | 'iconPosition'>) {
  return <Button size="tiny" variant="primary" icon="chevron-down" iconPosition="right" {...props} />;
}

/**
 * A MenuButton opening a ContextMenu of sections. "More" lists the sections that don't fit in the row; the section
 * picker (the narrowest step) shows the current section's name and lists every section, the current one checked.
 * Escape, Tab or choosing a section closes it and puts focus back on the button; a click outside closes it too.
 */
function SectionMenu({
  label,
  menuLabel,
  items,
  value,
  onChange,
}: {
  label: ReactNode;
  menuLabel: string;
  items: SubMenuItem[];
  value?: string;
  onChange?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);
  const close = () => {
    setOpen(false);
    ref.current?.querySelector('button')?.focus();
  };
  return (
    <span ref={ref} className={styles.more}>
      <MenuButton aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        {label}
      </MenuButton>
      {open && (
        <div className={styles.morePopup}>
          <ContextMenu
            aria-label={menuLabel}
            autoFocus
            items={items.map(item => ({
              label: item.label,
              icon: value !== undefined && item.id === value ? 'check' : undefined,
              disabled: item.disabled,
              onSelect: () => onChange?.(item.id),
            }))}
            onClose={close}
          />
        </div>
      )}
    </span>
  );
}

/* ---------- Tier 3 ---------- */

/** Expand / collapse animation: the section buttons fade over FADE_MS, the card resizes over RESIZE_MS. */
const FADE_MS = 150;
const RESIZE_MS = 320;

/**
 * Collapsed layout (not in Figma): title · section buttons · actions, kept inside the card at every width.
 * h2 / h3 / h4 = Sub Menu Default (Button Small) with the title in Heading 2, 3 or 4 Bold, the largest that fits ·
 * compact = Sub Menu Tiny (Button Tiny) for the section buttons only (the actions keep their look), the Heading 4 title
 * cut with an ellipsis down to 48px, and the sections that don't fit in a "More" menu · icon = the same with the
 * title text hidden (screen readers still read it) · picker = one "Current section ▾" menu instead of the row ·
 * wrap = the only step that leaves one row: the actions move to a second line, right-aligned.
 */
type CollapsedFit = 'h2' | 'h3' | 'h4' | 'compact' | 'icon' | 'picker' | 'wrap';
const FIT_ORDER: CollapsedFit[] = ['h2', 'h3', 'h4', 'compact', 'icon', 'picker', 'wrap'];
const TITLE_STEPS = ['h2', 'h3', 'h4'] as const;
/** Extra room needed before moving back to a roomier layout, so it doesn't flicker at the boundary. */
const FIT_HYSTERESIS = 16;

export type NavTier3Props = {
  /** Record name (Figma: "WAREHOUSE", Heading 2 / Bold). */
  title: ReactNode;
  /** Record icon (Tier 3 Icon). */
  icon: string;
  onViewPhoto?: () => void;
  /** Figma `State=Collapsed`: one row with the small icon, title, sub menu and actions. */
  collapsed?: boolean;
  /** Shows the expand / collapse button (double chevron) at the end of the actions. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Breadcrumb trail (Expanded only). */
  breadcrumb?: BreadcrumbItem[];
  homeHref?: string;
  /** Shows the back button before the breadcrumb (Expanded only). */
  onBack?: () => void;
  /** Element after the title, e.g. a Tag (Figma: Tag "Tiny / Icon Left"). Expanded only. */
  tag?: ReactNode;
  /** Label/value pairs under the title (Tier 3 Labels). Expanded only. */
  labels?: NavTier3LabelProps[];
  /** Controls at the top right: Figma shows a Toggle Button, an "Actions" dropdown, a brand Save button and previous / next Icon buttons. */
  actions?: ReactNode;
  /** Text under the actions, e.g. "Last Modified: May 18, 2026". Shown in both states (Figma: Expanded only). */
  meta?: ReactNode;
  /** Section buttons (Sub Menu, Default). */
  items?: SubMenuItem[];
  value?: string;
  onChange?: (id: string) => void;
  className?: string;
};

/** Figma Main Nav "Tier 3" (2644:3738): the record header card above a detail page. */
export function NavTier3({
  title,
  icon,
  onViewPhoto,
  collapsed = false,
  onCollapsedChange,
  breadcrumb,
  homeHref,
  onBack,
  tag,
  labels,
  actions,
  meta,
  items,
  value,
  onChange,
  className,
}: NavTier3Props) {
  /*
   * Not in Figma: switching states animates. The parts that change layout (the icon and title block, the back
   * button and breadcrumb, and the section buttons) fade out, the card resizes to the new state's height, and they
   * fade back in at their new place. The actions and "Last Modified" stay put. Skipped under prefers-reduced-motion.
   */
  const fading = (root: HTMLElement) =>
    [...root.querySelectorAll<HTMLElement>(`.${styles.identity}, .${styles.trail}, .${styles.subMenu}`)];
  const rootRef = useRef<HTMLElement>(null);
  const fromHeight = useRef<number | null>(null);
  const switching = useRef(false);
  const fadeOuts = useRef<Animation[]>([]);
  // The toggle moves to a new place in the layout, so keyboard focus is put back on it after the switch
  const refocus = useRef(false);

  /*
   * Collapsed fit: hidden copies of the title (Heading 2, 3 and 4) and of the section row (Small and Tiny) give their
   * one-line widths, which are compared with the card's width minus the icon and the actions. The title size goes on
   * the card as data-fit (CSS, same frame as the measurement); compact is also React state, because the section
   * buttons change size with it.
   */
  const measureRef = useRef<HTMLDivElement>(null);
  const fit = useRef<CollapsedFit>('h2');
  const [compact, setCompact] = useState(false);
  // The actions' width outside compact. Going back to a normal row is judged against it, so a page whose actions do
  // change width in compact can't make the normal row look like it fits, and flicker.
  const normalEndWidth = useRef(0);
  // Sections moved into the "More" menu (compact only), and how many stayed in the row last time (for hysteresis)
  const [hidden, setHidden] = useState<string[]>([]);
  // The narrowest steps show a single section picker instead of the row
  const [picker, setPicker] = useState(false);
  const shownCount = useRef(Infinity);
  const itemsRef = useRef<SubMenuItem[]>([]);
  itemsRef.current = items ?? [];
  const valueRef = useRef(value);
  valueRef.current = value;
  const applyFit = useCallback(() => {
    const root = rootRef.current;
    const ghost = measureRef.current;
    if (!root || !ghost || !collapsed) return;
    const identity = root.querySelector<HTMLElement>(`:scope > .${styles.identity}`);
    const end = root.querySelector<HTMLElement>(`:scope > .${styles.end}`);
    const style = getComputedStyle(root);
    const gap = parseFloat(style.columnGap) || 0;
    const iconBlock =
      (identity?.firstElementChild?.getBoundingClientRect().width ?? 0) +
      (identity ? parseFloat(getComputedStyle(identity).columnGap) || 0 : 0);
    // Collapsed lays the end block out with display: contents, so its column is the wider of the actions and the meta
    const endWidth = Math.max(0, ...[...(end?.children ?? [])].map(el => el.getBoundingClientRect().width));
    const isCompact = root.hasAttribute('data-compact');
    if (!isCompact) normalEndWidth.current = endWidth;
    const room = (actionsWidth: number) =>
      root.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - actionsWidth - 2 * gap;
    const width = (selector: string) => ghost.querySelector(`:scope > ${selector}`)?.getBoundingClientRect().width ?? 0;
    const smallRow = width("nav[data-variant='default']");
    // Moving back to a roomier step than the current one needs FIT_HYSTERESIS more room
    const slack = (step: CollapsedFit) => (FIT_ORDER.indexOf(step) < FIT_ORDER.indexOf(fit.current) ? FIT_HYSTERESIS : 0);
    let next: CollapsedFit | undefined;
    for (const step of TITLE_STEPS) {
      if (iconBlock + width(`[data-heading='${step}']`) + smallRow + slack(step) <= room(normalEndWidth.current)) {
        next = step;
        break;
      }
    }

    const ids = itemsRef.current.map(item => item.id);
    let shown = ids;
    let titleRoom: number | undefined;
    if (!next) {
      /*
       * Compact steps, each tried in turn:
       * compact: the Tiny row beside a Heading 4 title that takes what is left. If the whole row doesn't fit even with
       *   the title at its 48px minimum, the row keeps as many buttons as fit and ends with "More", which lists the
       *   rest. The current section always stays in the row, in place of the last button if it would have been hidden.
       * icon: the same, with the title text hidden (still read by screen readers) so the row has the icon's room too.
       * picker: one "Current section ▾" button instead of the row, listing every section.
       * wrap: still too narrow, so the actions (which never change size) move to a second line, right-aligned.
       * Every step keeps all of the card's content inside its padding box: nothing overflows or is clipped.
       */
      const tiny = ghost.querySelector(":scope > nav[data-variant='tiny']");
      const tinyButtons = [...(tiny?.querySelectorAll('li') ?? [])].map(li => li.getBoundingClientRect().width);
      const buttonWidth = new Map(ids.map((id, i) => [id, tinyButtons[i] ?? 0]));
      const list = tiny?.querySelector('ul');
      const rowGap = list ? parseFloat(getComputedStyle(list).columnGap) || 0 : 0;
      const moreWidth = width('[data-more]');
      const rowWidth = (row: string[], more: boolean) =>
        row.reduce((sum, id) => sum + (buttonWidth.get(id) ?? 0), 0) +
        rowGap * Math.max(0, row.length - 1) +
        (more ? (row.length > 0 ? rowGap : 0) + moreWidth : 0);
      const titleMin = parseFloat(style.getPropertyValue('--space-48')) || 0;
      const iconOnly = identity?.firstElementChild?.getBoundingClientRect().width ?? 0;
      const current = valueRef.current && ids.includes(valueRef.current) ? valueRef.current : undefined;
      // The widest row (all buttons, or some + More) that fits in `space`, or null if not even one button + More does
      const arrange = (space: number): string[] | null => {
        if (rowWidth(ids, false) + (shownCount.current < ids.length ? FIT_HYSTERESIS : 0) <= space) return ids;
        for (let n = ids.length - 1; n >= 1; n--) {
          let row = ids.slice(0, n);
          if (current && !row.includes(current)) row = [...ids.slice(0, n - 1), current];
          if (rowWidth(row, true) + (row.length > shownCount.current ? FIT_HYSTERESIS : 0) <= space) return row;
        }
        return null;
      };
      const withTitle = arrange(room(endWidth) - iconBlock - titleMin - slack('compact'));
      const withoutTitle = withTitle ? null : arrange(room(endWidth) - iconOnly - slack('icon'));
      if (withTitle) {
        next = 'compact';
        shown = withTitle;
        // Rounded down with 1px to spare: widths are fractional, and a row a fraction too wide would overflow
        titleRoom = Math.floor(room(endWidth) - iconBlock - rowWidth(shown, shown.length < ids.length)) - 1;
      } else if (withoutTitle) {
        next = 'icon';
        shown = withoutTitle;
      } else {
        next = width('[data-picker]') + slack('picker') <= room(endWidth) - iconOnly ? 'picker' : 'wrap';
      }
    }
    fit.current = next;
    root.dataset.fit = next;
    if (titleRoom === undefined) root.style.removeProperty('--title-room');
    else root.style.setProperty('--title-room', `${Math.max(0, titleRoom)}px`);

    const usePicker = next === 'picker' || next === 'wrap';
    shownCount.current = usePicker ? Infinity : shown.length;
    const nextHidden = usePicker ? [] : ids.filter(id => !shown.includes(id));
    setHidden(prev => (prev.join('\n') === nextHidden.join('\n') ? prev : nextHidden));
    setPicker(usePicker);
    setCompact(!(TITLE_STEPS as readonly string[]).includes(next));
  }, [collapsed]);

  // Declared before the animation effect, so the card has its final collapsed layout when that effect measures it
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!collapsed || !root) {
      if (root) {
        delete root.dataset.fit;
        root.style.removeProperty('--title-room');
      }
      setCompact(false);
      setPicker(false);
      setHidden(prev => (prev.length ? [] : prev));
      shownCount.current = Infinity;
      return;
    }
    applyFit();
    // The steps come from the hidden copies and the normal actions width, not from the boxes they resize, so the
    // re-check after a change (e.g. the actions getting narrower in compact) settles instead of looping
    const observer = new ResizeObserver(() => applyFit());
    observer.observe(root);
    for (const el of [
      root.querySelector(`:scope > .${styles.identity}`),
      root.querySelector(`:scope > .${styles.end}`),
      ...(measureRef.current?.children ?? []),
    ]) {
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [collapsed, applyFit, items]);

  // After going compact (or back) the actions have re-rendered at their new size, and a new current section may have
  // to come out of "More": measure again before paint
  useLayoutEffect(() => {
    if (collapsed) applyFit();
  }, [compact, value]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle() {
    if (!onCollapsedChange || switching.current) return;
    const root = rootRef.current;
    if (!root || matchMedia('(prefers-reduced-motion: reduce)').matches) return onCollapsedChange(!collapsed);
    switching.current = true;
    fromHeight.current = root.offsetHeight;
    refocus.current = !!document.activeElement?.closest('[data-tier3-toggle]');
    let done = false;
    const next = () => {
      if (done) return;
      done = true;
      onCollapsedChange(!collapsed);
    };
    const fades = fading(root).map(el =>
      el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, easing: 'ease-out', fill: 'forwards' }),
    );
    fadeOuts.current = fades;
    if (fades.length === 0) return next();
    fades[0].onfinish = next;
    // Backs up the finish event, which a hidden or throttled page may not deliver
    window.setTimeout(next, FADE_MS + 50);
  }

  useLayoutEffect(() => {
    const root = rootRef.current;
    const from = fromHeight.current;
    fromHeight.current = null;
    if (!root || from === null) return;
    if (refocus.current) root.querySelector<HTMLElement>('[data-tier3-toggle]')?.focus();
    refocus.current = false;
    const to = root.offsetHeight;
    root.style.overflow = 'hidden';
    const resize = root.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: RESIZE_MS, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
    // React reuses elements across the two layouts (the collapsed title block can become the expanded top row), so
    // every fade-out is dropped, wherever its element ended up, before the new parts fade in
    fadeOuts.current.forEach(a => a.cancel());
    fadeOuts.current = [];
    for (const el of fading(root)) {
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS, delay: RESIZE_MS - FADE_MS, easing: 'ease-in', fill: 'backwards' });
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      root.style.overflow = '';
      switching.current = false;
    };
    resize.onfinish = resize.oncancel = finish;
    window.setTimeout(finish, RESIZE_MS + 50);
  }, [collapsed]);

  const actionRow = (
    <div className={styles.actions}>
      {actions}
      {onCollapsedChange && (
        <IconButton
          size="compact"
          /* Figma: Expanded shows Double Down, Collapsed shows Double Up */
          icon={collapsed ? 'chevron-double-up' : 'chevron-double-down'}
          label={collapsed ? 'Expand header' : 'Collapse header'}
          aria-expanded={!collapsed}
          data-tier3-toggle=""
          onClick={toggle}
        />
      )}
    </div>
  );
  const hasItems = !!items && items.length > 0;
  const currentLabel = items?.find(item => item.id === value)?.label ?? 'Sections';
  const usePicker = collapsed && compact && picker;
  const overflow = collapsed && compact && !picker ? (items ?? []).filter(item => hidden.includes(item.id)) : [];
  const subMenu = hasItems && (
    <SubMenu
      items={usePicker ? [] : overflow.length ? items.filter(item => !hidden.includes(item.id)) : items}
      value={value}
      onChange={onChange}
      variant={collapsed && compact ? 'tiny' : 'default'}
      aria-label="Record sections"
      trailing={
        usePicker ? (
          <SectionMenu label={currentLabel} menuLabel="Sections" items={items} value={value} onChange={onChange} />
        ) : (
          overflow.length > 0 && <SectionMenu label="More" menuLabel="More sections" items={overflow} onChange={onChange} />
        )
      }
      className={styles.subMenu}
    />
  );

  if (collapsed) {
    return (
      <section
        ref={rootRef}
        className={[styles.tier3, className].filter(Boolean).join(' ')}
        data-collapsed=""
        data-compact={compact || undefined}
      >
        {/* The tooltip shows the title when it is cut short or hidden (the narrowest steps) */}
        <div className={styles.identity} title={typeof title === 'string' ? title : undefined}>
          <NavTier3Icon icon={icon} size="small" onViewPhoto={onViewPhoto} />
          <h1 className={[styles.title, styles.titleCollapsed].join(' ')}>{title}</h1>
        </div>
        {subMenu}
        {/* Hidden one-line copies that applyFit measures: the title at each step, the section row at both sizes, More
            and the section picker */}
        <div ref={measureRef} className={styles.measure} aria-hidden="true">
          {TITLE_STEPS.map(step => (
            <span key={step} className={styles.measureTitle} data-heading={step}>
              {title}
            </span>
          ))}
          {hasItems && <SubMenu items={items} value={value} variant="default" aria-label="Measure" />}
          {hasItems && <SubMenu items={items} value={value} variant="tiny" aria-label="Measure" />}
          {hasItems && (
            <MenuButton data-more="" tabIndex={-1}>
              More
            </MenuButton>
          )}
          {hasItems && (
            <MenuButton data-picker="" tabIndex={-1}>
              {currentLabel}
            </MenuButton>
          )}
        </div>
        {/* Same top-right block as Expanded, so the actions and "Last Modified" don't move between states */}
        <div className={styles.end}>
          {actionRow}
          {meta && <p className={styles.meta}>{meta}</p>}
        </div>
      </section>
    );
  }

  return (
    <section ref={rootRef} className={[styles.tier3, className].filter(Boolean).join(' ')}>
      <div className={styles.top}>
        <div className={styles.trail}>
          {onBack && <IconButton size="compact" icon="arrow-left" label="Back" onClick={onBack} />}
          {breadcrumb && <Breadcrumb items={breadcrumb} homeHref={homeHref} />}
        </div>
        <div className={styles.end}>
          {actionRow}
          {meta && <p className={styles.meta}>{meta}</p>}
        </div>
      </div>
      <div className={styles.identity} data-expanded="">
        <NavTier3Icon icon={icon} size="large" onViewPhoto={onViewPhoto} />
        <div className={styles.heading}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{title}</h1>
            {tag}
          </div>
          {labels && labels.length > 0 && <NavTier3Labels items={labels} />}
        </div>
      </div>
      {subMenu}
    </section>
  );
}
