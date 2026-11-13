import type { CSSProperties } from 'react';

/**
 * One column of a data table. DataHeader and DataRow take the same `columns` array,
 * so header items and row items line up.
 */
export type DataColumn = {
  /** Key into each row's `cells`. */
  key: string;
  /** Header text (Figma Header Item `Label`). */
  label: string;
  /**
   * The column's starting width in px, or `'fill'` (it starts from its minimum). Default 160.
   * When the table is wider than its columns need, every column grows by the same extra amount, so the spacing reads
   * even; `fixed` columns don't grow. With `minWidth`, a column also shrinks toward it when the table is short of
   * room, and its text wraps onto up to 2 lines.
   */
  width?: number | 'fill';
  /**
   * Keeps the column exactly `width` wide: it neither grows nor shrinks. For utility columns such as a 40px "+" button
   * or an icon. Defaults to true for a column with `labelHidden` and `sortable: false`.
   */
  fixed?: boolean;
  /**
   * Narrowest the column may get, in px. Makes a numeric `width` flexible (see `width`); on a `'fill'` column it sets
   * its floor. Either way the values wrap onto at most 2 lines. Without it, a fill column counts as FILL_MIN_WIDTH when
   * deciding which columns fit, and its values wrap freely (e.g. notes).
   */
  minWidth?: number;
  /**
   * Hides the column when the table is too narrow for all its columns (useFittingColumns, used by DataTable). Higher
   * numbers hide first; ties hide the right-most first. Leave it out for columns that must always show.
   */
  priority?: number;
  /** Horizontal alignment of header label and cell content. Figma uses start and center, plus end for dates. */
  align?: 'start' | 'center' | 'end';
  /** Shows the sort icon (Figma Header Item). Default true. */
  sortable?: boolean;
  /**
   * Adds the filter button (Figma Header Item `Default - 2 Icons` / `Stretched`). Give it only to columns whose values
   * repeat, so picking some of them makes sense: a type, category, place or status, not unique names, codes, addresses or
   * amounts. DataTable shows it only when the table has `onFilter` and more than 10 rows.
   */
  filterable?: boolean;
  /** Hides the header text visually but keeps it for screen readers. */
  labelHidden?: boolean;
  /**
   * Drops the Row Item's 8px side padding, so a control fills the column edge to edge. Use it for a column of buttons
   * (Figma Data Table Row `Button Action`: an 80px slot with the button flush right), with `align: 'end'`.
   */
  flush?: boolean;
};

/**
 * Leading "static" area of a header or row.
 * - `checkbox`: row selection checkbox (Figma Roles / Notes screens)
 * - `checkbox-avatar`: checkbox plus a 36px avatar (Figma Users, Tags, Tenant … screens)
 * - `none`: no leading area
 */
export type DataLeading = 'none' | 'checkbox' | 'checkbox-avatar';

export type SortDirection = 'ascending' | 'descending';
export type DataSort = { key: string; direction: SortDirection };

/** Figma row geometry: 8px inset + 44px checkbox frame (+ 4px gap + 36px avatar). Component dimensions, no tokens. */
export const LEADING_WIDTH: Record<DataLeading, number> = { none: 0, checkbox: 52, 'checkbox-avatar': 92 };

/** A `'fill'` column's narrowest width when deciding which columns fit, unless it sets `minWidth` (layout size, no token). */
export const FILL_MIN_WIDTH = 120;

/**
 * Whether the column shrinks below its preferred width: a numeric `width` with a `minWidth`, or a `'fill'` column with
 * a `minWidth`. Their values wrap onto at most 2 lines (a fill column without `minWidth` wraps freely, e.g. notes).
 */
export function isFlexibleColumn(column: DataColumn) {
  return column.minWidth !== undefined;
}

/** The narrowest the column can get: its `minWidth`, its fixed width, or FILL_MIN_WIDTH for a fill column. */
export function columnMinWidth(column: DataColumn) {
  const width = column.width ?? 160;
  if (width === 'fill') return column.minWidth ?? FILL_MIN_WIDTH;
  return Math.min(width, column.minWidth ?? width);
}

/** Whether the column keeps exactly its width (`fixed`, or by default a column with a hidden label that doesn't sort). */
export function isFixedColumn(column: DataColumn) {
  return column.fixed ?? (column.width !== 'fill' && !!column.labelHidden && column.sortable === false);
}

/**
 * Inline sizing for a header or row cell. Every column starts from its width (a fill column from its minimum) and
 * grows by the same share of any extra room (flex-grow 1), so the table's spacing reads even; it shrinks no further
 * than its minimum, the same floor useFittingColumns counts. Only a basis and a minimum are set: an explicit `width`
 * would count as the narrowest size, so the table would scroll instead of shrinking.
 */
export function columnStyle(column: DataColumn): CSSProperties {
  const width = column.width ?? 160;
  if (width !== 'fill' && isFixedColumn(column)) return { flex: `0 0 ${width}px`, width };
  const basis = width === 'fill' ? columnMinWidth(column) : width;
  return { flex: `1 1 ${basis}px`, minWidth: columnMinWidth(column) };
}
