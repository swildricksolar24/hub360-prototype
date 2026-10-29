import { SideMenuButton } from '../SideMenuButton/SideMenuButton';
import styles from './NavTier2.module.css';

export type NavTier2Item = { id: string; label: string; icon: string; disabled?: boolean };

export type NavTier2Variant = 'default' | 'collapsed' | 'label';

export type NavTier2Props = {
  /** Sections of the current Tier 1 area (Figma: HubSight, Dashboard, Warehouses, Items, …). */
  items: NavTier2Item[];
  /** Id of the current section (Side Menu button `State=Selected`). */
  value?: string;
  onChange?: (id: string) => void;
  /**
   * Figma `State` — default: Tier 2 / Default buttons (icon + label) · collapsed: Tier 2 / Compact (icon only) ·
   * label: Tier 2 / Label (text only).
   */
  variant?: NavTier2Variant;
  /** Accessible name of the `<nav>` landmark. */
  'aria-label'?: string;
  className?: string;
};

const BUTTON_VARIANT = { default: 'default', collapsed: 'compact', label: 'label' } as const;

/** Figma Main Nav "Tier 2" (708:1647): the secondary side rail on the sunken surface. */
export function NavTier2({ items, value, onChange, variant = 'default', 'aria-label': ariaLabel = 'Section', className }: NavTier2Props) {
  return (
    <nav aria-label={ariaLabel} className={[styles.tier2, className].filter(Boolean).join(' ')} data-variant={variant}>
      <ul className={styles.list}>
        {items.map(item => (
          <li key={item.id} className={styles.item}>
            <SideMenuButton
              className={styles.button}
              tier={2}
              variant={BUTTON_VARIANT[variant]}
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
