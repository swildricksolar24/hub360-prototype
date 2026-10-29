import type { ReactNode } from 'react';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import styles from './Card.module.css';

export type CardMode = 'edit' | 'save' | 'active' | 'title';

export type CardProps = {
  /** Figma `Label`: the card heading. */
  title: ReactNode;
  /**
   * Figma `Mode` — edit = Edit button · save = Cancel + Save buttons ·
   * active = busy indicator while saving · title = plain section heading with a bottom rule.
   */
  mode?: CardMode;
  /** Leading logo or avatar (Figma "Fake logo", 66px). Hidden in `title` mode. */
  media?: ReactNode;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  /** Heading level of the title. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Card body, shown under the header. */
  children?: ReactNode;
  className?: string;
};

export function Card({ title, mode = 'edit', media, onEdit, onSave, onCancel, headingLevel = 2, children, className }: CardProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <section className={[styles.card, className].filter(Boolean).join(' ')} data-mode={mode}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          {media && mode !== 'title' && <div className={styles.media}>{media}</div>}
          <Heading className={styles.title}>{title}</Heading>
        </div>
        {mode === 'edit' && (
          <Button size="small" variant="brand" onClick={onEdit}>
            Edit
          </Button>
        )}
        {mode === 'save' && (
          <div className={styles.actions}>
            <Button size="small" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button size="small" variant="brand" onClick={onSave}>
              Save
            </Button>
          </div>
        )}
        {mode === 'active' && (
          <IconButton
            label="Saving"
            icon="progress-activity"
            variant="brand"
            size="compact"
            className={styles.busy}
            aria-busy
            aria-disabled
          />
        )}
      </div>
      {children && <div className={styles.body}>{children}</div>}
    </section>
  );
}
