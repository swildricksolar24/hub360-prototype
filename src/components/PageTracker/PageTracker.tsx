import { Icon } from '../Icon/Icon';
import { IconButton } from '../IconButton/IconButton';
import styles from './PageTracker.module.css';

export type PageTrackerProps = {
  /** Current page, 1-based (Figma: "2", selected). */
  page: number;
  /** Total pages (Figma: "of 13"). */
  pageCount: number;
  onPageChange?: (page: number) => void;
  /** Rows per page (Figma "Rows per Page: 10" select). Hidden when `pageSizeOptions` is empty. */
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  /** Number of page buttons shown at once. Figma shows 5. */
  maxPageButtons?: number;
  /** Accessible name of the navigation landmark. Default "Pagination". */
  label?: string;
  className?: string;
};

/** The window of page numbers around the current page. */
function pageWindow(page: number, pageCount: number, size: number) {
  const count = Math.min(size, pageCount);
  const start = Math.min(Math.max(1, page - Math.floor((count - 1) / 2)), pageCount - count + 1);
  return Array.from({ length: count }, (_, i) => start + i);
}

/** Figma "Page Tracker › Tracker": rows-per-page select, first/previous, page numbers, next/last, and "n of total". */
export function PageTracker({
  page,
  pageCount,
  onPageChange,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  maxPageButtons = 5,
  label = 'Pagination',
  className,
}: PageTrackerProps) {
  const go = (p: number) => onPageChange?.(Math.min(Math.max(1, p), pageCount));
  const atStart = page <= 1;
  const atEnd = page >= pageCount;
  return (
    <nav aria-label={label} className={[styles.tracker, className].filter(Boolean).join(' ')}>
      <div className={styles.start}>
        {pageSizeOptions.length > 0 && (
          <label className={styles.select}>
            <select
              aria-label="Rows per page"
              value={pageSize}
              onChange={event => onPageSizeChange?.(Number(event.target.value))}
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  Rows per Page: {size}
                </option>
              ))}
            </select>
            <Icon name="chevron-down" size={20} className={styles.chevron} />
          </label>
        )}
      </div>

      <div className={styles.nav}>
        <div className={styles.group}>
          <IconButton className={styles.button} icon="last-left" label="First page" disabled={atStart} onClick={() => go(1)} />
          <IconButton className={styles.button} icon="chevron-left" label="Previous page" disabled={atStart} onClick={() => go(page - 1)} />
        </div>
        <ul className={styles.group}>
          {pageWindow(page, pageCount, maxPageButtons).map(p => (
            <li key={p}>
              <IconButton
                className={styles.button}
                number={p}
                label={`Page ${p}`}
                selected={p === page}
                aria-current={p === page ? 'page' : undefined}
                onClick={() => go(p)}
              />
            </li>
          ))}
        </ul>
        <div className={styles.group}>
          <IconButton className={styles.button} icon="chevron-right" label="Next page" disabled={atEnd} onClick={() => go(page + 1)} />
          <IconButton className={styles.button} icon="last-right" label="Last page" disabled={atEnd} onClick={() => go(pageCount)} />
        </div>
      </div>

      <p className={styles.count} aria-live="polite">
        {page} of {pageCount}
      </p>
    </nav>
  );
}
