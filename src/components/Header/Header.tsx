import type { InputHTMLAttributes, ReactNode } from 'react';
import { Badge } from '../Badge/Badge';
import { Icon } from '../Icon/Icon';
import { IconButton } from '../IconButton/IconButton';
import styles from './Header.module.css';

export type HeaderAction = {
  id: string;
  /** Icon name from the Icon component (Figma: notification, chat, email, question-mark-help). */
  icon: string;
  /** Accessible name of the button. */
  label: string;
  /** Unread count shown as a red Round Badge (Figma `State=Notifications`). Hidden when 0 or unset. */
  count?: number;
  disabled?: boolean;
  onClick?: () => void;
};

export type HeaderProps = {
  /** Figma "Logo Side" instance. Pass the Logo component (or any mark). */
  logo?: ReactNode;
  /** Props for the search field (placeholder, value, onChange…). Pass `false` to hide it. */
  search?: (InputHTMLAttributes<HTMLInputElement> & { label?: string }) | false;
  /** Icon buttons right of the search (Figma: Button Icon › Icon, 48px). */
  actions?: HeaderAction[];
  /** Figma Avatar "Medium" (62px) at the far right. Pass an Avatar or any element. */
  avatar?: ReactNode;
  className?: string;
};

/** Figma Main Nav "Header" (708:1883): logo, search, action buttons with counts, and the user avatar. */
export function Header({ logo, search = {}, actions = [], avatar, className }: HeaderProps) {
  const { label: searchLabel = 'Search', placeholder = 'Search', className: searchClass, ...inputProps } = search || {};
  return (
    <header className={[styles.header, className].filter(Boolean).join(' ')}>
      <div className={styles.main}>
        {logo && <div className={styles.logo}>{logo}</div>}
        {search !== false && (
          <label className={[styles.search, searchClass].filter(Boolean).join(' ')}>
            <Icon name="search" size={20} color="currentColor" className={styles.searchIcon} />
            <input type="search" aria-label={searchLabel} placeholder={placeholder} className={styles.input} {...inputProps} />
          </label>
        )}
        {actions.length > 0 && (
          <div className={styles.actions}>
            {actions.map(a => (
              <span key={a.id} className={styles.actionWrap}>
                <IconButton
                  className={styles.action}
                  icon={a.icon}
                  label={a.count ? `${a.label}, ${a.count} new` : a.label}
                  disabled={a.disabled}
                  onClick={a.onClick}
                />
                {!!a.count && (
                  <span className={styles.count} aria-hidden="true">
                    <Badge shape="round" color="red">
                      {a.count}
                    </Badge>
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
      {avatar && <div className={styles.avatar}>{avatar}</div>}
    </header>
  );
}
