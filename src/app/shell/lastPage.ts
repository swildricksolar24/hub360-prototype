/**
 * The last page someone visited in the app, for the Dashboard's "Pick up where you left off" card. Unlike the rest of
 * the prototype it's kept in localStorage (`hub360.lastPage.<user id>`), so it survives signing out and reloading.
 */
import { SECTIONS } from './navigation';

export type LastPage = {
  /** Path and query, e.g. /app/inventory/items/PA-0002-AJ89-98HB?tab=stock */
  to: string;
  /** The page's tab name, e.g. "REC 325 Solar Panel" */
  name: string;
  /** Where it is, e.g. "Inventory › Items" */
  where: string;
  icon?: string;
  /** When it was visited (ms since 1970) */
  at: number;
};

const key = (userId: string) => `hub360.lastPage.${userId}`;

/** Pages that aren't worth returning to: the Dashboard, the app's starting address and blank New Tabs. */
export const isSkipped = (pathname: string) => pathname === '/app' || pathname === '/app/dashboard' || pathname.startsWith('/app/new-tab/');

export function saveLastPage(userId: string, page: LastPage) {
  try {
    localStorage.setItem(key(userId), JSON.stringify(page));
  } catch {
    // Storage can be off (private window); the card just won't show
  }
}

/** The saved page, or null when there's none or it no longer exists (e.g. a deleted item or warehouse). */
export function readLastPage(userId: string): LastPage | null {
  let page: LastPage | null = null;
  try {
    const raw = localStorage.getItem(key(userId));
    page = raw ? (JSON.parse(raw) as LastPage) : null;
  } catch {
    return null;
  }
  if (!page?.to || isSkipped(page.to.split('?')[0])) return null;
  return stillExists(page.to) ? page : null;
}

/** A record page (/app/<section>/<page>/<id>…) still exists when its page can name the record. */
function stillExists(to: string) {
  const [, , sectionId, pageId, recordId] = to.split('?')[0].split('/');
  const section = SECTIONS.find(s => s.id === sectionId);
  if (!section) return false;
  const page = section.pages?.find(p => p.id === pageId);
  if (pageId && section.pages && !page) return false;
  if (recordId && page?.recordLabel) return page.recordLabel(decodeURIComponent(recordId)) !== undefined;
  return true;
}

/** "today at 3:42 PM", "yesterday at 9:05 AM" or "Nov 10 at 4:30 PM". */
export function visitedWhen(at: number, now = new Date()) {
  const d = new Date(at);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((day(now) - day(d)) / 86_400_000);
  if (days === 0) return `today at ${time}`;
  if (days === 1) return `yesterday at ${time}`;
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${time}`;
}
