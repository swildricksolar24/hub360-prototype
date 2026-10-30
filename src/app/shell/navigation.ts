/**
 * The app's sections. Adding a section here adds it to the Tier 1 rail, routing and tabs; give it `pages`
 * to get a Tier 2 menu. A section's screens are routed at /app/<section>/<page>.
 * Labels and icons follow the Figma "Shell" frames (Dicn7aHuXXE7dmCg57RwwB, page "Shell").
 */
export type NavPage = { id: string; label: string; icon: string };
export type NavSection = { id: string; label: string; icon: string; pages?: NavPage[] };

// The build starts with Dashboard and Inventory. Figma's other sections (Tasks, Schedule, Sites, Accounts,
// Projects, Service, Sales, Reports, Users, Settings) come back here as they are built.
export const SECTIONS: NavSection[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: 'warehouse',
    // Inventory starts with Warehouses only. Figma's other Tier 2 pages come back here as they are built:
    // HubSight (visibility), Dashboard (dashboard), Items (tasks), Counts (sales), Orders (orders),
    // Purchasing (recent-sales), Receiving (receiving), Shipping (service), Suppliers (suppliers),
    // Reports (reports), Users (users), Settings (settings).
    pages: [{ id: 'warehouses', label: 'Warehouses', icon: 'warehouse' }],
  },
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

/**
 * Footer links open PDFs in a new tab (Figma note on the Shell page). The files are sample documents in
 * public/legal/; BASE_URL keeps the links working when the app is served from a sub-path (GitHub Pages).
 */
const legal = (file: string) => `${import.meta.env.BASE_URL}legal/${file}`;
export const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: legal('privacy-policy.pdf'), newWindow: true },
  { label: 'Terms of Service', href: legal('terms-of-service.pdf'), newWindow: true },
  { label: 'Cookie Policy', href: legal('cookie-policy.pdf'), newWindow: true },
  { label: 'Accessibility Statement', href: legal('accessibility-statement.pdf'), newWindow: true },
];
