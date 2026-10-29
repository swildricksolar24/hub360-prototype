import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Chip.module.css';

export type ChipVariant = 'default' | 'secondary' | 'outline' | 'tiny';

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  /** Figma `Label` text property. */
  children: ReactNode;
  /**
   * Figma set family — default = "Default / …" (76px) · secondary = "Secondary / …" (36px) ·
   * outline = "Outline / …" (76px, stroked) · tiny = "Tiny / …" (24px).
   */
  variant?: ChipVariant;
  /** Icon name from the Icon component (Figma uses `arrow-up`, and `close-small` on Default / Right Icon). */
  icon?: string;
  /** Figma "Left Icon" / "Right Icon" sets. */
  iconPosition?: 'left' | 'right';
  /** Figma `State=Selected`. Rendered as a toggle button (`aria-pressed`). */
  selected?: boolean;
};

const ICON_SIZE: Record<ChipVariant, number> = { default: 24, outline: 24, secondary: 20, tiny: 16 };

export function Chip({
  children,
  variant = 'default',
  icon,
  iconPosition = 'left',
  selected,
  type = 'button',
  className,
  ...rest
}: ChipProps) {
  const iconEl = icon && <Icon name={icon} size={ICON_SIZE[variant]} color="currentColor" className={styles.icon} />;
  return (
    <button
      type={type}
      className={[styles.chip, className].filter(Boolean).join(' ')}
      data-variant={variant}
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
