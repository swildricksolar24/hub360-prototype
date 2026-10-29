import styles from './LastModified.module.css';

export type LastModifiedProps = {
  /** The modification date. Strings are passed to `new Date()`. */
  date: Date | string;
  /** Text before the date. Figma `Label` reads "Last Updated: May 18, 2026". */
  label?: string;
  /** BCP 47 locale for the date; defaults to the browser locale. */
  locale?: string;
  /** Intl date format. Defaults to the Figma format ("May 18, 2026"). */
  format?: Intl.DateTimeFormatOptions;
  className?: string;
};

const DEFAULT_FORMAT: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };

/** Figma "Last Modified › Date": a single line of medium text with a machine-readable <time>. */
export function LastModified({ date, label = 'Last Updated:', locale, format = DEFAULT_FORMAT, className }: LastModifiedProps) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const valid = !Number.isNaN(d.getTime());
  return (
    <p className={[styles.lastModified, className].filter(Boolean).join(' ')}>
      {label}{' '}
      {valid ? <time dateTime={d.toISOString()}>{new Intl.DateTimeFormat(locale, format).format(d)}</time> : String(date)}
    </p>
  );
}
