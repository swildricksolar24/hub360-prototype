import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Icon } from '../../../components/Icon/Icon';
import { findSection, locationLabel, sectionPath } from '../../shell/navigation';
import styles from './SectionPage.module.css';

/**
 * Placeholder for a section's screen until it is built. To build a section, route its own component
 * at /app/<section>/<page> in App.tsx before the generic route.
 */
export function SectionPage() {
  const { section: sectionId = '', page: pageId } = useParams();
  const section = findSection(sectionId);
  const title = locationLabel(sectionId, pageId);

  useEffect(() => {
    document.title = `${title} · HUB 360`;
  }, [title]);

  if (!section) return <EmptyState title="Page not found" body="This page doesn’t exist. Pick a section from the menu." icon="error" />;
  // Sections with a Tier 2 menu always show one of their pages.
  if (section.pages && !section.pages.some(p => p.id === pageId)) return <Navigate to={sectionPath(section)} replace />;

  return <EmptyState title={title} body="This section hasn’t been built yet." icon={section.pages?.find(p => p.id === pageId)?.icon ?? section.icon} />;
}

export function AccountSettingsPage() {
  useEffect(() => {
    document.title = 'Account Settings · HUB 360';
  }, []);
  return <EmptyState title="Account Settings" body="Account settings haven’t been built yet." icon="account" />;
}

function EmptyState({ title, body, icon }: { title: string; body: string; icon: string }) {
  return (
    <section className={styles.page} aria-labelledby="page-title">
      <h1 id="page-title" className={styles.title}>
        {title}
      </h1>
      <div className={styles.empty}>
        <Icon name={icon} size={32} />
        <p>{body}</p>
      </div>
    </section>
  );
}
