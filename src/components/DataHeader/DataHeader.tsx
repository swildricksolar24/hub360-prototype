import type { CSSProperties } from 'react';
import { Icon } from '../Icon/Icon';
import { DataCheckbox } from './DataCheckbox';
import { LEADING_WIDTH, columnStyle, type DataColumn, type DataLeading, type DataSort, type SortDirection } from './columns';
import styles from './DataHeader.module.css';

export type { DataColumn, DataLeading, DataSort, SortDirection } from './columns';

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
  style?: CSSProperties;
  className?: string;
};

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
  style,
  className,
}: HeaderItemProps) {
  const filterIcon = filterActive ? 'filter-active' : 'filter';
  return (
    <div
      role="columnheader"
      aria-sort={sortable ? sortDirection ?? 'none' : undefined}
      className={[styles.item, className].filter(Boolean).join(' ')}
      data-align={align}
      style={style}
    >
      <span className={labelHidden ? styles.srOnly : styles.label}>{label}</span>
      {!labelHidden && filterable &&
        (onFilter ? (
          <button type="button" className={styles.iconButton} aria-label={`Filter ${label}`} aria-pressed={filterActive} onClick={onFilter}>
            <Icon name={filterIcon} size={24} color="currentColor" />
          </button>
        ) : (
          <Icon name={filterIcon} size={24} className={styles.icon} />
        ))}
      {!labelHidden && sortable &&
        (onSort ? (
          <button type="button" className={styles.iconButton} aria-label={`Sort by ${label}`} onClick={onSort}>
            <Icon name="sort" size={24} color="currentColor" />
          </button>
        ) : (
          <Icon name="sort" size={24} className={styles.icon} />
        ))}
    </div>
  );
}

/* ---------- Data Header ---------- */

export type DataHeaderProps = {
  /** Columns, shared with DataRow. Replaces the app-specific Figma `Screen` variants. */
  columns: DataColumn[];
  /** Leading area, sized like the rows' checkbox (+ avatar). Default `checkbox-avatar`. */
  leading?: DataLeading;
  /** Overrides the leading area width in px (Figma Tags uses 160, Notes 135). */
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
  /** Shows a "select all" checkbox in the leading area. In Figma the leading area is an invisible spacer. */
  allSelected?: boolean;
  onSelectAllChange?: (checked: boolean) => void;
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
  allSelected,
  onSelectAllChange,
  className,
}: DataHeaderProps) {
  const width = leadingWidth ?? LEADING_WIDTH[leading];
  return (
    <div role="row" className={[styles.header, className].filter(Boolean).join(' ')} data-corners={corners}>
      {leading !== 'none' &&
        (onSelectAllChange ? (
          <div role="columnheader" className={styles.leading} style={{ flex: `0 0 ${width}px` }}>
            <DataCheckbox label="Select all rows" checked={allSelected} onChange={checked => onSelectAllChange(checked)} />
          </div>
        ) : (
          <div aria-hidden className={styles.leading} style={{ flex: `0 0 ${width}px` }} />
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
          style={columnStyle(column)}
        />
      ))}
      {actions && <div aria-hidden className={styles.actions} />}
    </div>
  );
}
