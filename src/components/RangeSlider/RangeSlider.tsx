import { useState, type CSSProperties, type InputHTMLAttributes } from 'react';
import styles from './RangeSlider.module.css';

export type RangeSliderProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'step'
> & {
  /** Accessible name. Figma has no visible label. */
  label: string;
  min?: number;
  max?: number;
  step?: number;
  /** Controlled value. */
  value?: number;
  /** Initial value when uncontrolled. */
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /**
   * Scale labels under the track (Figma shows $0, $25, $50, $75, $100).
   * Pass `true` for five evenly spaced marks, or the values to label.
   */
  marks?: boolean | number[];
  /** Formats mark labels and the announced value, e.g. `v => '$' + v`. */
  format?: (value: number) => string;
};

/**
 * Range Slider (Figma "Range Slider*"). A native range input drives the drawn track,
 * so keyboard, pointer and screen-reader behavior are the browser's. Figma `State=Active`
 * is the thumb while dragged or keyboard-focused.
 */
export function RangeSlider({
  label,
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue,
  onValueChange,
  marks = true,
  format = String,
  className,
  style,
  disabled,
  ...inputProps
}: RangeSliderProps) {
  const controlled = value !== undefined;
  const [draft, setDraft] = useState(defaultValue ?? (min + max) / 2);
  const current = controlled ? value : draft;
  const pct = max > min ? ((current - min) / (max - min)) * 100 : 0;
  const markValues = marks === true ? [0, 1, 2, 3, 4].map(i => min + ((max - min) * i) / 4) : marks || [];

  return (
    <div
      className={[styles.slider, className].filter(Boolean).join(' ')}
      style={{ ...style, '--pct': `${pct}%` } as CSSProperties}
      data-disabled={disabled || undefined}
    >
      <div className={styles.rail}>
        <div className={styles.track} />
        <div className={styles.range} />
        <div className={styles.thumb} />
        <input
          type="range"
          className={styles.input}
          aria-label={label}
          aria-valuetext={format(current)}
          min={min}
          max={max}
          step={step}
          value={current}
          disabled={disabled}
          onChange={e => {
            const next = Number(e.target.value);
            if (!controlled) setDraft(next);
            onValueChange?.(next);
          }}
          {...inputProps}
        />
      </div>
      {markValues.length > 0 && (
        <div className={styles.marks} aria-hidden="true">
          {markValues.map(m => (
            <span key={m}>{format(m)}</span>
          ))}
        </div>
      )}
    </div>
  );
}
