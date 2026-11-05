import type { ReactNode } from 'react';
import { Button } from '../Button/Button';
import styles from './NavTier4.module.css';

export type NavTier4Item = {
  id: string;
  /** Button text, e.g. "Overview". */
  label: string;
};

export type NavTier4Props = {
  /** Accessible name of the view buttons, e.g. "Warehouse views". */
  'aria-label': string;
  /** The views, as buttons on the left (Figma: Overview, Part, Assembly, Kit, Stock). */
  items: NavTier4Item[];
  /** The view that's showing. Its button is drawn selected (Figma Button `State=Selected`). */
  activeId: string;
  /** Called with a view's id when its button is clicked. */
  onSelect: (id: string) => void;
  /**
   * Controls for the view, after a divider in their own panel: Figma's "Table View" variants put View All, Columns,
   * Upload, Actions, a search box and Add New here. Leave it out for the "Overview" variant (buttons only).
   */
  toolbar?: ReactNode;
  className?: string;
};

/**
 * Figma "Tier 4" (- Tier 4 page): the bar under a record's Tier 3 header that switches between its views, with an
 * optional toolbar for the view on the right. The view buttons are the design-system Button (Small › Primary); the
 * selected one has `aria-pressed="true"`. Toolbar controls should be the small sizes too (44px).
 */
export function NavTier4({ 'aria-label': ariaLabel, items, activeId, onSelect, toolbar, className }: NavTier4Props) {
  return (
    <div className={[styles.bar, className].filter(Boolean).join(' ')}>
      <div role="group" aria-label={ariaLabel} className={styles.items}>
        {items.map(item => (
          <Button key={item.id} variant="primary" size="small" selected={item.id === activeId} onClick={() => onSelect(item.id)}>
            {item.label}
          </Button>
        ))}
      </div>
      {toolbar != null && (
        <>
          <span className={styles.divider} aria-hidden="true" />
          <div className={styles.toolbar}>{toolbar}</div>
        </>
      )}
    </div>
  );
}
