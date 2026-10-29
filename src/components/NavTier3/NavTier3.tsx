import { Fragment, type ReactNode } from 'react';
import { Breadcrumb, type BreadcrumbItem } from '../Breadcrumb/Breadcrumb';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import { IconButton } from '../IconButton/IconButton';
import { SubMenu, type SubMenuItem } from '../SubMenu/SubMenu';
import styles from './NavTier3.module.css';

/* ---------- Tier 3 Label / Labels ---------- */

export type NavTier3LabelProps = {
  /** Figma `Label` text property (shown with a trailing colon). */
  label: string;
  /** Figma `Value` text property (bold). */
  value: ReactNode;
};

/** Figma "Tier 3 Label" (2642:3631): "Label: **Value**". */
export function NavTier3Label({ label, value }: NavTier3LabelProps) {
  return (
    <span className={styles.labelItem}>
      <span>{label}:</span>
      <strong className={styles.labelValue}>{value}</strong>
    </span>
  );
}

export type NavTier3LabelsProps = { items: NavTier3LabelProps[]; className?: string };

/** Figma "Tier 3 Labels" (2642:3610): label/value pairs separated by "|" (`Labels` 1–4). */
export function NavTier3Labels({ items, className }: NavTier3LabelsProps) {
  return (
    <p className={[styles.labels, className].filter(Boolean).join(' ')} data-many={items.length >= 4 || undefined}>
      {items.map((item, i) => (
        <Fragment key={`${item.label}-${i}`}>
          {i > 0 && (
            <span className={styles.labelSeparator} aria-hidden="true">
              |
            </span>
          )}
          <NavTier3Label {...item} />
        </Fragment>
      ))}
    </p>
  );
}

/* ---------- Tier 3 Icon ---------- */

export type NavTier3IconProps = {
  /** Icon name from the Icon component (Figma: warehouse). */
  icon: string;
  /** Figma `Size`: large = 98px circle (Expanded) · small = 62px circle (Collapsed). */
  size?: 'large' | 'small';
  /** Shows the "View Photo" button on hover and focus (Figma `State=Hover`). */
  onViewPhoto?: () => void;
  viewPhotoLabel?: string;
  className?: string;
};

/** Figma "Tier 3 Icon" (2648:4086): the record's icon in a circle, with an optional "View Photo" action. */
export function NavTier3Icon({ icon, size = 'large', onViewPhoto, viewPhotoLabel = 'View Photo', className }: NavTier3IconProps) {
  return (
    <span className={[styles.recordIcon, className].filter(Boolean).join(' ')} data-size={size}>
      <Icon name={icon} size={size === 'large' ? 65 : 41} color="currentColor" />
      {onViewPhoto && (
        <Button className={styles.viewPhoto} size="tiny" variant="brand" onClick={onViewPhoto}>
          {viewPhotoLabel}
        </Button>
      )}
    </span>
  );
}

/* ---------- Tier 3 ---------- */

export type NavTier3Props = {
  /** Record name (Figma: "WAREHOUSE", Heading 2 / Bold). */
  title: ReactNode;
  /** Record icon (Tier 3 Icon). */
  icon: string;
  onViewPhoto?: () => void;
  /** Figma `State=Collapsed`: one row with the small icon, title, sub menu and actions. */
  collapsed?: boolean;
  /** Shows the expand / collapse button (double chevron) at the end of the actions. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Breadcrumb trail (Expanded only). */
  breadcrumb?: BreadcrumbItem[];
  homeHref?: string;
  /** Shows the back button before the breadcrumb (Expanded only). */
  onBack?: () => void;
  /** Element after the title, e.g. a Tag (Figma: Tag "Tiny / Icon Left"). Expanded only. */
  tag?: ReactNode;
  /** Label/value pairs under the title (Tier 3 Labels). Expanded only. */
  labels?: NavTier3LabelProps[];
  /** Controls at the top right: Figma shows a Toggle Button, an "Actions" dropdown, a brand Save button and previous / next Icon buttons. */
  actions?: ReactNode;
  /** Text under the actions, e.g. "Last Modified: May 18, 2026". Expanded only. */
  meta?: ReactNode;
  /** Section buttons (Sub Menu, Default). */
  items?: SubMenuItem[];
  value?: string;
  onChange?: (id: string) => void;
  className?: string;
};

/** Figma Main Nav "Tier 3" (2644:3738): the record header card above a detail page. */
export function NavTier3({
  title,
  icon,
  onViewPhoto,
  collapsed = false,
  onCollapsedChange,
  breadcrumb,
  homeHref,
  onBack,
  tag,
  labels,
  actions,
  meta,
  items,
  value,
  onChange,
  className,
}: NavTier3Props) {
  const actionRow = (
    <div className={styles.actions}>
      {actions}
      {onCollapsedChange && (
        <IconButton
          size="compact"
          /* Figma: Expanded shows Double Down, Collapsed shows Double Up */
          icon={collapsed ? 'chevron-double-up' : 'chevron-double-down'}
          label={collapsed ? 'Expand header' : 'Collapse header'}
          aria-expanded={!collapsed}
          onClick={() => onCollapsedChange(!collapsed)}
        />
      )}
    </div>
  );
  const subMenu = items && items.length > 0 && (
    <SubMenu items={items} value={value} onChange={onChange} variant="default" aria-label="Record sections" />
  );

  if (collapsed) {
    return (
      <section className={[styles.tier3, className].filter(Boolean).join(' ')} data-collapsed="">
        <div className={styles.identity}>
          <NavTier3Icon icon={icon} size="small" onViewPhoto={onViewPhoto} />
          <h1 className={[styles.title, styles.titleCollapsed].join(' ')}>{title}</h1>
        </div>
        {subMenu}
        {actionRow}
      </section>
    );
  }

  return (
    <section className={[styles.tier3, className].filter(Boolean).join(' ')}>
      <div className={styles.top}>
        <div className={styles.trail}>
          {onBack && <IconButton size="compact" icon="arrow-left" label="Back" onClick={onBack} />}
          {breadcrumb && <Breadcrumb size="small" items={breadcrumb} homeHref={homeHref} />}
        </div>
        <div className={styles.end}>
          {actionRow}
          {meta && <p className={styles.meta}>{meta}</p>}
        </div>
      </div>
      <div className={styles.identity} data-expanded="">
        <NavTier3Icon icon={icon} size="large" onViewPhoto={onViewPhoto} />
        <div className={styles.heading}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{title}</h1>
            {tag}
          </div>
          {labels && labels.length > 0 && <NavTier3Labels items={labels} />}
        </div>
      </div>
      {subMenu}
    </section>
  );
}
