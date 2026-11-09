import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Status.module.css';

export type StatusProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  /** Figma `State=Active` (true) or `State=Inactive` (false). */
  active: boolean;
  /** The word after the dot. Defaults to "Active" / "Inactive". */
  children?: ReactNode;
};

/**
 * Figma "Status" (Base, Data Table page, 3412:428): the Active / Inactive dot status for a table row. A 10px dot then
 * the word, 8px apart, Medium Regular. Active: Brand Orange Fill/Strong dot, Gray Text/Strong label. Inactive: Gray
 * Fill/Weak dot, Gray Text/Weak label. Start it at the left of its cell so the dots line up from row to row.
 */
export function Status({ active, children, className, ...rest }: StatusProps) {
  return (
    <span className={[styles.status, className].filter(Boolean).join(' ')} data-active={active || undefined} {...rest}>
      <span className={styles.dot} aria-hidden />
      {children ?? (active ? 'Active' : 'Inactive')}
    </span>
  );
}
