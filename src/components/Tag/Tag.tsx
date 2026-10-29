import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Tag.module.css';

export type TagVariant = 'default' | 'outline' | 'small' | 'tiny';

export type TagProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  /** Figma `Label` text property. */
  children: ReactNode;
  /**
   * Figma set — default = "Default*" (76px) · outline = "Outline*" (76px, stroked) ·
   * small = "Small" (36px) · tiny = "Tiny" (24px).
   */
  variant?: TagVariant;
  /** Figma `State=Selected`. Rendered as a toggle button (`aria-pressed`). */
  selected?: boolean;
};

/** A selectable pill without an icon. For a pill with an icon, use Chip. */
export function Tag({ children, variant = 'default', selected, type = 'button', className, ...rest }: TagProps) {
  return (
    <button
      type={type}
      className={[styles.tag, className].filter(Boolean).join(' ')}
      data-variant={variant}
      aria-pressed={selected}
      {...rest}
    >
      {children}
    </button>
  );
}
