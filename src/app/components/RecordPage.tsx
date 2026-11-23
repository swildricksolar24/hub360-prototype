import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { useHref, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button/Button';
import { Dropdown, type DropdownProps } from '../../components/Dropdown/Dropdown';
import { Icon } from '../../components/Icon/Icon';
import { IconButton } from '../../components/IconButton/IconButton';
import { JumpLinks, type JumpLink } from '../../components/JumpLinks/JumpLinks';
import { NavTier3, type NavTier3LabelProps } from '../../components/NavTier3/NavTier3';
import { Toggle } from '../../components/Toggle/Toggle';
import styles from './RecordPage.module.css';

type DropdownOption = DropdownProps['options'][number];

export type RecordSection = {
  id: string;
  label: string;
  /** The section's content; without it the page shows a "not built yet" placeholder. */
  content?: ReactNode;
};

export type RecordActionsProps = {
  /** "Actions" dropdown options; an empty list hides the dropdown. */
  options?: DropdownOption[];
  /** Called with the chosen "Actions" option's value. */
  onAction?: (value: string) => void;
  /** Hides the "Active" toggle. */
  hideActive?: boolean;
  /** Controls the "Active" toggle (otherwise it starts on and works by itself). */
  active?: boolean;
  onActiveChange?: (active: boolean) => void;
  onSave?: () => void;
  /** The brand button's label (default "Save"), e.g. "Edit" on a record shown read-only until edited. */
  saveLabel?: string;
  /** Shows an outline Cancel button before Save, e.g. while a record is being edited. */
  onCancel?: () => void;
  /** Turns the Save button off (Figma: Edit while a record is already being edited). */
  saveDisabled?: boolean;
  /** Hides the Save button. */
  hideSave?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  /** Hides the previous / next record arrows. */
  hideArrows?: boolean;
};

/**
 * The size RecordActions draws at. RecordPage sets "tiny" in the header's Collapsed and Sticky states (Figma Tier 3 uses
 * Toggle Button Tiny, Drop Down Button Tiny, Button Tiny and Button Icon Tiny there, all 32px); Expanded is "default".
 */
const ActionsSize = createContext<'default' | 'tiny'>('default');

const DEFAULT_OPTIONS: DropdownOption[] = [
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'export', label: 'Export' },
  { value: 'archive', label: 'Archive' },
];

/**
 * The Tier 3 header's controls as drawn in Figma: an "Active" Toggle Button, a small "Actions" Drop Down, the brand
 * Save button and previous / next record arrows. Each can be turned off per page.
 */
export function RecordActions({
  options = DEFAULT_OPTIONS,
  onAction,
  hideActive,
  active,
  onActiveChange,
  onSave,
  saveLabel = 'Save',
  onCancel,
  saveDisabled,
  hideSave,
  onPrevious,
  onNext,
  hideArrows,
}: RecordActionsProps) {
  const tiny = useContext(ActionsSize) === 'tiny';
  return (
    <>
      {!hideActive &&
        (active === undefined ? (
          <Toggle contained size={tiny ? 'tiny' : undefined} label="Active" defaultChecked />
        ) : (
          <Toggle
            contained
            size={tiny ? 'tiny' : undefined}
            label="Active"
            checked={active}
            onChange={e => onActiveChange?.(e.target.checked)}
          />
        ))}
      {options.length > 0 && (
        <Dropdown
          variant="button"
          size={tiny ? 'small' : 'medium'}
          label="Actions"
          hideLabel
          placeholder="Actions"
          options={options}
          // A menu of commands: nothing stays selected
          value={onAction ? null : undefined}
          onChange={onAction ? v => onAction(v as string) : undefined}
        />
      )}
      {!hideSave && onCancel && (
        <Button size={tiny ? 'tiny' : 'small'} variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      )}
      {!hideSave && (
        <Button size={tiny ? 'tiny' : 'small'} variant="brand" onClick={onSave} disabled={saveDisabled}>
          {saveLabel}
        </Button>
      )}
      {!hideArrows && (
        <>
          {/* The same height as the Active toggle, Actions and Save beside them: 44px (small), or Button Icon Tiny (32px) */}
          <IconButton
            size={tiny ? 'tiny' : 'small'}
            icon="chevron-left"
            label="Previous record"
            onClick={onPrevious}
            disabled={!onPrevious}
          />
          <IconButton
            size={tiny ? 'tiny' : 'small'}
            icon="chevron-right"
            label="Next record"
            onClick={onNext}
            disabled={!onNext}
          />
        </>
      )}
    </>
  );
}

export type RecordPageProps = {
  /** Record or page name in the header (Figma shows it in capitals, e.g. "WAREHOUSE"). */
  title: string;
  /** Icon in the header's circle. */
  icon: string;
  /** Trail after the Home icon; the last item is the current page. Items with `to` are links. */
  breadcrumb?: { label: string; to?: string }[];
  /** Element after the title, e.g. a tiny Chip. */
  tag?: ReactNode;
  /** Label / value pairs under the title (up to 4). */
  labels?: NavTier3LabelProps[];
  /** Text under the actions, e.g. "Last Modified: …". */
  meta?: ReactNode;
  /** Header controls; defaults to the Figma set (RecordActions). */
  actions?: ReactNode;
  /** Sub menu buttons; each one shows its section below the header. */
  sections: RecordSection[];
  /** Section shown first; defaults to the first one. */
  defaultSection?: string;
  /** Controlled section, for pages that switch sections themselves (e.g. a link to another section). */
  section?: string;
  onSectionChange?: (id: string) => void;
  onViewPhoto?: () => void;
  /** A bar above the header, e.g. "You're editing … Discard Changes / Save Changes". */
  banner?: ReactNode;
  /**
   * Figma Tier 3 `Jump Links` (on): links to the section's cards (each `id` is a card heading's id), as on Item Details
   * (1144:7748). They sit at the bottom of the header card; a click scrolls the page to that card. Once the full header
   * has scrolled away, a Tier 3 Sticky bar (the links and the actions) stays at the top of the page.
   */
  jumpLinks?: { items: JumpLink[]; 'aria-label'?: string };
};

/** Space between the Sticky bar and the card a jump link scrolls to (the page's 16px gap between cards). */
const CARD_GAP = 16;

/**
 * The framework for the app's pages: the Figma "Tier 3" header (2644:3738, design-system NavTier3) with its back
 * button, breadcrumb, record icon, title, tag, labels, actions and sub menu, then the selected section's content.
 * The double chevron collapses the header to one row. Build new pages on this and pass the sections' content.
 */
export function RecordPage({
  title,
  icon,
  breadcrumb = [],
  tag,
  labels,
  meta,
  actions = <RecordActions />,
  sections,
  defaultSection,
  section: sectionProp,
  onSectionChange,
  onViewPhoto,
  banner,
  jumpLinks,
}: RecordPageProps) {
  const navigate = useNavigate();
  const homeTo = '/app';
  const homeHref = useHref(homeTo);
  const [collapsed, setCollapsed] = useState(false);
  const [sectionState, setSectionState] = useState(defaultSection ?? sections[0]?.id);
  const sectionId = sectionProp ?? sectionState;
  function setSectionId(id: string) {
    setSectionState(id);
    onSectionChange?.(id);
  }
  const section = sections.find(s => s.id === sectionId) ?? sections[0];

  /*
   * Jump links: the picked link is shared by the header's row and the Sticky bar's, and stays picked while the page
   * scrolls (scrolling doesn't move the underline) until another is picked; the first starts picked.
   */
  const jumpItems = jumpLinks?.items ?? [];
  const jumpKey = jumpItems.map(item => item.id).join(' ');
  const [jumpId, setJumpId] = useState<string>();
  useEffect(() => setJumpId(undefined), [jumpKey]);
  const currentJump = jumpId && jumpItems.some(item => item.id === jumpId) ? jumpId : jumpItems[0]?.id;

  /*
   * Figma Tier 3 State=Sticky: once the full header has scrolled out of the page (AppShell's <main id="main">), the
   * Sticky bar shows at the top, flush with the page's top edge (--sticky-top: minus <main>'s top padding, which is
   * 24px, or 16px on smaller screens). The bar is always laid out (hidden until then), so a jump can allow for it.
   */
  const headerRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const hasJump = jumpItems.length > 0;
  useLayoutEffect(() => {
    const header = headerRef.current;
    const anchor = anchorRef.current;
    const scroller = document.getElementById('main');
    if (!hasJump || !header || !anchor || !scroller) return setStuck(false);
    const pad = () => anchor.style.setProperty('--sticky-top', `${-(parseFloat(getComputedStyle(scroller).paddingTop) || 0)}px`);
    const check = () => {
      pad();
      setStuck(header.getBoundingClientRect().bottom <= scroller.getBoundingClientRect().top + 1);
    };
    check();
    scroller.addEventListener('scroll', check, { passive: true });
    const observer = new ResizeObserver(check);
    observer.observe(header);
    observer.observe(scroller);
    return () => {
      scroller.removeEventListener('scroll', check);
      observer.disconnect();
    };
  }, [hasJump]);

  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function jump(id: string) {
    setJumpId(id);
    const el = document.getElementById(id);
    const card = el?.closest('section') ?? el;
    if (!card) return;
    const behavior = reduceMotion() ? 'auto' : 'smooth';
    // Only the shell's content area scrolls: scrollIntoView would also scroll the shell around it when the card can't
    // reach the top (a card near the bottom), which pushed the footer up
    const scroller = document.getElementById('main');
    if (!scroller) return card.scrollIntoView({ behavior, block: 'start' });
    const offset = (stickyRef.current?.offsetHeight ?? 0) + CARD_GAP;
    const top = card.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - offset;
    scroller.scrollTo({ top: Math.max(0, top), behavior });
  }
  // The Sticky bar's double chevron brings the full header back by scrolling to the top
  function showHeader() {
    document.getElementById('main')?.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
  }
  const jumpRow = hasJump ? (
    <JumpLinks items={jumpItems} value={currentJump} onChange={jump} aria-label={jumpLinks?.['aria-label']} />
  ) : undefined;

  const pageName = breadcrumb.at(-1)?.label ?? title;
  useEffect(() => {
    document.title = `HUB360 · ${pageName}`;
  }, [pageName]);

  // Back goes to the previous page in the app, or Home when the page was opened directly
  function back() {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate(homeTo);
  }

  // NavTier3's Breadcrumb renders plain links; send plain clicks through React Router so open tabs survive
  // (Ctrl / Cmd / Shift clicks still open the real href in a new browser tab or window)
  const plainClick = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
  function go(e: MouseEvent, to: string) {
    if (!plainClick(e)) return;
    e.preventDefault();
    navigate(to);
  }
  // The Home icon link has no onClick prop, so it is caught here
  function onClickCapture(e: MouseEvent<HTMLDivElement>) {
    const link = (e.target as Element).closest('a');
    if (link?.getAttribute('href') === homeHref) go(e, homeTo);
  }
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <div className={styles.page} onClickCapture={onClickCapture}>
      {banner}
      <div ref={headerRef}>
        <NavTier3
          title={title}
          icon={icon}
          onViewPhoto={onViewPhoto}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          onBack={back}
          homeHref={homeHref}
          breadcrumb={breadcrumb.map(({ label, to }) =>
            to ? { label, href: `${base}${to}`, onClick: (e: MouseEvent<HTMLAnchorElement>) => go(e, to) } : { label },
          )}
          tag={tag}
          labels={labels}
          actions={<ActionsSize.Provider value={collapsed ? 'tiny' : 'default'}>{actions}</ActionsSize.Provider>}
          meta={meta}
          items={sections.map(({ id, label }) => ({ id, label }))}
          value={section?.id}
          onChange={setSectionId}
          jumpLinks={jumpRow}
        />
      </div>
      {hasJump && (
        // A 0-high sticky anchor right under the header; the bar hangs from it over the content
        <div ref={anchorRef} className={styles.stickyAnchor}>
          <div ref={stickyRef} className={styles.stickyBar} data-shown={stuck || undefined} inert={!stuck}>
            <NavTier3
              sticky
              title={title}
              icon={icon}
              actions={<ActionsSize.Provider value="tiny">{actions}</ActionsSize.Provider>}
              jumpLinks={jumpRow}
              onCollapsedChange={showHeader}
            />
          </div>
        </div>
      )}
      {section && (
        <section className={styles.content} aria-label={section.label}>
          {section.content ?? (
            <div className={styles.placeholder}>
              <Icon name={icon} size={32} />
              <p>{section.label} hasn’t been built yet.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
