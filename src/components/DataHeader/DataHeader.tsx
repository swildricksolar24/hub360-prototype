import type { CSSProperties } from 'react';
import { Icon } from '../Icon/Icon';
import { DataCheckbox } from './DataCheckbox';
import { LEADING_WIDTH, columnStyle, type DataColumn, type DataLeading, type DataSort, type SortDirection } from './columns';
import styles from './DataHeader.module.css';

export type { DataColumn, DataLeading, DataSort, SortDirection } from './columns';
export { FILL_MIN_WIDTH } from './columns';
export { useFittingColumns, type FittingColumnsOptions } from './useFittingColumns';

/* ---------- Header Item ---------- */

export type HeaderItemProps = {
  /** Figma `Label`. */
  label: string;
  align?: DataColumn['align'];
  /** Shows the sort icon. Default true. */
  sortable?: boolean;
  /** Figma `State=Default - 2 Icons`: a filter icon before the sort icon. */
  filterable?: boolean;
  /** Visually hides the label (kept for screen readers). */
  labelHidden?: boolean;
  /** Current sort of this column; sets `aria-sort`. */
  sortDirection?: SortDirection;
  /** Makes the sort icon a button. */
  onSort?: () => void;
  /** Makes the filter icon a button. */
  onFilter?: () => void;
  /** Shows the "Filter - Active" icon. */
  filterActive?: boolean;
  /** The filter pop-over is open (`aria-expanded` on the filter button). Leave it out when the button opens nothing. */
  filterOpen?: boolean;
  /**
   * Figma `State=Stretched` (the Data Table Header, 3131:247): the label with a small 16px sort chevron right after it
   * (no tile), and the Preferences (sliders) filter on a 24px Gray Fill/Weaker tile at the column's far edge.
   * Without it, the icons follow the label (`State=Default` / `Default - 2 Icons`, the older Data Headers).
   */
  stretched?: boolean;
  /** The column's key, set as `data-column` (useFittingColumns tells column cells from the checkbox and ••• cells). */
  columnKey?: string;
  style?: CSSProperties;
  className?: string;
};

/** The header's filter and sort icon size (Figma Header Item's 24px icons). */
const HEADER_ICON = 24;
/** Figma `State=Stretched`'s sort chevron beside the label: 16px. */
const STRETCHED_SORT_ICON = 16;

/**
 * The Figma "Sort" icon (Icon/svg/sort.svg) drawn as its two arrows, so the one for the current direction can be
 * highlighted: up for ascending, down for descending (DataHeader.module.css). Same 24px geometry as the icon file.
 */
function SortIcon({ size, direction, className }: { size: number; direction?: SortDirection; className?: string }) {
  return (
    <svg
      className={[styles.sortIcon, className].filter(Boolean).join(' ')}
      data-direction={direction}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
    >
      <path data-arrow="up" d="M8.77375 9.31844L7.47766 8.02235L11.5 4L15.5224 8.02235L14.2263 9.31844L11.5 6.59218L8.77375 9.31844Z" />
      <path data-arrow="down" d="M11.5 20L7.47766 15.9777L8.77375 14.6816L11.5 17.4078L14.2263 14.6816L15.5224 15.9777L11.5 20Z" />
    </svg>
  );
}

/** Figma "Header Item" (Data Headers*): a bold label followed by sort (and filter) icons. */
export function HeaderItem({
  label,
  align = 'start',
  sortable = true,
  filterable = false,
  labelHidden = false,
  sortDirection,
  onSort,
  onFilter,
  filterActive = false,
  filterOpen,
  stretched = false,
  columnKey,
  style,
  className,
}: HeaderItemProps) {
  // Stretched uses Figma's Preferences icon and shows an active filter with the tile's Selected fill instead
  const filterIcon = stretched ? 'preferences' : filterActive ? 'filter-active' : 'filter';
  // Stretched: the same 16px as the sort chevron, on the same 20px tile
  const filterSize = stretched ? STRETCHED_SORT_ICON : HEADER_ICON;
  const filter =
    // A column with a hidden label (e.g. the Status pills) can still filter; it just has no label or sort beside it
    filterable &&
    (onFilter ? (
      <button type="button" className={styles.iconButton} data-icon="filter" aria-label={`Filter ${label}`} aria-pressed={filterActive} aria-expanded={filterOpen} onClick={onFilter}>
        <Icon name={filterIcon} size={filterSize} color="currentColor" />
      </button>
    ) : (
      <Icon name={filterIcon} size={filterSize} className={styles.icon} />
    ));
  const sortSize = stretched ? STRETCHED_SORT_ICON : HEADER_ICON;
  const sort =
    !labelHidden &&
    sortable &&
    (onSort ? (
      <button type="button" className={styles.iconButton} data-icon="sort" aria-label={`Sort by ${label}`} onClick={onSort}>
        <SortIcon size={sortSize} direction={sortDirection} />
      </button>
    ) : (
      <SortIcon size={sortSize} direction={sortDirection} className={styles.icon} />
    ));
  // `data-header-label` marks the text useFittingColumns measures in full
  const text = (
    <span className={labelHidden ? styles.srOnly : styles.label} data-header-label>
      {label}
    </span>
  );
  return (
    <div
      role="columnheader"
      aria-sort={sortable ? sortDirection ?? 'none' : undefined}
      className={[styles.item, className].filter(Boolean).join(' ')}
      data-align={align}
      data-stretched={stretched || undefined}
      data-column={columnKey}
      style={style}
    >
      {stretched ? (
        <>
          <span className={styles.labelGroup}>
            {text}
            {sort}
          </span>
          {filter}
        </>
      ) : (
        <>
          {text}
          {filter}
          {sort}
        </>
      )}
    </div>
  );
}

/* ---------- Data Header ---------- */

export type DataHeaderProps = {
  /** Columns, shared with DataRow. Replaces the app-specific Figma `Screen` variants. */
  columns: DataColumn[];
  /** Leading area, sized like the rows' checkbox (+ avatar). Default `checkbox-avatar`. */
  leading?: DataLeading;
  /** Overrides the leading area width in px (Figma Tags uses 160, Notes 135). A page can also set it in CSS with `--data-leading-width`. */
  leadingWidth?: number;
  /** Reserves the rows' trailing "More" column (44px). Default true. */
  actions?: boolean;
  /** Corner rounding: Figma User Headers use 12px on all corners, Tenant Headers* on the bottom only, Notes none. */
  corners?: 'all' | 'bottom' | 'none';
  /** Current sort; sets `aria-sort` on that column. */
  sort?: DataSort;
  /** Called with the column key when its sort icon is pressed. */
  onSortChange?: (key: string) => void;
  /** Called with the column key when its filter icon is pressed. */
  onFilter?: (key: string) => void;
  /** Keys of columns with an active filter. */
  activeFilters?: string[];
  /** The column whose filter pop-over is open: its filter button stays shown and gets `aria-expanded`. */
  openFilter?: string;
  /** Shows a "select all" checkbox in the leading area. In Figma the leading area is an invisible spacer. */
  allSelected?: boolean;
  onSelectAllChange?: (checked: boolean) => void;
  /** Header Items in Figma's `State=Stretched 2 icons` (the Data Table Header). DataTable sets it. */
  stretched?: boolean;
  className?: string;
};

export function DataHeader({
  columns,
  leading = 'checkbox-avatar',
  leadingWidth,
  actions = true,
  corners = 'all',
  sort,
  onSortChange,
  onFilter,
  activeFilters = [],
  openFilter,
  allSelected,
  onSelectAllChange,
  stretched,
  className,
}: DataHeaderProps) {
  const width = leadingWidth ?? LEADING_WIDTH[leading];
  return (
    <div role="row" className={[styles.header, className].filter(Boolean).join(' ')} data-corners={corners}>
      {leading !== 'none' &&
        (onSelectAllChange ? (
          <div role="columnheader" className={styles.leading} style={{ flex: `0 0 var(--data-leading-width, ${width}px)` }}>
            <DataCheckbox label="Select all rows" checked={allSelected} onChange={checked => onSelectAllChange(checked)} />
          </div>
        ) : (
          <div aria-hidden className={styles.leading} style={{ flex: `0 0 var(--data-leading-width, ${width}px)` }} />
        ))}
      {columns.map(column => (
        <HeaderItem
          key={column.key}
          label={column.label}
          align={column.align}
          sortable={column.sortable ?? true}
          filterable={column.filterable}
          labelHidden={column.labelHidden}
          sortDirection={sort?.key === column.key ? sort.direction : undefined}
          onSort={onSortChange && (() => onSortChange(column.key))}
          onFilter={onFilter && (() => onFilter(column.key))}
          filterActive={activeFilters.includes(column.key)}
          filterOpen={onFilter ? openFilter === column.key : undefined}
          stretched={stretched}
          columnKey={column.key}
          style={columnStyle(column)}
        />
      ))}
      {actions && <div aria-hidden className={styles.actions} />}
    </div>
  );
}
