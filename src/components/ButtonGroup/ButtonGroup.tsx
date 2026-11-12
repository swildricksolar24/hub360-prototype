import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import styles from './ButtonGroup.module.css';

export type ButtonGroupProps = HTMLAttributes<HTMLDivElement> & {
  /** `ButtonGroupItem` children. */
  children: ReactNode;
  /** horizontal = Figma "Button Group / Horizontal" · vertical = "Button Group / Vertical". */
  orientation?: 'horizontal' | 'vertical';
  /**
   * default = Figma's parts (24px × 40px padding, Heading 4 text, 76px tall). small = Figma `Size=Small`, the toolbar
   * size, matching Button Small and Dropdown `small`: 12px × 20px padding, Medium text, 44px tall.
   */
  size?: 'default' | 'small';
  /** Accessible name for the group. */
  'aria-label'?: string;
};

/**
 * A row or column of joined buttons. The first and last items get the rounded outer corners
 * (Figma `Position` Left / Right or Top / Bottom); the ones in between are Center parts. Used as a switch
 * (Overview | Stock), give the chosen part `aria-pressed="true"`: it fills with Brand Teal and white text.
 */
export function ButtonGroup({ children, orientation = 'horizontal', size = 'default', className, ...rest }: ButtonGroupProps) {
  return (
    <div
      role="group"
      className={[styles.group, className].filter(Boolean).join(' ')}
      data-orientation={orientation}
      data-size={size}
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
