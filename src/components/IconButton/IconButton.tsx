import type { ButtonHTMLAttributes } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './IconButton.module.css';

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  /** Accessible name; the button has no visible text. */
  label: string;
  /** Icon name from the Icon component. Ignored when `number` is set. */
  icon?: string;
  /** Shows a number instead of an icon (Figma "Number", e.g. pagination). */
  number?: string | number;
  /** default = Figma "Icon" · brand = Figma "Brand". */
  variant?: 'default' | 'brand';
  /** base = 80px (Figma) · compact = 40px, as used by Message's close button. */
  /**
   * small = 44px, the height of the Small buttons beside it (Figma Tier 3 Expanded's icon buttons) · tiny = 32px with an
   * 18px icon (Figma "Button Icon Tiny" › Icon, e.g. Tier 3 Collapsed / Sticky).
   */
  size?: 'base' | 'compact' | 'small' | 'tiny';
  /** Figma `State=Selected`. Rendered as a toggle button (`aria-pressed`). */
  selected?: boolean;
};

export function IconButton({
  label,
  icon = 'arrow-up',
  number,
  variant = 'default',
  size = 'base',
  selected,
  type = 'button',
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={[styles.iconButton, className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-size={size}
      aria-label={label}
      aria-pressed={selected}
      {...rest}
    >
      {number !== undefined ? <span className={styles.number}>{number}</span> : <Icon name={icon} size={size === 'tiny' ? 18 : 32} color="currentColor" />}
    </button>
  );
}
