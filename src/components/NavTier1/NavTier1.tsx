import type { ReactNode } from 'react';
import { Breadcrumb, type BreadcrumbItem } from '../Breadcrumb/Breadcrumb';
import { Button } from '../Button/Button';
import { SideMenuButton } from '../SideMenuButton/SideMenuButton';
import { SubMenu, type SubMenuItem } from '../SubMenu/SubMenu';
import styles from './NavTier1.module.css';

export type NavItem = { id: string; label: string; icon: string; disabled?: boolean };

/* ---------- Tier 1 ---------- */

export type NavTier1Props = {
  /** Top-level app sections (Figma: Dashboard, Tasks, Schedule, Sites, Accounts, Projects, Service, Sales, Reports, Users, Settings). */
  items: NavItem[];
  /** Id of the current section (Side Menu button `State=Selected`). */
  value?: string;
  onChange?: (id: string) => void;
  /** Figma `State=Compact`: 32px icon-only buttons in a 48px rail. Default: 64px icon + label buttons in a 96px rail. */
  compact?: boolean;
  /** Accessible name of the `<nav>` landmark. */
  'aria-label'?: string;
  className?: string;
};

/** Figma Main Nav "Tier 1" (708:1635): the app's primary side rail of Tier 1 Side Menu buttons. */
export function NavTier1({ items, value, onChange, compact = false, 'aria-label': ariaLabel = 'Main', className }: NavTier1Props) {
  return (
    <nav aria-label={ariaLabel} className={[styles.tier1, className].filter(Boolean).join(' ')} data-compact={compact || undefined}>
      <ul className={styles.list}>
        {items.map(item => (
          <li key={item.id} className={styles.item}>
            <SideMenuButton
              tier={1}
              variant={compact ? 'compact' : 'default'}
              icon={item.icon}
              label={item.label}
              selected={item.id === value}
              disabled={item.disabled}
              onClick={() => onChange?.(item.id)}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ---------- Side Sub Menu ---------- */

export type SideSubMenuProps = {
  /** Figma `Title` text property. */
  title: ReactNode;
  /** Rows (Figma: Button Small › Primary / Icon, full width). */
  items: NavItem[];
  value?: string;
  onChange?: (id: string) => void;
  'aria-label'?: string;
  className?: string;
};

/** Figma Main Nav "Side Sub Menu" (2131:4190): a titled column of full-width small icon buttons. */
export function SideSubMenu({ title, items, value, onChange, 'aria-label': ariaLabel, className }: SideSubMenuProps) {
  return (
    <nav
      aria-label={ariaLabel ?? (typeof title === 'string' ? title : 'Sub menu')}
      className={[styles.sideSub, className].filter(Boolean).join(' ')}
    >
      <h2 className={styles.title}>{title}</h2>
      <ul className={styles.subList}>
        {items.map(item => (
          <li key={item.id}>
            <Button
              className={styles.subItem}
              size="small"
              variant="primary"
              icon={item.icon}
              selected={item.id === value}
              disabled={item.disabled}
              onClick={() => onChange?.(item.id)}
            >
              {item.label}
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ---------- Top Navigation ---------- */

export type TopNavigationSize = 'large' | 'medium' | 'small';

export type TopNavigationProps = {
  /** Breadcrumb trail shown above the sub menu (Figma: Breadcrumb › Default). */
  breadcrumb: BreadcrumbItem[];
  homeHref?: string;
  /** Sub Menu buttons. */
  items: SubMenuItem[];
  value?: string;
  onChange?: (id: string) => void;
  /** Figma `Size` — large: Sub Menu Default · medium: Sub Menu Tiny · small: Sub Menu Text. */
  size?: TopNavigationSize;
  'aria-label'?: string;
  className?: string;
};

const SUB_MENU_VARIANT = { large: 'default', medium: 'tiny', small: 'text' } as const;

/** Figma Main Nav "Top Navigation" (2172:4052): breadcrumb over a Sub Menu, on an overlay card. */
export function TopNavigation({
  breadcrumb,
  homeHref,
  items,
  value,
  onChange,
  size = 'large',
  'aria-label': ariaLabel = 'Section',
  className,
}: TopNavigationProps) {
  return (
    <div className={[styles.topNav, className].filter(Boolean).join(' ')} data-size={size}>
      <Breadcrumb size="small" items={breadcrumb} homeHref={homeHref} />
      <SubMenu items={items} value={value} onChange={onChange} variant={SUB_MENU_VARIANT[size]} aria-label={ariaLabel} />
    </div>
  );
}
