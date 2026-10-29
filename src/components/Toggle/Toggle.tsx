import type { InputHTMLAttributes, ReactNode } from 'react';
import styles from './Toggle.module.css';

export type ToggleSize = 'small' | 'large';

export type ToggleProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  /**
   * Figma `Label` text property ("Label" set). Without it the switch renders alone
   * (Figma "Small" / "Large" sets) and needs an `aria-label`.
   */
  label?: ReactNode;
  /** Figma `Size`: small = 54×24 track, large = 98×44 track. */
  size?: ToggleSize;
  /** Figma `Position`: which side of the label the switch sits on. */
  position?: 'left' | 'right';
  /** Wraps switch and label in a filled box (Figma "Toggle Button" set). */
  contained?: boolean;
};

/**
 * Toggle switch (Figma Toggle: Label, Large, Small, Toggle Button). Figma `State=On/Off` maps to
 * the native `checked` / `defaultChecked` state and `State=Disabled` to `disabled`.
 */
export function Toggle({ label, size = 'small', position = 'left', contained = false, className, ...inputProps }: ToggleProps) {
  const track = (
    <span className={styles.track}>
      <span className={styles.knob} />
    </span>
  );
  return (
    <label
      className={[styles.toggle, className].filter(Boolean).join(' ')}
      data-size={size}
      data-contained={contained || undefined}
    >
      <input type="checkbox" role="switch" className={styles.input} {...inputProps} />
      {position === 'left' && track}
      {label != null && <span className={styles.label}>{label}</span>}
      {position === 'right' && track}
    </label>
  );
}
