import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { columnMinWidth, type DataColumn } from './columns';

export type FittingColumnsOptions = {
  /** Extra room needed before a hidden column comes back, so it doesn't flicker at the boundary. Default 16. */
  hysteresis?: number;
};

/**
 * The columns that fit the container, for a DataHeader + DataRow table (DataTable uses it on its own).
 *
 * Columns with a `priority` hide, highest first (ties: the right-most first), while the table is wider than the
 * container even with every flexible column at its `minWidth`. A hidden column comes back once there is room for it,
 * its gap and `hysteresis` more. Columns without a `priority` never hide; if those alone don't fit, the table scrolls
 * sideways inside its card as before.
 *
 * The table's own chrome is measured from its first row (`[role="row"]` inside the container): the side padding
 * (the inset), the gap between cells, and every cell that isn't a column (the checkbox and ••• cells; DataHeader and
 * DataRow mark column cells with `data-column`). Re-measured whenever the container resizes.
 *
 * It also sets `--table-min-width` on the container: the narrowest the table can be with the shown columns. Give the
 * table `min-width: var(--table-min-width, min-content)` so it shrinks to exactly that (DataTable does).
 * A column's `minWidth` must hold its widest unbreakable content: header labels ellipsize and text values wrap, but a
 * pill or button wider than `minWidth` would overflow its cell.
 */
export function useFittingColumns(
  columns: DataColumn[],
  containerRef: RefObject<HTMLElement | null>,
  { hysteresis = 16 }: FittingColumnsOptions = {},
): DataColumn[] {
  // The columns that hide, in the order they hide
  const hideOrder = columns
    .map((column, index) => ({ column, index }))
    .filter(({ column }) => column.priority !== undefined)
    .sort((a, b) => b.column.priority! - a.column.priority! || b.index - a.index)
    .map(({ column }) => column.key);
  const orderKey = hideOrder.join('\n');
  const columnsKey = columns.map(c => `${c.key}:${c.width ?? ''}:${c.minWidth ?? ''}`).join('\n');
  const [hiddenCount, setHiddenCount] = useState(0);
  const hiddenRef = useRef(0);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      const row = container.querySelector<HTMLElement>('[role="row"]');
      if (!row) return;
      const style = getComputedStyle(row);
      const gap = parseFloat(style.columnGap) || 0;
      const padding = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
      const chrome = [...row.children].filter(cell => !cell.hasAttribute('data-column')) as HTMLElement[];
      const chromeWidth = chrome.reduce((sum, cell) => sum + cell.getBoundingClientRect().width, 0);
      const available = container.clientWidth;
      // Narrowest table width with the first `count` hideable columns hidden
      const need = (count: number) => {
        const hidden = new Set(hideOrder.slice(0, count));
        const shown = columns.filter(c => !hidden.has(c.key));
        const cells = chrome.length + shown.length;
        return padding + chromeWidth + gap * Math.max(0, cells - 1) + shown.reduce((sum, c) => sum + columnMinWidth(c), 0);
      };
      let count = 0;
      while (count < hideOrder.length && need(count) > available) count++;
      // Bring columns back only with room to spare
      while (count < hiddenRef.current && need(count) + hysteresis > available) count++;
      count = Math.min(count, hideOrder.length);
      hiddenRef.current = count;
      setHiddenCount(count);
      /*
       * The narrowest the table can be with these columns. A table sized by its min-content can come out wider than
       * this (the browser gives every fill column the widest one's min-content, and header labels don't wrap), so the
       * table uses this instead (DataTable: .table { min-width: var(--table-min-width, min-content) }). It scrolls
       * only when even this is wider than the container.
       */
      container.style.setProperty('--table-min-width', `${Math.ceil(need(count))}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => {
      observer.disconnect();
      container.style.removeProperty('--table-min-width');
    };
    // columnsKey / orderKey stand in for `columns`, which callers often rebuild on every render
  }, [containerRef, columnsKey, orderKey, hysteresis]); // eslint-disable-line react-hooks/exhaustive-deps

  if (hiddenCount === 0) return columns;
  const hidden = new Set(hideOrder.slice(0, hiddenCount));
  return columns.filter(c => !hidden.has(c.key));
}
