import type { ButtonHTMLAttributes } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './IconButton.module.css';

export type IconButtonSize = 'large' | 'medium' | 'small';

const resolveSize = (size: IconButtonProps['size']): IconButtonSize => {
  switch (size) {
    case 'base':
      return 'large';
    case 'compact':
      return 'medium';
    case 'tiny':
      return 'small';
    default:
      return size ?? 'large';
  }
};

/** Icon sizes from Figma: Large 32px, Medium 32px (Volt keeps the 32px glyph its 44px buttons always had), Small 18px */
const ICON: Record<IconButtonSize, number> = { large: 32, medium: 32, small: 18 };

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  /** Accessible name; the button has no visible text. */
  label: string;
  /** Icon name from the Icon component. Ignored when `number` is set. */
  icon?: string;
  /** Shows a number instead of an icon (Figma "Number", e.g. pagination). */
  number?: string | number;
  /** default = Figma "Icon" · brand = Figma "Brand". */
  variant?: 'default' | 'brand';
  /**
   * Figma's Button Icon pages: large = "Button Icon Large" (76px square, 32px icon) · medium = "Button Icon Medium"
   * (44px, beside the toolbar's 44px buttons) · small = "Button Icon Small" (32px, 18px icon, 8px corners, e.g. Tier 3
   * Collapsed / Sticky).
   * Deprecated: `base` = large (it was 80px) · `compact` = medium (it was 40px) · `tiny` = small.
   */
  size?: IconButtonSize | 'base' | 'compact' | 'tiny';
  /** Figma `State=Selected`. Rendered as a toggle button (`aria-pressed`). */
  selected?: boolean;
};

export function IconButton({
  label,
  icon = 'arrow-up',
  number,
  variant = 'default',
  size = 'large',
  selected,
  type = 'button',
  className,
  ...rest
}: IconButtonProps) {
  const sized = resolveSize(size);
  return (
    <button
      type={type}
      className={[styles.iconButton, className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-size={sized}
      aria-label={label}
      aria-pressed={selected}
      {...rest}
    >
      {number !== undefined ? <span className={styles.number}>{number}</span> : <Icon name={icon} size={ICON[sized]} color="currentColor" />}
    </button>
  );
}
