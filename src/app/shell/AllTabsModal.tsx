import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from '../../components/Icon/Icon';
import { IconButton } from '../../components/IconButton/IconButton';
import { Scrollbar } from '../../components/Scrollbar/Scrollbar';
import { SearchInput } from '../../components/SearchBar/SearchBar';
import { AppModal } from '../components/AppModal';
import styles from './AllTabsModal.module.css';

/** One open tab, as the tab bar shows it: a short label, its icon and the full "Section · Page" title. */
export type AllTabsItem = {
  id: string;
  label: string;
  icon?: string;
  title: string;
};

/** From this many open tabs on, the modal shows a search box. */
const SEARCH_FROM = 8;
/** How long the sheet takes to slide back up when it closes (ms); matches `sheet-up` in the CSS. */
const LEAVE_MS = 280;

type Props = {
  open: boolean;
  tabs: AllTabsItem[];
  /** A picture of each tab's page by tab id (JPEG data URLs), shown in the card's preview box; tabs without one show their icon. */
  previews?: Record<string, string>;
  /** The tab that's showing (marked "Current"). */
  activeId: string;
  onSelect: (id: string) => void;
  onCloseTab: (id: string) => void;
  /** Closes every tab except the current one. */
  onCloseOthers: () => void;
  onClose: () => void;
};

/**
 * The tab bar's "All tabs" overview (Figma "_Sign In / Shell", Modal page: "All Tabs Overview / Light" 1096:1100 and "/ Dark" 1095:806): a sheet that drops down from the top of the window, 50% of its
 * width and 90% of its height, with every open tab as a card in a grid that stretches to fill the width. Click a card to switch to that tab, × to close it.
 * Arrow keys move between cards, Enter switches, Delete closes the focused card.
 */
export function AllTabsModal({ open, tabs, previews = {}, activeId, onSelect, onCloseTab, onCloseOthers, onClose }: Props) {
  const [query, setQuery] = useState('');
  const grid = useRef<HTMLUListElement>(null);
  const cards = useRef<Record<string, HTMLButtonElement | null>>({});
  // After a card closes, focus moves to the card that took its place
  const refocus = useRef<number | null>(null);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  // Closing (×, Esc, a click outside, or picking a card) slides the sheet back up first, then really closes it
  const [leaving, setLeaving] = useState(false);
  const leaveTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (open) setLeaving(false);
    return () => window.clearTimeout(leaveTimer.current);
  }, [open]);
  function leave(then: () => void) {
    if (leaving) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return then();
    setLeaving(true);
    leaveTimer.current = window.setTimeout(then, LEAVE_MS);
  }

  const q = query.trim().toLowerCase();
  const shown = q ? tabs.filter(t => `${t.label} ${t.title}`.toLowerCase().includes(q)) : tabs;

  useEffect(() => {
    if (refocus.current === null) return;
    const next = shown[Math.min(refocus.current, shown.length - 1)];
    refocus.current = null;
    if (next) cards.current[next.id]?.focus();
  });

  function closeTab(id: string) {
    refocus.current = shown.findIndex(t => t.id === id);
    onCloseTab(id);
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    // The grid's column count (3, or 2 / 1 in a narrow well); zero-width columns don't count
    const columns = grid.current
      ? Math.max(
          1,
          getComputedStyle(grid.current)
            .gridTemplateColumns.split(' ')
            .filter(w => parseFloat(w) > 0).length,
        )
      : 1;
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      ArrowDown: index + columns,
      ArrowUp: index - columns,
      Home: 0,
      End: shown.length - 1,
    };
    if (e.key === 'Delete') {
      e.preventDefault();
      closeTab(shown[index].id);
      return;
    }
    if (!(e.key in moves)) return;
    e.preventDefault();
    const target = shown[Math.max(0, Math.min(shown.length - 1, moves[e.key]))];
    cards.current[target.id]?.focus();
  }

  const others = tabs.some(t => t.id !== activeId);

  return (
    <AppModal
      open={open}
      onClose={() => leave(onClose)}
      title={`Open tabs (${tabs.length})`}
      className={leaving ? `${styles.sheet} ${styles.leaving}` : styles.sheet}
      width="50vw"
      // The only footer button, on the right; the panel's × (and Esc, or a click outside) closes the overview
      secondaryAction={{
        label: 'Close other tabs',
        onClick: onCloseOthers,
        disabled: !others,
      }}
    >
      <div className={styles.body}>
        {tabs.length >= SEARCH_FROM && (
          <SearchInput
            className={styles.search}
            aria-label="Search open tabs"
            placeholder="Search tabs"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        )}
        {shown.length === 0 ? (
          <p className={styles.empty}>{tabs.length ? 'No open tabs match your search.' : 'No open tabs.'}</p>
        ) : (
          // Too many cards to fit: they scroll inside the well, with the design-system Scrollbar
          <Scrollbar label="Open tabs list" className={styles.cards}>
            <ul ref={grid} className={styles.grid} aria-label="Open tabs">
              {shown.map((t, i) => {
                const current = t.id === activeId;
                const location = t.title !== t.label ? t.title : undefined;
                return (
                  <li key={t.id} className={styles.card} data-current={current || undefined}>
                    <button
                      ref={el => {
                        cards.current[t.id] = el;
                      }}
                      type="button"
                      className={styles.main}
                      aria-current={current ? 'page' : undefined}
                      aria-label={`${t.title}${current ? ', current tab' : ''}`}
                      title={t.title}
                      onClick={() => leave(() => onSelect(t.id))}
                      onKeyDown={e => onKeyDown(e, i)}
                    >
                      {/* Figma "website preview": a picture of the tab's page, or its icon until one has been taken */}
                      <span className={styles.preview}>
                        {previews[t.id] ? (
                          <img className={styles.shot} src={previews[t.id]} alt="" />
                        ) : (
                          <Icon name={t.icon ?? 'draft'} size={32} color="currentColor" />
                        )}
                      </span>
                      <span className={styles.text}>
                        <span className={styles.name}>{t.label}</span>
                        {location && <span className={styles.location}>{location}</span>}
                      </span>
                    </button>
                    {current && (
                      <span className={styles.current} aria-hidden="true">
                        Current
                      </span>
                    )}
                    <IconButton
                      className={styles.close}
                      size="compact"
                      icon="close"
                      label={`Close ${t.title}`}
                      title="Close tab"
                      onClick={() => closeTab(t.id)}
                    />
                  </li>
                );
              })}
            </ul>
          </Scrollbar>
        )}
      </div>
    </AppModal>
  );
}
