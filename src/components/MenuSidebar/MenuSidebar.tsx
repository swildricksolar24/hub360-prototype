import type { ButtonHTMLAttributes } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './MenuSidebar.module.css';

export type MenuSidebarItemProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  /** Figma `Label` text property. */
  label: string;
  /** Icon name from the Icon component (48px). Figma uses `chevron-left` for a "back" row. */
  icon?: string;
};

/** Figma "Menu Sidebar Item" (490:750): a 72px row with a 48px icon and a Heading 4 label. */
export function MenuSidebarItem({ label, icon = 'account', type = 'button', className, ...rest }: MenuSidebarItemProps) {
  return (
    <button type={type} className={[styles.item, className].filter(Boolean).join(' ')} {...rest}>
      <Icon name={icon} size={48} color="currentColor" className={styles.icon} />
      <span className={styles.label}>{label}</span>
    </button>
  );
}

export type MenuSidebarProps = {
  /** The rows, top to bottom. Each takes the Menu Sidebar Item props (label, icon, onClick, disabled…). */
  items: (MenuSidebarItemProps & { id: string })[];
  /** Accessible name of the `<nav>` landmark. */
  'aria-label'?: string;
  className?: string;
};

/** Figma "Menu Sidebar*" (490:809): a stack of Menu Sidebar Items. Fills its container's width. */
export function MenuSidebar({ items, 'aria-label': ariaLabel = 'Menu', className }: MenuSidebarProps) {
  return (
    <nav aria-label={ariaLabel} className={[styles.sidebar, className].filter(Boolean).join(' ')}>
      <ul className={styles.list}>
        {items.map(({ id, ...item }) => (
          <li key={id}>
            <MenuSidebarItem {...item} />
          </li>
        ))}
      </ul>
    </nav>
  );
}
