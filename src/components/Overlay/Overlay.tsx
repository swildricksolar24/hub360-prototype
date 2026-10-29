import type { HTMLAttributes } from 'react';
import styles from './Overlay.module.css';

export type OverlayProps = HTMLAttributes<HTMLDivElement> & {
  /**
   * fixed = covers the viewport (Figma "Overlay", 1920×1200) · absolute = covers the nearest positioned parent.
   * Modal renders it inside its <dialog>.
   */
  position?: 'fixed' | 'absolute';
};

/** Figma "Overlay": the dimming scrim behind modals. Decorative; pass `onClick` to make it dismiss something. */
export function Overlay({ position = 'fixed', className, ...rest }: OverlayProps) {
  return <div aria-hidden className={[styles.overlay, className].filter(Boolean).join(' ')} data-position={position} {...rest} />;
}
