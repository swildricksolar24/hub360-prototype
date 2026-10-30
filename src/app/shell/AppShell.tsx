import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { Footer } from '../../components/Footer/Footer';
import { Header } from '../../components/Header/Header';
import { Logo } from '../../components/Logo/Logo';
import { NavTabBar } from '../../components/NavTabBar/NavTabBar';
import { NavTier1 } from '../../components/NavTier1/NavTier1';
import { NavTier2 } from '../../components/NavTier2/NavTier2';
import { AccountMenu } from './AccountMenu';
import { InboxModal, useInbox, type ShellContext } from './InboxModal';
import { APP_VERSION, DEFAULT_SECTION, LEGAL_LINKS, SECTIONS, findSection, locationLabel, sectionPath } from './navigation';
import { useMediaQuery } from './useMediaQuery';
import styles from './AppShell.module.css';

const HOME_PATH = `/app/${DEFAULT_SECTION}`;

/** Pages outside the sections (from the header, account menu and the tab bar's +): their tab label and icon. */
const UTILITY_PAGES: Record<string, { label: string; icon?: string }> = {
  account: { label: 'Account Settings', icon: 'account' },
  help: { label: 'Help', icon: 'life-preserver' },
  'new-tab': { label: 'New Tab' },
};

/** Blank tabs from the tab bar's + live at /app/new-tab/<n>, one path per tab. */
const NEW_TAB = '/app/new-tab/';

/** A tab shows the page name with its section icon; `title` is the full "Section · Page" name. */
type Tab = { id: string; label: string; icon?: string; title: string };

/**
 * Figma "Shell" (798:4096 and its Tier variants): Tab Bar, Header, Tier 1 rail, optional Tier 2 menu,
 * content area and Footer. Sections come from navigation.ts; each route renders inside <Outlet />.
 */
export function AppShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // The shell is the /app layout route, so it reads the section from the URL rather than its own params.
  const match = useMatch('/app/:section/:page?');
  const sectionId = match?.params.section ?? DEFAULT_SECTION;
  const pageId = match?.params.page;
  const section = findSection(sectionId);
  const utility = UTILITY_PAGES[sectionId];
  const label = utility?.label ?? locationLabel(sectionId, pageId);

  // Figma's compact variants: Tier 1 compact on narrower screens, Tier 2 collapsed on the narrowest.
  const tier1Compact = useMediaQuery('(max-width: 1439px)');
  const tier2Collapsed = useMediaQuery('(max-width: 1199px)');

  // Header Notifications / Chat / Email: unread counts and the list modals (Figma Communication page).
  const inbox = useInbox();

  // Open tabs: every visited location, like browser tabs (Figma Tab Bar).
  const [tabs, setTabs] = useState<Tab[]>([]);
  // A section's landing page (where the Tier 1 rail goes) is labeled with the section name, e.g. "Inventory";
  // other Tier 2 pages show their own name, e.g. "Warehouses".
  const isLanding = !!section?.pages && pageId === section.pages[0].id;
  const shortLabel = isLanding
    ? section.label
    : section?.pages?.find(p => p.id === pageId)?.label ?? (utility ? label : section?.label ?? label);
  const tabIcon = utility?.icon ?? section?.icon;

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

  // Like a browser's new tab, going somewhere from a blank tab fills that tab instead of opening another one
  const previousPath = useRef(pathname);
  useEffect(() => {
    const from = previousPath.current;
    previousPath.current = pathname;
    if (pathname === '/app' || redirecting.current) return;
    setTabs(open => {
      if (open.some(t => t.id === pathname)) return open;
      const tab = { id: pathname, label: shortLabel, icon: tabIcon, title: label };
      // (another + keeps the blank tab and opens a second one)
      const fills = from.startsWith(NEW_TAB) && !pathname.startsWith(NEW_TAB);
      const blank = fills ? open.findIndex(t => t.id === from) : -1;
      return blank >= 0 ? open.map((t, i) => (i === blank ? tab : t)) : [...open, tab];
    });
  }, [pathname, label, shortLabel, tabIcon]);

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
        onHome={() => navigate('/app')}
        onAdd={openNewTab}
      />
      <Header
        className={styles.header}
        logo={<Logo name="logo-side" />}
        search={{ label: 'Search', placeholder: 'Search', onKeyDown: onSearchKey }}
        actions={[
          { id: 'notifications', icon: 'notification', label: 'Notifications', count: inbox.unread('notifications'), onClick: () => inbox.open('notifications') },
          { id: 'messages', icon: 'chat', label: 'Messages', count: inbox.unread('messages'), onClick: () => inbox.open('messages') },
          { id: 'email', icon: 'email', label: 'Email', count: inbox.unread('email'), onClick: () => inbox.open('email') },
          { id: 'help', icon: 'life-preserver', label: 'Help', onClick: () => navigate('/app/help') },
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
        />
        {section?.pages && (
          <NavTier2
            className={styles.tier2}
            aria-label={section.label}
            items={section.pages}
            value={pageId}
            onChange={id => navigate(sectionPath(section, id))}
            variant={tier2Collapsed ? 'collapsed' : 'default'}
          />
        )}
        <main className={styles.content} id="main">
          <Outlet context={{ inbox } satisfies ShellContext} />
        </main>
      </div>
      <Footer
        className={styles.footer}
        copyright="© 2026 HUB360, All Rights Reserved"
        version={`Version: ${APP_VERSION}`}
        links={LEGAL_LINKS}
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
