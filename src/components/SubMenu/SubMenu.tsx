import type { ReactNode } from 'react';
import { Button } from '../Button/Button';
import styles from './SubMenu.module.css';

/** Figma Sub Menu `State`: Medium (was Default) · Small (was Tiny) · Text. */
export type SubMenuVariant = 'medium' | 'small' | 'text';

export type SubMenuItem = { id: string; label: ReactNode; disabled?: boolean };

export type SubMenuProps = {
  items: SubMenuItem[];
  /** Id of the selected item (Figma Button `State=Selected`). */
  value?: string;
  onChange?: (id: string) => void;
  /**
   * Figma `State` — medium: Button Medium (44px) / Primary (gap 12) · small: Button Small (32px) / Primary (gap 8) ·
   * text: Button Small / Text (gap 8). Deprecated: `default` = medium, `tiny` = small.
   */
  variant?: SubMenuVariant | 'default' | 'tiny';
  /** Accessible name of the `<nav>` landmark. */
  'aria-label'?: string;
  /** Extra item at the end of the row, e.g. a "More" menu for the buttons that don't fit (NavTier3). */
  trailing?: ReactNode;
  className?: string;
};

const BUTTON = {
  medium: { size: 'medium', variant: 'primary' },
  small: { size: 'small', variant: 'primary' },
  text: { size: 'small', variant: 'text' },
} as const;

/** Figma Interior Nav "Sub Menu": a row of buttons that switch between the sections of a page. */
export function SubMenu({ items, value, onChange, variant: variantProp = 'medium', 'aria-label': ariaLabel = 'Sub menu', trailing, className }: SubMenuProps) {
  const variant: SubMenuVariant = variantProp === 'default' ? 'medium' : variantProp === 'tiny' ? 'small' : variantProp;
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
        {trailing && <li>{trailing}</li>}
      </ul>
    </nav>
  );
}
