import { useEffect, useState } from 'react';
import { DataHeader, type DataColumn, type DataSort } from '../../../../../components/DataHeader/DataHeader';
import { DataRow } from '../../../../../components/DataRow/DataRow';
import { PageTracker } from '../../../../../components/PageTracker/PageTracker';
import { AppLink } from '../../../../components/AppLink';
import { PAGE_SIZES } from '../record/tableKit';
import { available, type Item, type StockRow } from './itemData';
import { itemPath } from './itemStore';
import { nextSort, sortRows, useSelection } from './shared';
import table from '../table.module.css';
import record from '../record.module.css';
import styles from './items.module.css';

export type StockLine = { item: Item; stock: StockRow };

const ALL_COLUMNS: DataColumn[] = [
  { key: 'warehouse', label: 'WH', width: 64 },
  { key: 'number', label: 'Item #', width: 144 },
  { key: 'description', label: 'Description', width: 'fill' },
  { key: 'onHand', label: 'On Hand', width: 98, align: 'end' },
  { key: 'allocated', label: 'Allocated', width: 100, align: 'end' },
  { key: 'committed', label: 'Committed', width: 112, align: 'end' },
  { key: 'frozen', label: 'Frozen', width: 88, align: 'end' },
  { key: 'available', label: 'Available', width: 100, align: 'end' },
  { key: 'location', label: 'Location', width: 104 },
];
export const STOCK_COLUMN_OPTIONS = ALL_COLUMNS.map(c => ({ key: c.key, label: c.label, locked: c.key === 'number' || c.key === 'warehouse' }));

/** The checkbox column's width in table.module.css (--data-leading-width), so the Totals row lines up. */
const LEAD_WIDTH = 28;

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
 * a Totals row and a pager. The location opens the warehouse's Locations tab.
 */
export function StockTable({ lines, columns, label }: { lines: StockLine[]; columns?: string[]; label: string }) {
  const [sort, setSort] = useState<DataSort | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const sel = useSelection();
  useEffect(() => setPage(1), [lines.length, pageSize]);

  const shown = ALL_COLUMNS.filter(c => !columns || columns.includes(c.key));
  // Without the Description column (an item's own record), Location takes the spare width
  const cols = shown.some(c => c.width === 'fill') ? shown : shown.map(c => (c.key === 'location' ? { ...c, width: 'fill' as const } : c));
  const rows = sortRows(lines, sort, value);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  const pageRows = rows.slice((current - 1) * pageSize, current * pageSize);
  const key = (l: StockLine) => l.stock.id;
  const sum = (k: string) => rows.reduce((n, l) => n + (value(l, k) as number), 0);

  // The Totals row: a spacer where the checkbox sits, then the same columns
  const totalColumns: DataColumn[] = [{ key: '_lead', label: '', width: LEAD_WIDTH }, ...cols];
  const totals: Record<string, string> = { _lead: '', warehouse: 'Totals' };
  for (const k of [...NUMBERS, 'available']) totals[k] = sum(k).toLocaleString('en-US');

  return (
    <div className={styles.tableStack}>
      <div className={table.tableScroll}>
        <div role="table" aria-label={label} className={table.table}>
          <DataHeader
            className={table.head}
            corners="none"
            columns={cols}
            leading="checkbox"
            actions={false}
            sort={sort}
            onSortChange={k => setSort(nextSort(k))}
            allSelected={pageRows.length > 0 && pageRows.every(l => sel.selected.has(key(l)))}
            onSelectAllChange={on => sel.setMany(pageRows.map(key), on)}
          />
          {rows.length === 0 && <p className={`text-medium-regular ${record.emptyRow}`}>No stock on hand in any warehouse.</p>}
          {pageRows.map((l, i) => (
            <div key={key(l)} className={table.rowWrap} data-stripe={i % 2 === 0 || undefined} data-inactive={!l.item.active || undefined}>
              <DataRow
                className={table.row}
                columns={cols}
                leading="checkbox"
                actions={false}
                cells={{
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
                }}
                selected={sel.selected.has(key(l))}
                onSelectedChange={on => sel.toggle(key(l), on)}
                selectLabel={`Select ${l.item.name} at ${l.stock.location}`}
              />
            </div>
          ))}
          {rows.length > 0 && (
            <div className={`${table.rowWrap} ${styles.totals}`}>
              <DataRow className={table.row} columns={totalColumns} leading="none" actions={false} cells={totals} />
            </div>
          )}
        </div>
      </div>
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
