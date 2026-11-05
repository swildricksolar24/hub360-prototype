import { useId, type ReactNode } from 'react';
import styles from './Cards.module.css';

export type CardLargeProps = {
  /** The heading above the divider, e.g. "Personal Information". Figma: Large/Bold, Gray Text/Strong. */
  title: ReactNode;
  /** Heading level of the title. Default 2. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** The card's content, stacked 16px apart: fields, rows of fields, text. Figma shows a profile form. */
  children?: ReactNode;
  className?: string;
};

/**
 * Figma "Card / Large" (- Cards page): a section on the sunken surface with a title, a divider and stacked content,
 * such as a form. The card is a `<section>` named by its title.
 */
export function CardLarge({ title, headingLevel = 2, children, className }: CardLargeProps) {
  const Heading = `h${headingLevel}` as const;
  const id = useId();
  return (
    <section className={[styles.large, className].filter(Boolean).join(' ')} aria-labelledby={id}>
      <div className={styles.largeHead}>
        <Heading id={id} className={styles.largeTitle}>
          {title}
        </Heading>
      </div>
      {children != null && <div className={styles.largeBody}>{children}</div>}
    </section>
  );
}

export type CardRowProps = {
  /** The 80px picture on the left, usually an `Avatar`; it's stretched to fill the 80px box. Figma: Avatar Medium photo. */
  media?: ReactNode;
  /** The main line, e.g. a person's name. Figma: Heading 4/Bold. */
  title: ReactNode;
  /** The line under the title, e.g. "Senior Product Designer · Design". Figma: Small/Regular. */
  subtitle?: ReactNode;
  /** Controls on the right, e.g. a "Change Photo" `Button`. */
  action?: ReactNode;
  /** Figma `Property 1=Variant2`: a teal-tinted card, e.g. to mark the current or chosen one. */
  highlighted?: boolean;
  className?: string;
};

/**
 * Figma "Card / Row / Small" (- Cards page): one row on a card, with a picture, a title and subtitle, and an action on
 * the right, such as the profile photo row in Account Settings.
 */
export function CardRow({ media, title, subtitle, action, highlighted = false, className }: CardRowProps) {
  return (
    <div className={[styles.row, className].filter(Boolean).join(' ')} data-highlighted={highlighted || undefined}>
      {media != null && <div className={styles.media}>{media}</div>}
      <div className={styles.text}>
        <span className={styles.rowTitle}>{title}</span>
        {subtitle != null && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
      {action != null && <div className={styles.action}>{action}</div>}
    </div>
  );
}
