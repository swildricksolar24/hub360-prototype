import type { ReactNode } from 'react';
import styles from './Badge.module.css';

export type BadgeColor = 'amber' | 'blue' | 'green' | 'red' | 'black';

export type BadgeProps = {
  /** Usually a count. Round fits 1–2 characters; Pill grows with its content. */
  children: ReactNode;
  /** round = Figma "Round" (20px circle) · pill = Figma "Pill". */
  shape?: 'round' | 'pill';
  color?: BadgeColor;
  className?: string;
};

export function Badge({ children, shape = 'round', color = 'amber', className }: BadgeProps) {
  return (
    <span className={[styles.badge, className].filter(Boolean).join(' ')} data-shape={shape} data-color={color}>
      {children}
    </span>
  );
}
