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
   * Column width in px, or `'fill'` to share the remaining space.
   * Figma uses fixed 160px items and stretched (fill) items. Default 160.
   */
  width?: number | 'fill';
  /** Horizontal alignment of header label and cell content. Figma uses start and center, plus end for dates. */
  align?: 'start' | 'center' | 'end';
  /** Shows the sort icon (Figma Header Item). Default true. */
  sortable?: boolean;
  /** Adds the filter icon before the sort icon (Figma Header Item `State=Default - 2 Icons`). */
  filterable?: boolean;
  /** Hides the header text visually but keeps it for screen readers. */
  labelHidden?: boolean;
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

/** Inline sizing for a header or row cell. */
export function columnStyle(column: DataColumn): CSSProperties {
  const width = column.width ?? 160;
  return width === 'fill' ? { flex: '1 1 0', minWidth: 0 } : { flex: `0 0 ${width}px`, width };
}
