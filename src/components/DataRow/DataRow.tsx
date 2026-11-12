import { isValidElement, type CSSProperties, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import { DataCheckbox } from '../DataHeader/DataCheckbox';
import { LEADING_WIDTH, columnStyle, isFlexibleColumn, type DataColumn, type DataLeading } from '../DataHeader/columns';
import styles from './DataRow.module.css';

export type { DataColumn, DataLeading } from '../DataHeader/columns';

/* ---------- Row Item ---------- */

export type RowItemProps = {
  /** Figma `Value` (shown when Figma `Show Value` is on). Any node: text, an icon, a StatusPill… */
  value?: ReactNode;
  /** Figma `Show Slot`: extra content after the value, e.g. a RowSlot. */
  slot?: ReactNode;
  align?: DataColumn['align'];
  /**
   * Lets long values wrap: `true` (fill columns, e.g. the Notes text) wraps freely; `2` (flexible columns below their
   * preferred width) wraps onto at most 2 lines and ends the second with an ellipsis. Otherwise the value stays on one line.
   */
  wrap?: boolean | 2;
  /** No side padding: the value (e.g. a button) reaches the cell's edges. */
  flush?: boolean;
  /** The column's key, set as `data-column` (useFittingColumns tells column cells from the checkbox and ••• cells). */
  columnKey?: string;
  style?: CSSProperties;
  className?: string;
};

/** Figma "Row Item" (Data Rows*): one cell, 8px padding, Medium/Regular text. */
export function RowItem({ value, slot, align = 'start', wrap = false, flush = false, columnKey, style, className }: RowItemProps) {
  // Text (a string or number) clamps and wraps; an element (a control, link, pill…) gets the cell's full width instead,
  // so a block control like EditableCell stretches to the column, and is never clamped or clipped.
  const isText = typeof value === 'string' || typeof value === 'number';
  const fill = !isText && isValidElement(value) && !slot;
  return (
    <div
      role="cell"
      className={[styles.item, className].filter(Boolean).join(' ')}
      data-align={align}
      data-wrap={wrap === true || undefined}
      data-clamp={wrap === 2 || undefined}
      data-flush={flush || undefined}
      data-column={columnKey}
      style={style}
    >
      {value !== undefined && value !== null && value !== false && (
        <span className={styles.value} data-text={isText || undefined} data-fill={fill || undefined}>
          {value}
        </span>
      )}
      {slot}
    </div>
  );
}

/* ---------- Slot* ---------- */

/** Figma "Slot*": a small gray pill placed in a Row Item's slot (e.g. a count or extra label). */
export function RowSlot({ children }: { children: ReactNode }) {
  return <span className={styles.slot}>{children}</span>;
}

/* ---------- Status pill (Figma Tag "Small" as used in Data Rows) ---------- */

export type StatusTone = 'success' | 'info' | 'warning' | 'error' | 'neutral';

export type StatusPillProps = {
  children: ReactNode;
  /** Data Rows use `success` ("Active"). The other tones use the matching Semantic Fill weak token. */
  tone?: StatusTone;
};

/** Status label used in the Data Rows "Status" column. A private copy of the Figma Tag "Small" look. */
export function StatusPill({ children, tone = 'success' }: StatusPillProps) {
  return (
    <span className={styles.pill} data-tone={tone}>
      {children}
    </span>
  );
}

/* ---------- Avatar (Figma Avatar "Small" as used in Data Rows) ---------- */

export type RowAvatar = {
  /** Photo URL (Figma `Type=Photo`). */
  src?: string;
  /** Initials (Figma `Type=Initial`), used when there is no photo. */
  initials?: string;
  /** Alternative text for the photo. Default "" (decorative, the row already names the person). */
  alt?: string;
};

function Avatar({ src, initials, alt = '' }: RowAvatar) {
  return (
    <span className={styles.avatar} data-type={src ? 'photo' : 'initial'}>
      {src ? <img src={src} alt={alt} className={styles.photo} /> : <span aria-hidden={!alt || undefined}>{initials}</span>}
    </span>
  );
}

/* ---------- Data Row ---------- */

export type DataRowProps = {
  /** Columns, shared with DataHeader. Replaces the app-specific Figma `Screen` variants. */
  columns: DataColumn[];
  /** Cell content by column key. Strings render as Figma Row Item values. */
  cells: Record<string, ReactNode>;
  /** Leading area: selection checkbox, optionally with an avatar. Default `checkbox-avatar`. */
  leading?: DataLeading;
  /** Overrides the leading area width in px (Figma Tags uses 160, Notes 135). A page can also set it in CSS with `--data-leading-width`. */
  leadingWidth?: number;
  /** Avatar for `leading="checkbox-avatar"`. */
  avatar?: RowAvatar;
  /** Checkbox state (Figma checkbox `Show Checkmark`). */
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  /** Accessible name of the checkbox. Default "Select row". */
  selectLabel?: string;
  /** Shows the trailing "More" button. Default true. */
  actions?: boolean;
  onMore?: () => void;
  /** Accessible name of the "More" button. Default "More actions". */
  moreLabel?: string;
  /** Accessible name of the row, e.g. "Totals" for a summary row. */
  'aria-label'?: string;
  className?: string;
};

export function DataRow({
  columns,
  cells,
  leading = 'checkbox-avatar',
  leadingWidth,
  avatar,
  selected,
  onSelectedChange,
  selectLabel = 'Select row',
  actions = true,
  onMore,
  moreLabel = 'More actions',
  'aria-label': ariaLabel,
  className,
}: DataRowProps) {
  const width = leadingWidth ?? LEADING_WIDTH[leading];
  return (
    <div role="row" aria-selected={selected} aria-label={ariaLabel} className={[styles.row, className].filter(Boolean).join(' ')}>
      {leading !== 'none' && (
        <div role="cell" className={styles.leading} style={{ flex: `0 0 var(--data-leading-width, ${width}px)` }}>
          <DataCheckbox label={selectLabel} checked={selected} onChange={onSelectedChange && (checked => onSelectedChange(checked))} />
          {leading === 'checkbox-avatar' && <Avatar {...avatar} />}
        </div>
      )}
      {columns.map(column => (
        <RowItem
          key={column.key}
          value={cells[column.key]}
          align={column.align}
          wrap={isFlexibleColumn(column) ? 2 : column.width === 'fill'}
          flush={column.flush}
          columnKey={column.key}
          style={columnStyle(column)}
        />
      ))}
      {actions && (
        <div role="cell" className={styles.actions}>
          <button type="button" className={styles.more} aria-label={moreLabel} onClick={onMore}>
            <Icon name="more" size={32} color="currentColor" className={styles.moreIcon} />
          </button>
        </div>
      )}
    </div>
  );
}
