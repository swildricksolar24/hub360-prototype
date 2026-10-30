/**
 * The app's sections. Adding a section here adds it to the Tier 1 rail, routing and tabs; give it `pages`
 * to get a Tier 2 menu. A section's screens are routed at /app/<section>/<page>.
 * Labels and icons follow the Figma "Shell" frames (Dicn7aHuXXE7dmCg57RwwB, page "Shell").
 */
export type NavPage = { id: string; label: string; icon: string };
export type NavSection = { id: string; label: string; icon: string; pages?: NavPage[] };

export const SECTIONS: NavSection[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'tasks', label: 'Tasks', icon: 'tasks' },
  { id: 'schedule', label: 'Schedule', icon: 'schedule' },
  {
    id: 'sites',
    label: 'Sites',
    icon: 'home',
    // Figma's Tier 2 example (HubSight … Settings); attached to Sites until each section's real menu is designed.
    pages: [
      { id: 'hubsight', label: 'HubSight', icon: 'visibility' },
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
      { id: 'warehouses', label: 'Warehouses', icon: 'warehouse' },
      { id: 'items', label: 'Items', icon: 'tasks' },
      { id: 'counts', label: 'Counts', icon: 'sales' },
      { id: 'orders', label: 'Orders', icon: 'orders' },
      { id: 'purchasing', label: 'Purchasing', icon: 'recent-sales' },
      { id: 'receiving', label: 'Receiving', icon: 'receiving' },
      { id: 'shipping', label: 'Shipping', icon: 'service' },
      { id: 'suppliers', label: 'Suppliers', icon: 'suppliers' },
      { id: 'reports', label: 'Reports', icon: 'reports' },
      { id: 'users', label: 'Users', icon: 'users' },
      { id: 'settings', label: 'Settings', icon: 'settings' },
    ],
  },
  { id: 'accounts', label: 'Accounts', icon: 'account' },
  { id: 'projects', label: 'Projects', icon: 'reports' },
  { id: 'service', label: 'Service', icon: 'service' },
  { id: 'sales', label: 'Sales', icon: 'sales' },
  { id: 'reports', label: 'Reports', icon: 'reports' },
  { id: 'users', label: 'Users', icon: 'users' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

export const DEFAULT_SECTION = 'dashboard';

export function findSection(id: string | undefined) {
  return SECTIONS.find(s => s.id === id);
}

/** Path for a section, defaulting to its first Tier 2 page. */
export function sectionPath(section: NavSection, pageId?: string) {
  const page = pageId ?? section.pages?.[0]?.id;
  return page ? `/app/${section.id}/${page}` : `/app/${section.id}`;
}

/** Title shown for a location: "Section" or "Section · Page". */
export function locationLabel(sectionId: string, pageId?: string) {
  const section = findSection(sectionId);
  if (!section) return 'Not found';
  const page = section.pages?.find(p => p.id === pageId);
  return page ? `${section.label} · ${page.label}` : section.label;
}

export const APP_VERSION = '0.246';

/** Footer links open PDFs in a new window (Figma note on the Shell page); files go in public/legal/. */
export const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/legal/privacy-policy.pdf', newWindow: true },
  { label: 'Terms of Service', href: '/legal/terms-of-service.pdf', newWindow: true },
  { label: 'Cookie Policy', href: '/legal/cookie-policy.pdf', newWindow: true },
  { label: 'Accessibility Statement', href: '/legal/accessibility-statement.pdf', newWindow: true },
];
