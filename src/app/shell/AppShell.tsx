import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { Footer } from '../../components/Footer/Footer';
import { Header } from '../../components/Header/Header';
import { Logo } from '../../components/Logo/Logo';
import { NavTabBar, NavTabSmall } from '../../components/NavTabBar/NavTabBar';
import { NavTier1 } from '../../components/NavTier1/NavTier1';
import { NavTier2 } from '../../components/NavTier2/NavTier2';
import { AccountMenu } from './AccountMenu';
import { AllTabsModal } from './AllTabsModal';
import { capturePreview, whenIdle } from './tabPreviews';
import { InboxModal, useInbox, type ShellContext } from './InboxModal';
import { PrototypeHelperPanel, PrototypeHelperProvider, usePrototypeHelper } from './PrototypeHelper';
import { APP_VERSION, DEFAULT_SECTION, LEGAL_LINKS, SECTIONS, findSection, locationLabel, sectionPath } from './navigation';
import { useMediaQuery } from './useMediaQuery';
import styles from './AppShell.module.css';

const HOME_PATH = `/app/${DEFAULT_SECTION}`;

/** Pages outside the sections (from the header, account menu and the tab bar's +): their tab label and icon. */
const UTILITY_PAGES: Record<string, { label: string; icon?: string }> = {
  account: { label: 'Account Settings', icon: 'account' },
  help: { label: 'Help', icon: 'question-mark-help' },
  // A tab added with +: the Icon Library's Draft icon (an empty page)
  'new-tab': { label: 'New Tab', icon: 'draft' },
};

/** Blank tabs from the tab bar's + live at /app/new-tab/<n>, one path per tab. */
const NEW_TAB = '/app/new-tab/';

/** How long after a page opens its preview is taken (ms): long enough for it to finish loading and animating. */
const PREVIEW_DELAY_MS = 1000;

/**
 * A tab shows the page name with that page's icon; `title` is the full "Section · Page" name. `blank` marks a New Tab
 * from the tab bar's +, so the bar knows when one turns into a page.
 */
type Tab = { id: string; label: string; icon?: string; title: string; blank?: boolean };

/**
 * Figma "Shell" (798:4096 and its Tier variants): Tab Bar, Header, Tier 1 rail, optional Tier 2 menu,
 * content area and Footer. Sections come from navigation.ts; each route renders inside <Outlet />.
 */
export function AppShell() {
  const navigate = useNavigate();
  const { pathname, state } = useLocation();
  // The shell is the /app layout route, so it reads the section from the URL rather than its own params.
  // Deeper paths are records inside a Tier 2 page, e.g. /app/inventory/warehouses/PHX-124.
  const match = useMatch('/app/:section/:page?/*');
  const sectionId = match?.params.section ?? DEFAULT_SECTION;
  const pageId = match?.params.page;
  const section = findSection(sectionId);
  const navPage = section?.pages?.find(p => p.id === pageId);
  const recordId = match?.params['*']?.split('/')[0];
  const recordName = recordId ? (navPage?.recordLabel?.(recordId) ?? recordId) : undefined;
  const utility = UTILITY_PAGES[sectionId];
  const pageLabel = utility?.label ?? locationLabel(sectionId, pageId);
  const label = recordName ? `${pageLabel} · ${recordName}` : pageLabel;

  // Figma's compact variants: Tier 2 collapsed from 1280px down (so tables get about 140px more room at laptop
  // widths). Tier 1's compact mode depends on Tier 2, not the width (see tier1Compact below).
  const tier2Collapsed = useMediaQuery('(max-width: 1280px)');
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  // Tier 2 animation (not in Figma): when a section with Tier 2 pages opens, the menu's slot grows out of the
  // Tier 1 rail (so the page glides over instead of jumping) while the menu fades and slides in. Moving to
  // another section that also has Tier 2 only replays the fade.
  const tier2Slot = useRef<HTMLDivElement>(null);
  const hadTier2 = useRef(false);
  const hasTier2 = !!section?.pages;
  // Tier 1 is compact while a selected section shows its Tier 2 menu beside it, and in its default (labelled) state
  // when it's the only menu showing
  const tier1Compact = hasTier2;
  useLayoutEffect(() => {
    const slot = tier2Slot.current;
    const opening = hasTier2 && !hadTier2.current;
    hadTier2.current = hasTier2;
    if (!slot || reduceMotion) return;
    const easing = 'cubic-bezier(0.2, 0, 0, 1)';
    if (opening) slot.animate([{ width: '0px' }, { width: `${slot.offsetWidth}px` }], { duration: 280, easing });
    slot.firstElementChild?.animate([{ opacity: 0, transform: 'translateX(-12px)' }, { opacity: 1, transform: 'none' }], {
      duration: 280,
      delay: opening ? 60 : 0,
      easing,
      fill: 'backwards',
    });
  }, [hasTier2, section?.id, reduceMotion]);

  // Header Notifications / Chat / Email: unread counts and the list modals (Figma Communication page).
  const inbox = useInbox();

  // Open tabs: every visited location, like browser tabs (Figma Tab Bar).
  const [tabs, setTabs] = useState<Tab[]>([]);
  // A section's landing page (where the Tier 1 rail goes) is labeled with the section name, e.g. "Inventory";
  // other Tier 2 pages show their own name, e.g. "Warehouses".
  // A record's tab shows the record's name, e.g. "Phoenix WH".
  const isLanding = !!section?.pages && pageId === section.pages[0].id;
  const shortLabel =
    recordName ?? (isLanding ? section.label : navPage?.label ?? (utility ? label : section?.label ?? label));
  // The icon matches the label: a Tier 2 page (and a record opened in it) gets that page's Tier 2 icon, e.g. Items'
  // for "Items" or "Bracket Assembly"; a section's landing page, labeled with the section, keeps the section's icon.
  const tabIcon = utility?.icon ?? (isLanding ? section?.icon : navPage?.icon) ?? section?.icon;

  // The shell always opens on Dashboard (after sign-in, on reload or from a pasted link); after that,
  // navigation works as usual. `redirecting` keeps the page we leave from being opened as a tab.
  const opened = useRef(false);
  const redirecting = useRef(false);
  useEffect(() => {
    if (!opened.current) {
      opened.current = true;
      if (pathname !== HOME_PATH) {
        redirecting.current = true;
        navigate(HOME_PATH, { replace: true });
      }
    } else if (pathname === HOME_PATH) {
      redirecting.current = false;
    }
  }, [pathname, navigate]);

  // Like a browser's new tab, going somewhere from a blank tab fills that tab instead of opening another one.
  // Navigating with `state: { replaceTab: true }` (a record's previous / next arrows, or leaving a deleted record)
  // also reuses the current tab instead of opening another.
  const replaceTab = (state as { replaceTab?: boolean } | null)?.replaceTab === true;
  const previousPath = useRef(pathname);
  useEffect(() => {
    const from = previousPath.current;
    previousPath.current = pathname;
    if (pathname === '/app' || redirecting.current) return;
    setTabs(open => {
      if (replaceTab && from !== pathname && open.some(t => t.id === from)) {
        const others = open.filter(t => t.id !== from);
        if (others.some(t => t.id === pathname)) return others;
      } else if (open.some(t => t.id === pathname)) return open;
      const tab = { id: pathname, label: shortLabel, icon: tabIcon, title: label, blank: pathname.startsWith(NEW_TAB) };
      if (replaceTab && open.some(t => t.id === from)) return open.map(t => (t.id === from ? tab : t));
      // (another + keeps the blank tab and opens a second one)
      const fills = from.startsWith(NEW_TAB) && !pathname.startsWith(NEW_TAB);
      const blank = fills ? open.findIndex(t => t.id === from) : -1;
      return blank >= 0 ? open.map((t, i) => (i === blank ? tab : t)) : [...open, tab];
    });
  }, [pathname, label, shortLabel, tabIcon, replaceTab]);

  // The tab bar's +: a new blank tab after the others
  const newTabCount = useRef(0);
  function openNewTab() {
    newTabCount.current += 1;
    navigate(`${NEW_TAB}${newTabCount.current}`);
  }

  function closeTab(id: string) {
    const index = tabs.findIndex(t => t.id === id);
    const remaining = tabs.filter(t => t.id !== id);
    setTabs(remaining);
    if (id === pathname) navigate(remaining[Math.max(0, index - 1)]?.id ?? '/app');
  }

  // The tab bar's "All tabs" button: every open tab as cards in a modal (Figma Shell file, "All Tabs Overview")
  const [allTabsOpen, setAllTabsOpen] = useState(false);

  // The tab bar's Helper icon (beside All tabs) and its panel
  const helper = usePrototypeHelper();
  const setHelperOpen = helper.setOpen;
  const closeHelper = useCallback(() => setHelperOpen(false), [setHelperOpen]);

  // Previews for those cards: a small picture of each tab's page content (<main>), taken while the tab is on screen,
  // since only the current tab's page is rendered. Taken about a second after a page loads (when the browser is
  // idle) and again as the overview opens; kept in memory per tab, dropped when the tab closes.
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const currentPath = useRef(pathname);
  currentPath.current = pathname;
  const capture = useCallback(async (id: string) => {
    const main = document.getElementById('main');
    if (!main) return;
    const image = await capturePreview(main);
    // Keep it only if that tab is still the one showing (the user may have moved on while it was taken)
    if (image && id === currentPath.current) setPreviews(open => ({ ...open, [id]: image }));
  }, []);
  useEffect(() => {
    if (pathname === '/app') return;
    let cancelIdle = () => {};
    const timer = window.setTimeout(() => {
      cancelIdle = whenIdle(() => void capture(pathname));
    }, PREVIEW_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      cancelIdle();
    };
  }, [pathname, capture]);
  useEffect(() => {
    setPreviews(open => {
      const kept = Object.fromEntries(Object.entries(open).filter(([id]) => tabs.some(t => t.id === id)));
      return Object.keys(kept).length === Object.keys(open).length ? open : kept;
    });
  }, [tabs]);

  // Header search: Enter jumps to the first section or page whose name matches.
  function onSearchKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    const q = e.currentTarget.value.trim().toLowerCase();
    if (!q) return;
    for (const s of SECTIONS) {
      if (s.label.toLowerCase().includes(q)) return navigate(sectionPath(s));
      const page = s.pages?.find(p => p.label.toLowerCase().includes(q));
      if (page) return navigate(sectionPath(s, page.id));
    }
  }

  return (
    <div className={styles.shell}>
      <NavTabBar
        className={styles.tabs}
        tabs={tabs}
        activeId={pathname}
        onSelect={navigate}
        onClose={closeTab}
        onReorder={ids => setTabs(open => ids.map(id => open.find(t => t.id === id)!).filter(Boolean))}
        // The All tabs button only appears once more than one tab is open
        onShowAll={
          tabs.length > 1
            ? () => {
                setAllTabsOpen(true);
                // refresh the current tab's preview (the overview sits outside <main>, so it isn't in the picture)
                void capture(pathname);
              }
            : undefined
        }
        onHome={() => navigate('/app')}
        onAdd={openNewTab}
        // The Helper icon, always beside All tabs (its panel holds the current page's helper, if it has one)
        actions={
          <NavTabSmall
            icon="life-preserver"
            label="Helper"
            aria-haspopup="dialog"
            aria-expanded={helper.open}
            aria-controls="prototype-helper"
            data-prototype-helper-toggle=""
            onClick={() => setHelperOpen(o => !o)}
          />
        }
      />
      <Header
        className={styles.header}
        // The app name, then the current Tier 1 section (e.g. "HUB360 | Inventory"); utility pages show the name only
        logo={
          <span className={styles.brand}>
            <Logo name="logo-side" text="HUB360" />
            {section && <span className={styles.brandSection}>{section.label}</span>}
          </span>
        }
        search={{ label: 'Search', placeholder: 'Search', onKeyDown: onSearchKey }}
        actions={[
          { id: 'notifications', icon: 'notification', label: 'Notifications', count: inbox.unread('notifications'), onClick: () => inbox.open('notifications') },
          { id: 'messages', icon: 'chat', label: 'Messages', count: inbox.unread('messages'), onClick: () => inbox.open('messages') },
          { id: 'email', icon: 'email', label: 'Email', count: inbox.unread('email'), onClick: () => inbox.open('email') },
          { id: 'help', icon: 'question-mark-help', label: 'Help', onClick: () => navigate('/app/help') },
        ]}
        avatar={<AccountMenu />}
      />
      <div className={styles.body}>
        <NavTier1
          className={styles.tier1}
          items={SECTIONS.map(({ id, label, icon }) => ({ id, label, icon }))}
          value={section?.id}
          onChange={id => {
            const next = findSection(id);
            if (next) navigate(sectionPath(next));
          }}
          compact={tier1Compact}
          // Bigger than Figma's 24 / 16px: the design system's next icon size up
          iconSize={tier1Compact ? 20 : 32}
        />
        {section?.pages && (
          <div ref={tier2Slot} className={styles.tier2Slot}>
            <NavTier2
              className={styles.tier2}
              aria-label={section.label}
              items={section.pages}
              value={pageId}
              onChange={id => navigate(sectionPath(section, id))}
              variant={tier2Collapsed ? 'collapsed' : 'default'}
              // The design system's 20px icon size (Figma draws 24px), in the same 38px box
              iconSize={20}
            />
          </div>
        )}
        <main className={styles.content} id="main">
          <PrototypeHelperProvider slot={helper.slot}>
            <Outlet context={{ inbox } satisfies ShellContext} />
          </PrototypeHelperProvider>
        </main>
      </div>
      <Footer
        className={styles.footer}
        copyright="© 2026 HUB360, All Rights Reserved"
        version={`Version: ${APP_VERSION}`}
        links={LEGAL_LINKS}
      />
      <PrototypeHelperPanel open={helper.open} available={helper.available} onClose={closeHelper} setTarget={helper.setTarget} />
      <AllTabsModal
        open={allTabsOpen}
        tabs={tabs}
        previews={previews}
        activeId={pathname}
        onSelect={id => {
          setAllTabsOpen(false);
          if (id !== pathname) navigate(id);
        }}
        onCloseTab={closeTab}
        onCloseOthers={() => setTabs(open => open.filter(t => t.id === pathname))}
        onClose={() => setAllTabsOpen(false)}
      />
      <InboxModal
        kind={inbox.openKind}
        items={inbox.openKind ? inbox.items[inbox.openKind] : []}
        onClose={inbox.close}
        onToggleBookmark={id => inbox.openKind && inbox.toggleBookmark(inbox.openKind, id)}
        onRemove={id => inbox.openKind && inbox.remove(inbox.openKind, id)}
      />
    </div>
  );
}
