import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'outline' | 'brand' | 'brand-orange' | 'brand-secondary' | 'text';
export type ButtonSize = 'base' | 'small' | 'tiny';

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  children: ReactNode;
  /**
   * Figma sets per size — base: primary, outline, brand, brand-orange ·
   * small: primary, outline, brand, brand-secondary · tiny: primary, text.
   */
  variant?: ButtonVariant;
  /** base = Button Base / Block (76px) · small = Button Small (44px) · tiny = Button Tiny (32px). */
  size?: ButtonSize;
  /** Fills the container width (Figma "Button Block"). Base size only. */
  block?: boolean;
  /** Icon name from the Icon component. Not available at tiny size. */
  icon?: string;
  iconPosition?: 'left' | 'right';
  /** Figma `State=Selected`. Rendered as a toggle button (`aria-pressed`). */
  selected?: boolean;
};

const ICON_SIZE: Record<ButtonSize, number> = { base: 24, small: 20, tiny: 16 };

export function Button({
  children,
  variant = 'primary',
  size = 'base',
  block = false,
  icon,
  iconPosition = 'left',
  selected,
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  const iconEl = icon && <Icon name={icon} size={ICON_SIZE[size]} color="currentColor" />;
  return (
    <button
      type={type}
      className={[styles.button, className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-size={size}
      data-block={block || undefined}
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
