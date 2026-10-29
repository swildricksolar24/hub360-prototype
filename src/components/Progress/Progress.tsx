import styles from './Progress.module.css';

export type ProgressProps = {
  /** Current value, from 0 to `max`. */
  value: number;
  max?: number;
  /** bar = Figma "Progress Bar*" · circle = Figma "Progress Circle". */
  variant?: 'bar' | 'circle';
  /** Figma `Style=With Percentage`: shows the rounded percentage (below the bar, inside the circle). */
  showValue?: boolean;
  /** Accessible name, e.g. "Upload progress". */
  label?: string;
  /** Bar width (number = px, or any CSS length). Figma uses 240px. Ignored for the circle. */
  width?: number | string;
  className?: string;
};

// Figma Progress Circle: 141px box, 8px stroke
const CIRCLE = 141;
const STROKE = 8;
const R = (CIRCLE - STROKE) / 2;

export function Progress({ value, max = 100, variant = 'bar', showValue = false, label = 'Progress', width, className }: ProgressProps) {
  const pct = Math.round(Math.min(100, Math.max(0, (value / max) * 100)));
  const aria = { role: 'progressbar', 'aria-label': label, 'aria-valuemin': 0, 'aria-valuemax': max, 'aria-valuenow': value, 'aria-valuetext': `${pct}%` };
  const cls = [styles.progress, className].filter(Boolean).join(' ');

  if (variant === 'circle') {
    return (
      <div className={cls} data-variant="circle" {...aria}>
        <svg className={styles.ring} viewBox={`0 0 ${CIRCLE} ${CIRCLE}`} aria-hidden>
          <circle className={styles.track} cx={CIRCLE / 2} cy={CIRCLE / 2} r={R} />
          {pct > 0 && <circle className={styles.arc} cx={CIRCLE / 2} cy={CIRCLE / 2} r={R} pathLength={100} strokeDasharray={`${pct} 100`} />}
        </svg>
        {showValue && <span className={styles.value}>{pct}%</span>}
      </div>
    );
  }

  return (
    <div className={cls} data-variant="bar" style={{ width }} {...aria}>
      <div className={styles.bar}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
      {showValue && <span className={styles.value}>{pct}%</span>}
    </div>
  );
}
