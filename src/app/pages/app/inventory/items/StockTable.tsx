import { useEffect, useState } from 'react';
import { DataTable, type DataColumn, type DataSort } from '../../../../../components/DataTable/DataTable';
import { PageTracker } from '../../../../../components/PageTracker/PageTracker';
import { AppLink } from '../../../../components/AppLink';
import { PAGE_SIZES } from '../record/tableKit';
import { available, type Item, type StockRow } from './itemData';
import { itemPath } from './itemStore';
import { nextSort, sortRows, useSelection } from './shared';
import styles from './items.module.css';

export type StockLine = { item: Item; stock: StockRow };

const ALL_COLUMNS: DataColumn[] = [
  { key: 'warehouse', label: 'WH', width: 64 },
  // Never narrower than the longest full item number on one line ("PA-0002-AJ89-98HB": 143px, + the link's 4px and the
  // cell's 16px padding)
  { key: 'number', label: 'Item #', width: 168, minWidth: 164 },
  { key: 'description', label: 'Description', width: 'fill', minWidth: 120 },
  { key: 'onHand', label: 'On Hand', width: 98, align: 'end' },
  { key: 'allocated', label: 'Allocated', width: 100, align: 'end' },
  { key: 'committed', label: 'Committed', width: 112, align: 'end', priority: 2 },
  { key: 'frozen', label: 'Frozen', width: 88, align: 'end', priority: 3 },
  { key: 'available', label: 'Available', width: 100, align: 'end' },
  { key: 'location', label: 'Location', width: 104, priority: 1 },
];
export const STOCK_COLUMN_OPTIONS = ALL_COLUMNS.map(c => ({ key: c.key, label: c.label, locked: c.key === 'number' || c.key === 'warehouse' }));

const NUMBERS = ['onHand', 'allocated', 'committed', 'frozen'] as const;
const value = ({ item, stock }: StockLine, key: string): string | number => {
  if (key === 'warehouse') return stock.warehouse;
  if (key === 'number') return item.id;
  if (key === 'description') return item.name;
  if (key === 'location') return stock.location;
  if (key === 'available') return available(stock);
  return stock[key as (typeof NUMBERS)[number]];
};

/**
 * The Stock table (Figma 681:14475 on the list; 411:44083 on a record): one row per item and warehouse location,
 * a Totals row and a pager, on the Volt Data Table (its summary row carries the Totals). The location opens the
 * warehouse's Locations tab.
 */
export function StockTable({ lines, columns, label }: { lines: StockLine[]; columns?: string[]; label: string }) {
  const [sort, setSort] = useState<DataSort | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const sel = useSelection();
  useEffect(() => setPage(1), [lines.length, pageSize]);

  const shown = ALL_COLUMNS.filter(c => !columns || columns.includes(c.key));
  // Without the Description column (an item's own record), Location takes the spare width
  const cols = shown.some(c => c.width === 'fill') ? shown : shown.map(c => (c.key === 'location' ? { ...c, width: 'fill' as const, priority: undefined } : c));
  const rows = sortRows(lines, sort, value);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  // DataTable keys rows by id: a stock line's is its stock record's
  const pageRows = rows.slice((current - 1) * pageSize, current * pageSize).map(l => ({ ...l, id: l.stock.id }));
  const sum = (k: string) => rows.reduce((n, l) => n + (value(l, k) as number), 0);

  // The Totals row sums every line, not only this page
  const totals: Record<string, string> = { warehouse: 'Totals' };
  for (const k of [...NUMBERS, 'available']) totals[k] = sum(k).toLocaleString('en-US');

  return (
    <div className={styles.tableStack}>
      <DataTable
        aria-label={label}
        columns={cols}
        rows={pageRows}
        rowLabel={l => `${l.item.name} at ${l.stock.location}`}
        sort={sort}
        onSortChange={k => setSort(nextSort(k))}
        selected={pageRows.map(l => l.id).filter(id => sel.selected.has(id))}
        onSelectedChange={ids => {
          const onPage = pageRows.map(l => l.id);
          sel.setMany(onPage, false);
          sel.setMany(ids, true);
        }}
        actions={false}
        inactive={l => !l.item.active}
        empty="No stock on hand in any warehouse."
        cells={l => ({
          warehouse: l.stock.warehouse,
          number: (
            <AppLink to={itemPath(l.item.id)} size="small">
              {l.item.id}
            </AppLink>
          ),
          description: l.item.name,
          onHand: l.stock.onHand.toLocaleString('en-US'),
          allocated: l.stock.allocated.toLocaleString('en-US'),
          committed: l.stock.committed.toLocaleString('en-US'),
          frozen: l.stock.frozen.toLocaleString('en-US'),
          available: available(l.stock).toLocaleString('en-US'),
          location: (
            <AppLink to={`/app/inventory/warehouses/${encodeURIComponent(l.stock.warehouse)}?tab=locations`} size="small">
              {l.stock.location}
            </AppLink>
          ),
        })}
        summary={rows.length > 0 ? totals : undefined}
      />
      <PageTracker
        page={current}
        pageCount={pageCount}
        onPageChange={setPage}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZES}
        onPageSizeChange={setPageSize}
        maxPageButtons={5}
        label={`${label} pages`}
      />
    </div>
  );
}
