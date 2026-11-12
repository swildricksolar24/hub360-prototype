import type { ReactNode } from 'react';
import styles from './TwoLineCell.module.css';

export type TwoLineCellProps = {
  /**
   * First line (Figma: Medium/Bold, Gray Text/Strong), e.g. an item number. Pass a `Hyperlink` (or the app's `AppLink`)
   * to make it open a record: the link keeps its own look (Hyperlink small: Medium, underlined) and loses its 8px
   * block padding, so the lines stay 2px apart.
   */
  title: ReactNode;
  /**
   * Second line (Figma: Tiny/Regular, Gray Text/Weak), e.g. the item's name. One line; it ends with an ellipsis when
   * the column is narrow, and a string shows in full as a tooltip (`title` attribute).
   */
  description?: ReactNode;
  className?: string;
};

/**
 * Figma "Two Line Cell" (3520:431, - Data Table (New) page; `Type` Text / Link, from the Inventory file's Items
 * Overview Item column 914:24642): a title with a description under it, 2px apart, for a data table cell. It fills
 * its cell and can shrink with it (min-width 0).
 */
export function TwoLineCell({ title, description, className }: TwoLineCellProps) {
  const hasDescription = description !== undefined && description !== null && description !== false && description !== '';
  return (
    <span className={[styles.cell, className].filter(Boolean).join(' ')}>
      <span className={styles.title}>{title}</span>
      {hasDescription && (
        <span className={styles.description} title={typeof description === 'string' ? description : undefined}>
          {description}
        </span>
      )}
    </span>
  );
}
