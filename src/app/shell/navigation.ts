/**
 * The app's sections. Adding a section here adds it to the Tier 1 rail, routing and tabs; give it `pages`
 * to get a Tier 2 menu. A section's screens are routed at /app/<section>/<page>.
 * Labels and icons follow the Figma "Shell" frames (Dicn7aHuXXE7dmCg57RwwB, page "Shell").
 */
import { findItem } from '../pages/app/inventory/items/itemStore';
import { findOrder } from '../pages/app/inventory/orders/orderStore';
import { findWarehouse } from '../pages/app/inventory/warehouseStore';

export type NavPage = {
  id: string;
  label: string;
  icon: string;
  /** Name of a record opened under this page (/app/<section>/<page>/<id>), shown on its tab. */
  recordLabel?: (id: string) => string | undefined;
};
export type NavSection = { id: string; label: string; icon: string; pages?: NavPage[] };

// The build starts with Dashboard and Inventory. Figma's other sections (Tasks, Schedule, Sites, Accounts,
// Projects, Service, Sales, Reports, Users, Settings) come back here as they are built.
export const SECTIONS: NavSection[] = [
  // The home icon: Dashboard is where the app opens (the tab bar's Home button goes here too)
  { id: 'dashboard', label: 'Dashboard', icon: 'home' },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: 'warehouse',
    // In the order of the Figma file "Inventory Management" (7FlRxkXbbjUhWJ3t1MMrVr). The Dashboard (819:7974) is
    // first, so it's where the Tier 1 Inventory button lands. The Shell's other Tier 2 pages come back here as they
    // are built: HubSight (visibility), Counts (sales), Purchasing (recent-sales), Receiving (receiving),
    // Shipping (service), Suppliers (suppliers), Reports (reports), Users (users), Settings (settings).
    pages: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
      { id: 'warehouses', label: 'Warehouses', icon: 'warehouse', recordLabel: code => findWarehouse(code)?.name },
      { id: 'items', label: 'Items', icon: 'tasks', recordLabel: id => findItem(id)?.name },
      { id: 'orders', label: 'Orders', icon: 'orders', recordLabel: id => findOrder(id)?.number },
    ],
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
