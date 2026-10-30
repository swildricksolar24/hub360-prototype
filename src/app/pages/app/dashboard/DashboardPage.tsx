import { useEffect } from 'react';
import { useHref, useLinkClickHandler } from 'react-router-dom';
import { Avatar } from '../../../../components/Avatar/Avatar';
import { Icon } from '../../../../components/Icon/Icon';
import { Badge } from '../../../../components/Badge/Badge';
import { useAuth } from '../../../auth/AuthContext';
import { INBOX_TITLES, type InboxKind } from '../../../shell/inbox';
import { useShellInbox } from '../../../shell/InboxModal';
import { findSection, sectionPath } from '../../../shell/navigation';
import styles from './DashboardPage.module.css';

/**
 * A section card that is one big link: icon tile, name and description. Hover and keyboard focus fill
 * it with light brand teal; pressing deepens its stroke.
 */
function SectionCard({ to, icon, title, description }: { to: string; icon: string; title: string; description: string }) {
  const href = useHref(to);
  const onClick = useLinkClickHandler<HTMLAnchorElement>(to);
  return (
    <a href={href} onClick={onClick} className={styles.module}>
      <span className={styles.tile} aria-hidden>
        <Icon name={icon} size={32} color="currentColor" />
      </span>
      <span className={styles.moduleText}>
        <span className={`text-heading-4-bold ${styles.moduleTitle}`}>{title}</span>
        <span className={`text-medium-regular ${styles.muted}`}>{description}</span>
      </span>
    </a>
  );
}

const INBOX_CARDS: { kind: InboxKind; icon: string }[] = [
  { kind: 'notifications', icon: 'notification' },
  { kind: 'messages', icon: 'chat' },
  { kind: 'email', icon: 'email' },
];

/**
 * Notifications / Chat / Email card: a compact row with the icon, name and unread count, from the header's inbox.
 * Clicking it opens that list in the app modal, the same as the header buttons. Same states as the section cards.
 */
function InboxCard({ kind, icon }: (typeof INBOX_CARDS)[number]) {
  const inbox = useShellInbox();
  const unread = inbox.unread(kind);
  return (
    <button type="button" className={`${styles.module} ${styles.inboxCard}`} onClick={() => inbox.open(kind)}>
      <span className={styles.tile} aria-hidden>
        <Icon name={icon} size={20} color="currentColor" />
      </span>
      <span className={`text-large-bold ${styles.moduleTitle}`}>{INBOX_TITLES[kind]}</span>
      {unread > 0 && (
        <Badge shape="pill" color="blue" className={styles.inboxCount}>
          {unread} new
        </Badge>
      )}
    </button>
  );
}

function greeting(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Dashboard: an improved take on the Figma "_Sign In / Shell" › Dashboard (426:10035). The welcome card keeps the
 * profile photo and name, and adds a time-of-day greeting and today's date. Under it, Notifications / Chat / Email
 * cards open the header's lists. Figma's 12 module tiles (built from Tier 1 menu buttons) become one clickable
 * card per section that is built so far (Inventory).
 */
export function DashboardPage() {
  const { user } = useAuth();
  const inventory = findSection('inventory');
  const now = new Date();
  const today = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    document.title = 'Dashboard · HUB 360';
  }, []);

  return (
    <div className={styles.page}>
      <section className={styles.welcome} aria-labelledby="welcome-title">
        <span className={styles.photo}>
          <Avatar size="large" src={user?.photo || undefined} initials={user?.initials} label={user?.name} />
        </span>
        <div className={styles.welcomeText}>
          <p className={`text-medium-semi-bold ${styles.date}`}>{today}</p>
          <h1 id="welcome-title" className={`text-heading-2-bold ${styles.greeting}`}>
            {greeting(now.getHours())}, {user?.name}!
          </h1>
          <p className={`text-large-regular ${styles.lede}`}>
            This dashboard is your central hub for project updates from start to finish. Pick up where you left off below.
          </p>
        </div>
      </section>

      <section className={styles.inbox} aria-label="Notifications, chat and email">
        {INBOX_CARDS.map(card => (
          <InboxCard key={card.kind} {...card} />
        ))}
      </section>

      {inventory && (
        <nav className={styles.sections} aria-label="Sections">
          {/* The Inventory card four times to fill the row while it is the only section; swap in new sections here */}
          {[1, 2, 3, 4].map(n => (
            <SectionCard
              key={n}
              to={sectionPath(inventory)}
              icon={inventory.icon}
              title={inventory.label}
              description="Warehouses, items, counts, receiving and shipping across your sites."
            />
          ))}
        </nav>
      )}
    </div>
  );
}
