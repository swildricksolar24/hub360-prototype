import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import styles from './ButtonGroup.module.css';

export type ButtonGroupSize = 'large' | 'medium' | 'small';

export type ButtonGroupProps = HTMLAttributes<HTMLDivElement> & {
  /** `ButtonGroupItem` children. */
  children: ReactNode;
  /** horizontal = Figma "Button Group / Horizontal" · vertical = "Button Group / Vertical". */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Figma `Size` (Large / Medium / Small, renamed Nov 24, 2026 from Default / Small / Tiny):
   * large = 24px × 40px padding, Heading 4 text, 76px tall ·
   * medium = the toolbar size beside Button Medium and Dropdown `size="medium"`: 12px × 20px padding, Medium text, 44px ·
   * small = beside the 32px controls (Button `small`, Dropdown `size="small"`, Toggle `small`): 8px × 12px padding, Tiny
   * text, 8px outer corners, 32px. Medium and Small are horizontal only in Figma.
   * Deprecated: `default` = large, `tiny` = small. (`small` used to mean 44px; that is now `medium`.)
   */
  size?: ButtonGroupSize | 'default' | 'tiny';
  /** Accessible name for the group. */
  'aria-label'?: string;
};

/**
 * A row or column of joined buttons. The first and last items get the rounded outer corners
 * (Figma `Position` Left / Right or Top / Bottom); the ones in between are Center parts. Used as a switch
 * (Overview | Stock), give the chosen part `aria-pressed="true"`: it fills with Brand Teal and white text.
 */
export function ButtonGroup({ children, orientation = 'horizontal', size = 'large', className, ...rest }: ButtonGroupProps) {
  // The deprecated names: default = large, tiny = small
  const sized: ButtonGroupSize = size === 'default' ? 'large' : size === 'tiny' ? 'small' : size;
  return (
    <div
      role="group"
      className={[styles.group, className].filter(Boolean).join(' ')}
      data-orientation={orientation}
      data-size={sized}
      {...rest}
    >
      {children}
    </div>
  );
}

export type ButtonGroupItemProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  /** Figma `Label` text of the part. */
  children: ReactNode;
};

/** One part of a ButtonGroup (Figma "Part - Horizontal" / "Part - Vertical"). */
export function ButtonGroupItem({ children, type = 'button', className, ...rest }: ButtonGroupItemProps) {
  return (
    <button type={type} className={[styles.item, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </button>
  );
}
