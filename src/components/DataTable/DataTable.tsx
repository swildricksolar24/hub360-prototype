import { useRef, type HTMLAttributes, type ReactNode } from 'react';
import { DataHeader, useFittingColumns, type DataColumn, type DataSort } from '../DataHeader/DataHeader';
import { DataRow } from '../DataRow/DataRow';
import { Skeleton } from '../Skeleton/Skeleton';
import styles from './DataTable.module.css';

export type { DataColumn, DataSort, SortDirection } from '../DataHeader/DataHeader';
export { useFittingColumns } from '../DataHeader/DataHeader';

/** Widths of the checkbox and ••• cells (DataTable.module.css --data-leading-width; DataRow's 44px ••• box). */
const SELECT_CELL_WIDTH = 28;
const MORE_CELL_WIDTH = 44;
const SUMMARY_LEAD = '__summary-lead';
const SUMMARY_END = '__summary-end';
/** A list this long or shorter shows no column filter icons, only sort (see `totalRows`). */
export const FILTER_MIN_ROWS = 10;

/** Props DataTable spreads onto a row's wrapper (see `rowProps`): any div attributes, plus `data-*` flags. */
export type RowWrapperProps = HTMLAttributes<HTMLDivElement> & { [key: `data-${string}`]: string | boolean | undefined };

export type DataTableProps<T extends { id: string }> = {
  /** Accessible name of the table. */
  'aria-label': string;
  /**
   * Columns (Figma Data Table Header `Column 1…5`). A number is a fixed px width, `'fill'` shares the rest. Add a
   * `minWidth` to let a column shrink (its text wraps onto up to 2 lines), and a `priority` to let it hide when the
   * table doesn't fit its card (higher hides first).
   */
  columns: DataColumn[];
  rows: T[];
  /** Cell content by column key for one row (Figma Row Item `Value`). */
  cells: (row: T) => Record<string, ReactNode>;
  /** Names a row in its checkbox and ••• labels ("Select Phoenix WH"). Defaults to the row id. */
  rowLabel?: (row: T) => string;
  /** Figma `Checkbox`: the selection column. On when `onSelectedChange` is given. */
  selectable?: boolean;
  /** Ids of the checked rows (Figma `State=Selected`). */
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  /** Current sort; the header's sort icons call `onSortChange` with the column key. */
  sort?: DataSort;
  onSortChange?: (key: string) => void;
  /** Figma `Actions`: the ••• column. On when `onMore` is given. */
  actions?: boolean;
  onMore?: (row: T) => void;
  /** Shows the ••• on every row. Otherwise it appears on hover, focus, a checked row and while `renderAfterRow` shows something. */
  actionsVisible?: boolean;
  /** Content placed after a row inside its wrapper, e.g. its open ••• menu. */
  renderAfterRow?: (row: T) => ReactNode;
  /**
   * Extra props for a row's wrapper, e.g. drag and drop (`draggable`, `onDragStart` … `onDrop`, a `data-drop` flag).
   * A `className` is added to DataTable's own; DataTable's `data-stripe`, `data-inactive` and `data-open` win.
   */
  rowProps?: (row: T, index: number) => RowWrapperProps;
  /**
   * A summary row after the rows (shown when there are rows), e.g. Stock's bold Totals on the header's teal tint:
   * cell content by column key, like `cells`. It uses the same fitted columns, with no checkbox, ••• or stripe.
   */
  summary?: Record<string, ReactNode>;
  /** Accessible name of the summary row. Default "Totals". */
  summaryLabel?: string;
  /** Called with the column key when a column's filter icon is pressed (columns with `filterable`). Passed to DataHeader. */
  onFilter?: (key: string) => void;
  /** Keys of the columns with an active filter (their icon shows "Filter - Active"). Passed to DataHeader. */
  activeFilters?: string[];
  /** The column whose filter pop-over is open: its filter button stays shown and gets `aria-expanded`. */
  openFilter?: string;
  /**
   * How many rows the whole list has, before paging, search and filters (default `rows.length`). A table of
   * FILTER_MIN_ROWS (10) rows or fewer shows only the sort icons: its columns' filter icons hide, except on a column
   * whose filter is on (so it can be cleared). Pass it when `rows` is one page or a filtered list.
   */
  totalRows?: number;
  /**
   * While loading: skeleton rows (Volt Skeleton bars on the row background) in place of the rows, empty message and
   * summary, and `aria-busy` on the table.
   */
  loading?: boolean;
  /** How many skeleton rows show while `loading`. Default 5. */
  loadingRows?: number;
  /** Figma `State=Striped`: tints the first, third, … rows. Default true. */
  striped?: boolean;
  /** Rows whose values switch to the weak text color. */
  inactive?: (row: T) => boolean;
  /** Shown in place of the rows when there are none. `null` shows nothing (just the header). */
  empty?: ReactNode;
  className?: string;
};

/**
 * Figma "Data Table" (Data Table page): the clean table used across the prototype, with a Brand Teal Fill/Weaker
 * header, 68px rows on the card color, a subtle stripe, hover and selected tints, and 1px dividers. Built from
 * DataHeader and DataRow. It fits its card: the side inset and cell gap follow the page density (--table-inset /
 * --table-gap), flexible columns shrink to their `minWidth`, then columns with a `priority` hide (useFittingColumns);
 * only a table that still doesn't fit scrolls sideways inside its card. A fixed first column (Figma `Column 1 Wide`),
 * a sixth column and a button column (Figma `Button Action`) are just more `columns`.
 */
export function DataTable<T extends { id: string }>({
  'aria-label': ariaLabel,
  columns,
  rows,
  cells,
  rowLabel = row => row.id,
  selectable,
  selected = [],
  onSelectedChange,
  sort,
  onSortChange,
  actions,
  onMore,
  actionsVisible = false,
  renderAfterRow,
  rowProps,
  summary,
  summaryLabel = 'Totals',
  onFilter,
  activeFilters,
  openFilter,
  totalRows,
  loading = false,
  loadingRows = 5,
  striped = true,
  inactive,
  empty = 'No rows yet.',
  className,
}: DataTableProps<T>) {
  const withCheckbox = selectable ?? !!onSelectedChange;
  const withActions = actions ?? !!onMore;
  const leading = withCheckbox ? 'checkbox' : 'none';
  const ids = rows.map(r => r.id);
  const setRow = (id: string, on: boolean) => onSelectedChange?.(on ? [...selected, id] : selected.filter(s => s !== id));
  const scrollRef = useRef<HTMLDivElement>(null);
  // Filter buttons show only where they work and help: the table handles filters (`onFilter`; without it a filter
  // button would open nothing), and the list is longer than 10 rows (a short one needs only sort). A column whose
  // filter is on keeps its button, so it can be cleared.
  const withFilters = !!onFilter && (totalRows ?? rows.length) > FILTER_MIN_ROWS;
  const headerColumns = withFilters
    ? columns
    : columns.map(c => (c.filterable && !activeFilters?.includes(c.key) ? { ...c, filterable: false } : c));
  const shown = useFittingColumns(headerColumns, scrollRef);
  // The summary row has no checkbox or •••: empty spacer cells of their widths keep its values under the headers
  const summaryColumns: DataColumn[] = [
    ...(withCheckbox ? [{ key: SUMMARY_LEAD, label: '', width: SELECT_CELL_WIDTH, fixed: true }] : []),
    ...shown,
    ...(withActions ? [{ key: SUMMARY_END, label: '', width: MORE_CELL_WIDTH, fixed: true }] : []),
  ];

  return (
    <div ref={scrollRef} className={[styles.scroll, className].filter(Boolean).join(' ')}>
      <div
        role="table"
        aria-label={ariaLabel}
        aria-rowcount={rows.length + 1}
        aria-busy={loading || undefined}
        className={styles.table}
        data-selectable={withCheckbox || undefined}
        data-actions-visible={actionsVisible || undefined}
      >
        <DataHeader
          className={styles.head}
          corners="none"
          stretched
          columns={shown}
          leading={leading}
          actions={withActions}
          sort={sort}
          onSortChange={onSortChange}
          onFilter={onFilter}
          activeFilters={activeFilters}
          openFilter={openFilter}
          allSelected={ids.length > 0 && ids.every(id => selected.includes(id))}
          onSelectAllChange={onSelectedChange && (on => onSelectedChange(on ? [...new Set([...selected, ...ids])] : selected.filter(s => !ids.includes(s))))}
        />
        {loading &&
          Array.from({ length: loadingRows }, (_, i) => (
            <div key={i} className={styles.skeletonRow} aria-hidden>
              <Skeleton width="100%" height={20} />
            </div>
          ))}
        {!loading && rows.length === 0 && empty !== null && (
          <div role="row">
            <div role="cell" className={styles.empty}>
              {empty}
            </div>
          </div>
        )}
        {!loading &&
          rows.map((row, i) => {
          const after = renderAfterRow?.(row);
          const extra = rowProps?.(row, i);
          return (
            <div
              key={row.id}
              {...extra}
              className={[styles.rowWrap, extra?.className].filter(Boolean).join(' ')}
              data-stripe={(striped && i % 2 === 0) || undefined}
              data-inactive={inactive?.(row) || undefined}
              data-open={(after != null && after !== false) || undefined}
            >
              <DataRow
                className={styles.row}
                columns={shown}
                leading={leading}
                cells={cells(row)}
                selected={withCheckbox ? selected.includes(row.id) : undefined}
                onSelectedChange={onSelectedChange && (on => setRow(row.id, on))}
                selectLabel={`Select ${rowLabel(row)}`}
                actions={withActions}
                onMore={onMore && (() => onMore(row))}
                moreLabel={`More actions for ${rowLabel(row)}`}
              />
              {after}
            </div>
          );
        })}
        {!loading && summary && rows.length > 0 && (
          <DataRow
            className={`${styles.row} ${styles.summary}`}
            aria-label={summaryLabel}
            columns={summaryColumns}
            leading="none"
            actions={false}
            cells={summary}
          />
        )}
      </div>
    </div>
  );
}
