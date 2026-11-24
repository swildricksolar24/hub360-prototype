import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Chip.module.css';

export type ChipVariant = 'default' | 'secondary' | 'outline';
export type ChipSize = 'large' | 'medium' | 'small';

/** The Figma family drawn: each Chip family exists at one size (Large: Default, Outline · Medium: Secondary · Small). */
type ChipFamily = 'default' | 'outline' | 'secondary' | 'small';

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  /** Figma `Label` text property. */
  children: ReactNode;
  /**
   * Figma set family at the Large size — default = "Default / …" (76px) · outline = "Outline / …" (76px, stroked).
   * secondary = "Secondary / …" (36px, the Medium size). Deprecated: `tiny` = `size="small"`.
   */
  variant?: ChipVariant | 'tiny';
  /**
   * large = Default / Outline (76px) · medium = Secondary (36px) · small = "Small / …" (24px, was "Tiny / …").
   * Figma has each family at one size only, so `size` picks the family: medium is always Secondary, small has one look.
   */
  size?: ChipSize;
  /** Icon name from the Icon component (Figma uses `arrow-up`, and `close-small` on Default / Right Icon). */
  icon?: string;
  /** Figma "Left Icon" / "Right Icon" sets. */
  iconPosition?: 'left' | 'right';
  /** Figma `State=Selected`. Rendered as a toggle button (`aria-pressed`). */
  selected?: boolean;
};

const ICON_SIZE: Record<ChipFamily, number> = { default: 24, outline: 24, secondary: 20, small: 16 };

const familyOf = (variant: ChipProps['variant'], size: ChipSize | undefined): ChipFamily => {
  if (size === 'small' || variant === 'tiny') return 'small';
  if (size === 'medium' || variant === 'secondary') return 'secondary';
  return variant === 'outline' ? 'outline' : 'default';
};

export function Chip({
  children,
  variant = 'default',
  size,
  icon,
  iconPosition = 'left',
  selected,
  type = 'button',
  className,
  ...rest
}: ChipProps) {
  const family = familyOf(variant, size);
  const iconEl = icon && <Icon name={icon} size={ICON_SIZE[family]} color="currentColor" className={styles.icon} />;
  return (
    <button
      type={type}
      className={[styles.chip, className].filter(Boolean).join(' ')}
      data-variant={family}
      data-icon={icon ? iconPosition : undefined}
      aria-pressed={selected}
      {...rest}
    >
      {iconPosition === 'left' && iconEl}
      <span className={styles.label}>{children}</span>
      {iconPosition === 'right' && iconEl}
    </button>
  );
}
