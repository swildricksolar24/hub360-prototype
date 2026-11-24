import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Button.module.css';

export type ButtonVariant =
  | 'primary'
  | 'outline'
  | 'brand'
  | 'brand-outline'
  | 'brand-orange'
  | 'orange-outline'
  | 'gray-outline'
  | 'brand-red'
  | 'red-outline'
  | 'brand-secondary'
  | 'text';
/** Figma's Button pages: Large (76px), Medium (44px), Small (32px). */
export type ButtonSize = 'large' | 'medium' | 'small';

const resolveSize = (size: ButtonProps['size']): ButtonSize => {
  switch (size) {
    case 'base':
      return 'large';
    case 'tiny':
      return 'small';
    default:
      return size ?? 'large';
  }
};

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  children: ReactNode;
  /**
   * Figma sets per size — large ("- Button Large (76px)"): primary (Solid / Gray / Base), outline (Clear / Base),
   * brand (Solid / Teal / Base), brand-orange (Solid / Orange / Base), brand-outline (Solid / Teal / Outline),
   * orange-outline (Solid / Orange / Outline), gray-outline (Solid / Gray / Outline); the last two exist at large only ·
   * medium ("- Button Medium (44px)"): primary, outline, brand, brand-outline, brand-red (Solid / Red / Base: destructive
   * and error actions, e.g. Deactivate, Delete), red-outline (Clear / Red: a secondary destructive action, e.g. Remove
   * from Warehouse; medium only), brand-secondary · small ("- Button Small (32px)"): primary, text, brand.
   */
  variant?: ButtonVariant;
  /**
   * large = Button Large / Block (76px) · medium = Button Medium (44px, the toolbar size) · small = Button Small (32px).
   * Deprecated: `base` = large, `tiny` = small.
   */
  size?: ButtonSize | 'base' | 'tiny';
  /** Fills the container width (Figma "Button Block"). Large size only. */
  block?: boolean;
  /** Icon name from the Icon component. Not available at the small size. */
  icon?: string;
  iconPosition?: 'left' | 'right';
  /** Figma `State=Selected`. Rendered as a toggle button (`aria-pressed`). */
  selected?: boolean;
};

const ICON_SIZE: Record<ButtonSize, number> = { large: 24, medium: 20, small: 16 };

export function Button({
  children,
  variant = 'primary',
  size = 'large',
  block = false,
  icon,
  iconPosition = 'left',
  selected,
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  const sized = resolveSize(size);
  const iconEl = icon && <Icon name={icon} size={ICON_SIZE[sized]} color="currentColor" />;
  return (
    <button
      type={type}
      className={[styles.button, className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-size={sized}
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
