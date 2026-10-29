import type { MouseEventHandler } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Breadcrumb.module.css';

export type BreadcrumbItem = {
  label: string;
  /** Link target. The last item is the current page and is never a link. */
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export type BreadcrumbProps = {
  /** The trail after the home icon. Figma "Default" `Levels` = 1 + the number of items after the first. */
  items: BreadcrumbItem[];
  /**
   * small = Figma Primitive "Breadcrumb › Default" (Tiny/Medium text, 12px home and chevron icons) ·
   * default = Figma Web "Breadcrumb" (Medium/Regular text, 24px home icon, "/" separators).
   */
  size?: 'small' | 'default';
  /** Link for the home icon. Without it the icon is shown but not linked. */
  homeHref?: string;
  /** Accessible name of the home icon. */
  homeLabel?: string;
  /** Accessible name of the `<nav>` landmark. */
  'aria-label'?: string;
  className?: string;
};

export function Breadcrumb({
  items,
  size = 'small',
  homeHref,
  homeLabel = 'Home',
  'aria-label': ariaLabel = 'Breadcrumb',
  className,
}: BreadcrumbProps) {
  const iconSize = size === 'small' ? 12 : 24;
  const separator =
    size === 'small' ? (
      <Icon name="chevron-right" size={12} color="currentColor" className={styles.separator} />
    ) : (
      <span className={styles.separator} aria-hidden="true">
        /
      </span>
    );
  return (
    <nav aria-label={ariaLabel} className={[styles.breadcrumb, className].filter(Boolean).join(' ')} data-size={size}>
      <ol className={styles.list}>
        <li className={styles.item}>
          {homeHref ? (
            <a href={homeHref} className={[styles.link, styles.home].join(' ')} aria-label={homeLabel}>
              <Icon name="home" size={iconSize} color="currentColor" />
            </a>
          ) : (
            <span className={styles.home}>
              <Icon name="home" size={iconSize} color="currentColor" label={homeLabel} />
            </span>
          )}
        </li>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className={styles.item}>
              {separator}
              {item.href && !last ? (
                <a href={item.href} onClick={item.onClick} className={[styles.link, styles.label].join(' ')}>
                  {item.label}
                </a>
              ) : (
                <span className={styles.label} aria-current={last ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
