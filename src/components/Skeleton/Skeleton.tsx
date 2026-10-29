import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

export type SkeletonShape = 'circle' | 'square' | 'bar' | 'block';

export type SkeletonProps = {
  /** Figma `Shape`: circle / square (100×100) · bar (360×40) · block (360×200). */
  shape?: SkeletonShape;
  /** Overrides the Figma width (number = px, or any CSS length such as `100%`). */
  width?: number | string;
  /** Overrides the Figma height. */
  height?: number | string;
  className?: string;
};

/**
 * Loading placeholder. It is decorative (`aria-hidden`); mark the loading region with `aria-busy` instead.
 */
export function Skeleton({ shape = 'bar', width, height, className }: SkeletonProps) {
  const style: CSSProperties = { width, height };
  return <span aria-hidden className={[styles.skeleton, className].filter(Boolean).join(' ')} data-shape={shape} style={style} />;
}
