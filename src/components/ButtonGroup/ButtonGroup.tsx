import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import styles from './ButtonGroup.module.css';

export type ButtonGroupProps = HTMLAttributes<HTMLDivElement> & {
  /** `ButtonGroupItem` children. */
  children: ReactNode;
  /** horizontal = Figma "Button Group / Horizontal" · vertical = "Button Group / Vertical". */
  orientation?: 'horizontal' | 'vertical';
  /** Accessible name for the group. */
  'aria-label'?: string;
};

/**
 * A row or column of joined buttons. The first and last items get the rounded outer corners
 * (Figma `Position` Left / Right or Top / Bottom); the ones in between are Center parts.
 */
export function ButtonGroup({ children, orientation = 'horizontal', className, ...rest }: ButtonGroupProps) {
  return (
    <div
      role="group"
      className={[styles.group, className].filter(Boolean).join(' ')}
      data-orientation={orientation}
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
