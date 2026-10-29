import type { ReactNode } from 'react';
import { Button } from '../Button/Button';
import styles from './SubMenu.module.css';

export type SubMenuVariant = 'default' | 'tiny' | 'text';

export type SubMenuItem = { id: string; label: ReactNode; disabled?: boolean };

export type SubMenuProps = {
  items: SubMenuItem[];
  /** Id of the selected item (Figma Button `State=Selected`). */
  value?: string;
  onChange?: (id: string) => void;
  /**
   * Figma `State` — default: Button Small / Primary (gap 12) · tiny: Button Tiny / Primary (gap 8) ·
   * text: Button Tiny / Text (gap 8).
   */
  variant?: SubMenuVariant;
  /** Accessible name of the `<nav>` landmark. */
  'aria-label'?: string;
  className?: string;
};

const BUTTON = {
  default: { size: 'small', variant: 'primary' },
  tiny: { size: 'tiny', variant: 'primary' },
  text: { size: 'tiny', variant: 'text' },
} as const;

/** Figma Interior Nav "Sub Menu": a row of buttons that switch between the sections of a page. */
export function SubMenu({ items, value, onChange, variant = 'default', 'aria-label': ariaLabel = 'Sub menu', className }: SubMenuProps) {
  return (
    <nav aria-label={ariaLabel} className={[styles.subMenu, className].filter(Boolean).join(' ')} data-variant={variant}>
      <ul className={styles.list}>
        {items.map(item => (
          <li key={item.id}>
            <Button
              {...BUTTON[variant]}
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
