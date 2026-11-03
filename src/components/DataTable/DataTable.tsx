import type { ReactNode } from 'react';
import { DataHeader, type DataColumn, type DataSort } from '../DataHeader/DataHeader';
import { DataRow } from '../DataRow/DataRow';
import styles from './DataTable.module.css';

export type { DataColumn, DataSort, SortDirection } from '../DataHeader/DataHeader';

export type DataTableProps<T extends { id: string }> = {
  /** Accessible name of the table. */
  'aria-label': string;
  /** Columns (Figma Data Table Header `Column 1…5`). A number is a fixed px width, `'fill'` shares the rest. */
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
  /** Figma `State=Striped`: tints the first, third, … rows. Default true. */
  striped?: boolean;
  /** Rows whose values switch to the weak text color. */
  inactive?: (row: T) => boolean;
  /** Shown in place of the rows when there are none. `null` shows nothing (just the header). */
  empty?: ReactNode;
  className?: string;
};

/**
 * Figma "Data Table" (Data Table page): the clean table used across the prototype, with no frame or header fill, 64px
 * rows on the card color, a subtle stripe, hover and selected tints, and 1px dividers. Built from DataHeader and
 * DataRow; the table scrolls sideways inside its card when the columns don't fit.
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

  return (
    <div className={[styles.scroll, className].filter(Boolean).join(' ')}>
      <div
        role="table"
        aria-label={ariaLabel}
        aria-rowcount={rows.length + 1}
        className={styles.table}
        data-selectable={withCheckbox || undefined}
        data-actions-visible={actionsVisible || undefined}
      >
        <DataHeader
          className={styles.head}
          corners="none"
          columns={columns}
          leading={leading}
          actions={withActions}
          sort={sort}
          onSortChange={onSortChange}
          allSelected={ids.length > 0 && ids.every(id => selected.includes(id))}
          onSelectAllChange={onSelectedChange && (on => onSelectedChange(on ? [...new Set([...selected, ...ids])] : selected.filter(s => !ids.includes(s))))}
        />
        {rows.length === 0 && empty !== null && (
          <div role="row">
            <div role="cell" className={styles.empty}>
              {empty}
            </div>
          </div>
        )}
        {rows.map((row, i) => {
          const after = renderAfterRow?.(row);
          return (
            <div
              key={row.id}
              className={styles.rowWrap}
              data-stripe={(striped && i % 2 === 0) || undefined}
              data-inactive={inactive?.(row) || undefined}
              data-open={(after != null && after !== false) || undefined}
            >
              <DataRow
                className={styles.row}
                columns={columns}
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
      </div>
    </div>
  );
}
