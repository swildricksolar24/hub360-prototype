import type { InputHTMLAttributes, ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './AppBar.module.css';

export type AppBarProps = {
  /** Figma "Logo Icon" instance. Pass the Logo component (or any mark). */
  logo?: ReactNode;
  /** Controls after the logo. Figma shows five labelled dropdown filters ("Default" Drop Down Label instances). */
  children?: ReactNode;
  /** Props for the search field (placeholder, value, onChange…). Pass `false` to hide the field. */
  search?: (InputHTMLAttributes<HTMLInputElement> & { label?: string }) | false;
  /** Shows the hamburger menu button and handles its click. */
  onMenuClick?: () => void;
  /** Accessible name of the menu button. */
  menuLabel?: string;
  className?: string;
};

/** Figma "AppBar*" (477:906): logo, filters, search and a menu button on a raised bar. */
export function AppBar({ logo, children, search = {}, onMenuClick, menuLabel = 'Menu', className }: AppBarProps) {
  const { label: searchLabel = 'Search', placeholder = 'Search', className: searchClass, ...inputProps } = search || {};
  return (
    <div className={[styles.appBar, className].filter(Boolean).join(' ')}>
      <div className={styles.start}>
        {logo && <div className={styles.logo}>{logo}</div>}
        {children}
      </div>
      <div className={styles.end}>
        {search !== false && (
          <label className={[styles.search, searchClass].filter(Boolean).join(' ')}>
            <input type="search" aria-label={searchLabel} placeholder={placeholder} className={styles.input} {...inputProps} />
            <Icon name="search" size={24} color="currentColor" className={styles.searchIcon} />
          </label>
        )}
        {onMenuClick && (
          <button type="button" className={styles.menu} aria-label={menuLabel} onClick={onMenuClick}>
            <Icon name="menu" size={44} color="currentColor" />
          </button>
        )}
      </div>
    </div>
  );
}
