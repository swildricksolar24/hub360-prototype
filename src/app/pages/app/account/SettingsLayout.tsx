import type { ReactNode } from 'react';
import styles from './AccountSettings.module.css';

/** The centered settings column (Figma: an 800px column of cards). */
export function SettingsColumn({ children }: { children: ReactNode }) {
  return <div className={styles.column}>{children}</div>;
}

/** Figma settings card: a bold title over a divider, then fields or rows. */
export function SettingsCard({ title, children, footer }: { title?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <section className={styles.card} aria-label={title}>
      {title && <h2 className={`text-medium-bold ${styles.cardTitle}`}>{title}</h2>}
      <div className={styles.cardBody}>{children}</div>
      {footer && <div className={styles.cardFooter}>{footer}</div>}
    </section>
  );
}

/** A setting row: label (and optional description) on the left, its control on the right. */
export function SettingRow({
  label,
  description,
  lead,
  children,
}: {
  label: ReactNode;
  description?: ReactNode;
  /** Icon or logo before the label (login methods, devices). */
  lead?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={styles.row}>
      {lead && <span className={styles.lead}>{lead}</span>}
      <div className={styles.rowText}>
        <span className={`text-medium-regular ${styles.rowLabel}`}>{label}</span>
        {description && <span className={`text-small-regular ${styles.rowDescription}`}>{description}</span>}
      </div>
      {children && <div className={styles.control}>{children}</div>}
    </div>
  );
}

/** Form fields, stacked; wrap side-by-side fields in `FieldRow`. */
export function Fields({ children }: { children: ReactNode }) {
  return <div className={styles.fields}>{children}</div>;
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <div className={styles.fieldRow}>{children}</div>;
}

/** "10:00 PM – 7:00 AM": two controls with a dash between them. */
export function Range({ children }: { children: [ReactNode, ReactNode] }) {
  return (
    <span className={styles.range}>
      {children[0]}
      <span aria-hidden>–</span>
      {children[1]}
    </span>
  );
}
