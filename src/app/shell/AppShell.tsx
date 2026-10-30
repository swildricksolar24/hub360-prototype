import { useEffect, useState, type KeyboardEvent } from 'react';
import { Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { Footer } from '../../components/Footer/Footer';
import { Header } from '../../components/Header/Header';
import { Logo } from '../../components/Logo/Logo';
import { NavTabBar } from '../../components/NavTabBar/NavTabBar';
import { NavTier1 } from '../../components/NavTier1/NavTier1';
import { NavTier2 } from '../../components/NavTier2/NavTier2';
import { ThemeToggle } from '../components/ThemeToggle';
import { AccountMenu } from './AccountMenu';
import { APP_VERSION, DEFAULT_SECTION, LEGAL_LINKS, SECTIONS, findSection, locationLabel, sectionPath } from './navigation';
import { useMediaQuery } from './useMediaQuery';
import styles from './AppShell.module.css';

type Tab = { id: string; label: string };

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
  const label = sectionId === 'account' ? 'Account Settings' : locationLabel(sectionId, pageId);

  // Figma's compact variants: Tier 1 compact on narrower screens, Tier 2 collapsed on the narrowest.
  const tier1Compact = useMediaQuery('(max-width: 1439px)');
  const tier2Collapsed = useMediaQuery('(max-width: 1199px)');

  // Open tabs: every visited location, like browser tabs (Figma Tab Bar).
  const [tabs, setTabs] = useState<Tab[]>([]);
  useEffect(() => {
    if (pathname === '/app') return;
    setTabs(open => (open.some(t => t.id === pathname) ? open : [...open, { id: pathname, label }]));
  }, [pathname, label]);

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
        onHome={() => navigate('/app')}
        onAdd={() => navigate('/app')}
      />
      <Header
        className={styles.header}
        logo={
          <span className={styles.brand}>
            <Logo name="logo-side" />
            {/* Prototype control (not in Figma): preview the shell in light and dark */}
            <ThemeToggle />
          </span>
        }
        search={{ label: 'Search', placeholder: 'Search', onKeyDown: onSearchKey }}
        actions={[
          { id: 'notifications', icon: 'notification', label: 'Notifications', count: 2 },
          { id: 'messages', icon: 'chat', label: 'Messages', count: 4 },
          { id: 'email', icon: 'email', label: 'Email', count: 8 },
          { id: 'help', icon: 'question-mark-help', label: 'Help' },
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
          <Outlet />
        </main>
      </div>
      <Footer
        className={styles.footer}
        copyright="© 2026 HUB360, All Rights Reserved"
        version={`Version: ${APP_VERSION}`}
        links={LEGAL_LINKS}
      />
    </div>
  );
}
