import { cloneElement, isValidElement, useId, useState, type ReactElement, type ReactNode } from 'react';
import styles from './Tooltip.module.css';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export type TooltipProps = {
  /** Figma `Label`. */
  label: ReactNode;
  /** The trigger: one focusable element (a button, link or input). It gets `aria-describedby`. */
  children: ReactElement<{ 'aria-describedby'?: string }>;
  /** large = Figma "Large*" (200px wide, Large text) · small = Figma "Small*" (hugs, Small text). */
  size?: 'large' | 'small';
  /** Figma `Position`: the side of the trigger the tooltip sits on. The arrow points back at the trigger. */
  position?: TooltipPosition;
  /** Keeps the tooltip visible without hover or focus (docs, onboarding). */
  open?: boolean;
  className?: string;
};

/**
 * Shows on hover and keyboard focus of the trigger (CSS `:hover` / `:focus-within`), and hides on Escape.
 */
export function Tooltip({ label, children, size = 'small', position = 'top', open = false, className }: TooltipProps) {
  const id = useId();
  const [dismissed, setDismissed] = useState(false);
  const trigger = isValidElement(children)
    ? cloneElement(children, { 'aria-describedby': [children.props['aria-describedby'], id].filter(Boolean).join(' ') })
    : children;
  return (
    <span
      className={[styles.anchor, className].filter(Boolean).join(' ')}
      data-open={open || undefined}
      data-dismissed={dismissed || undefined}
      onKeyDown={e => e.key === 'Escape' && setDismissed(true)}
      onMouseLeave={() => setDismissed(false)}
      onBlur={() => setDismissed(false)}
    >
      {trigger}
      <span role="tooltip" id={id} className={styles.tooltip} data-size={size} data-position={position}>
        {label}
      </span>
    </span>
  );
}
