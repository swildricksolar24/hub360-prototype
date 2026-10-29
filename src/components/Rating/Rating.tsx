import type { ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Rating.module.css';

export type RatingProps = {
  /** Score from 0 to `max`, rounded to the nearest half star. Figma shows 3.5. */
  value: number;
  /** Number of stars. Figma shows 5. */
  max?: number;
  /** Figma `Label` text shown under the stars. Optional. */
  label?: ReactNode;
  className?: string;
};

/** Read-only star rating (Figma "Rating"). Stars use the Rating, Rating Half and Rating Hollow icons. */
export function Rating({ value, max = 5, label, className }: RatingProps) {
  const rounded = Math.min(max, Math.max(0, Math.round(value * 2) / 2));
  const stars = Array.from({ length: max }, (_, i) =>
    rounded >= i + 1 ? 'rating' : rounded >= i + 0.5 ? 'rating-half' : 'rating-hollow',
  );
  return (
    <div className={[styles.rating, className].filter(Boolean).join(' ')}>
      <div className={styles.stars} role="img" aria-label={`${rounded} out of ${max} stars`}>
        {stars.map((name, i) => (
          <Icon key={i} name={name} size={24} color="currentColor" />
        ))}
      </div>
      {label && <p className={styles.label}>{label}</p>}
    </div>
  );
}
