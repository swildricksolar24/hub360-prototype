import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, type BadgeColor } from '../../../../../components/Badge/Badge';
import { DataTable, type DataColumn, type DataSort } from '../../../../../components/DataTable/DataTable';
import { PageTracker } from '../../../../../components/PageTracker/PageTracker';
import { TwoLineCell } from '../../../../../components/TwoLineCell/TwoLineCell';
import { AppLink } from '../../../../components/AppLink';
import { ColumnFilter } from '../ColumnFilter';
import { RowMenu } from '../record/RowMenu';
import { PAGE_SIZES } from '../record/tableKit';
import { available, type Item, type StockRow } from './itemData';
import { itemPath } from './itemStore';
import { nextSort, sortRows, useSelection } from './shared';
import warehouseStyles from '../warehouses.module.css';
import styles from './items.module.css';

/** One row: an item's stock in one warehouse location, or (stock null) an item with no stock anywhere. */
export type StockLine = { item: Item; stock: StockRow | null };

/**
 * Figma "→ Items" Stock (681:14475): Item (the number, with the name under it) · Category · Warehouse · On Hand ·
 * Allocated · Committed · Frozen · Available · Status, each with a filter and sort. Location is not in Figma; it's
 * offered under Columns (and shown on an item's own Stock tab).
 */
const ALL_COLUMNS: DataColumn[] = ([
  // Never narrower than the longest full item number on one line ("PA-0002-AJ89-98HB")
  { key: 'item', label: 'Item', width: 'fill', minWidth: 172 },
  { key: 'category', label: 'Category', width: 132, minWidth: 116 },
  { key: 'warehouse', label: 'Warehouse', width: 124, minWidth: 120 },
  { key: 'onHand', label: 'On Hand', width: 108, minWidth: 104 },
  { key: 'allocated', label: 'Allocated', width: 112, minWidth: 108, priority: 3 },
  { key: 'committed', label: 'Committed', width: 120, minWidth: 116, priority: 2 },
  { key: 'frozen', label: 'Frozen', width: 96, minWidth: 92, priority: 4 },
  { key: 'available', label: 'Available', width: 112, minWidth: 108 },
  { key: 'location', label: 'Location', width: 112, minWidth: 104, priority: 1 },
  { key: 'status', label: 'Status', width: 156, minWidth: 152 },
] satisfies DataColumn[]).map(c => ({ ...c, filterable: true }));
export const STOCK_COLUMN_OPTIONS = ALL_COLUMNS.map(c => ({ key: c.key, label: c.label, locked: c.key === 'item' || c.key === 'warehouse' }));
/** The Items list's Stock view starts with Figma's columns (Location can be added under Columns). */
export const DEFAULT_STOCK_COLUMNS = STOCK_COLUMN_OPTIONS.map(c => c.key).filter(k => k !== 'location');

/** The status tag: an inactive item is "Inactive (catalog)"; otherwise its available stock against its reorder point. */
type StockStatus = 'Stocked' | 'Below reorder pt' | 'Inactive (catalog)';
const STATUS_COLOR: Record<StockStatus, BadgeColor> = { Stocked: 'green', 'Below reorder pt': 'amber', 'Inactive (catalog)': 'black' };
export function stockStatus({ item, stock }: StockLine): StockStatus {
  if (!item.active) return 'Inactive (catalog)';
  const left = stock ? available(stock) : 0;
  return left === 0 || (item.reorderPoint != null && left < item.reorderPoint) ? 'Below reorder pt' : 'Stocked';
}

const NUMBERS = ['onHand', 'allocated', 'committed', 'frozen'] as const;
const value = (line: StockLine, key: string): string | number => {
  const { item, stock } = line;
  if (key === 'item') return item.id;
  if (key === 'category') return item.category;
  if (key === 'warehouse') return stock?.warehouse ?? '';
  if (key === 'location') return stock?.location ?? '';
  if (key === 'status') return stockStatus(line);
  if (key === 'available') return stock ? available(stock) : 0;
  return stock ? stock[key as (typeof NUMBERS)[number]] : 0;
};
/** A cell's text for the column filters ("Contains…"): the Item column matches the number or the name. */
const filterText = (line: StockLine, key: string) => (key === 'item' ? `${line.item.id} ${line.item.name}` : String(value(line, key)));
const n = (v: number) => v.toLocaleString('en-US');

/**
 * The Stock table on the Volt Data Table, with column filters, a ••• per row and a pager. Used by the Items list's
 * Stock view (Figma 681:14475) and an item's Stock tab (411:44083, with `totals` for its Totals row).
 */
export function StockTable({ lines, columns, label, totals = false }: { lines: StockLine[]; columns?: string[]; label: string; totals?: boolean }) {
  const navigate = useNavigate();
  const [sort, setSort] = useState<DataSort | undefined>();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [filterOpen, setFilterOpen] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const tableRef = useRef<HTMLDivElement>(null);
  const sel = useSelection();
  useEffect(() => setPage(1), [lines.length, filters, pageSize]);

  const shown = ALL_COLUMNS.filter(c => !columns || columns.includes(c.key));
  // Without the Item column (an item's own record), Location takes the spare width
  const cols = shown.some(c => c.width === 'fill') ? shown : shown.map(c => (c.key === 'location' ? { ...c, width: 'fill' as const, priority: undefined } : c));
  const matching = lines.filter(l => Object.entries(filters).every(([key, text]) => filterText(l, key).toLowerCase().includes(text.toLowerCase())));
  const rows = sortRows(matching, sort, value);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  // DataTable keys rows by id: a stock line's is its stock record's (an item with no stock gets its own)
  const pageRows = rows.slice((current - 1) * pageSize, current * pageSize).map(l => ({ ...l, id: l.stock?.id ?? `${l.item.id}-no-stock` }));

  // The Totals row (an item's Stock tab) sums every matching line, not only this page
  const sums: Record<string, string> = { warehouse: 'Totals' };
  for (const k of [...NUMBERS, 'available']) sums[k] = n(rows.reduce((t, l) => t + (value(l, k) as number), 0));

  return (
    <div className={styles.tableStack}>
      {/* The box around the table places a column's filter pop-over under its header cell */}
      <div className={warehouseStyles.tableBox} ref={tableRef}>
        <DataTable
          aria-label={label}
          columns={cols}
          rows={pageRows}
          rowLabel={l => (l.stock ? `${l.item.name} at ${l.stock.location}` : `${l.item.name} (no stock)`)}
          sort={sort}
          onSortChange={k => setSort(nextSort(k))}
          onFilter={key => setFilterOpen(open => (open === key ? null : key))}
          activeFilters={Object.keys(filters)}
          selected={pageRows.map(l => l.id).filter(id => sel.selected.has(id))}
          onSelectedChange={ids => {
            sel.setMany(
              pageRows.map(l => l.id),
              false,
            );
            sel.setMany(ids, true);
          }}
          inactive={l => !l.item.active}
          empty={Object.keys(filters).length ? 'No stock matches these filters.' : 'No stock on hand in any warehouse.'}
          onMore={l => setMenuFor(m => (m === l.id ? null : l.id))}
          renderAfterRow={l =>
            menuFor === l.id && (
              <RowMenu
                label={l.stock ? `${l.item.name} at ${l.stock.warehouse}` : l.item.name}
                onClose={() => setMenuFor(null)}
                items={[
                  { label: 'View Item', onSelect: () => navigate(itemPath(l.item.id)) },
                  ...(l.stock
                    ? [{ label: 'View Warehouse Stock', onSelect: () => navigate(`/app/inventory/warehouses/${encodeURIComponent(l.stock!.warehouse)}?tab=stock`) }]
                    : []),
                ]}
              />
            )
          }
          cells={l => {
            const status = stockStatus(l);
            return {
              // Volt TwoLineCell: the number (it opens the record) with the name under it
              item: (
                <TwoLineCell
                  title={
                    <AppLink to={itemPath(l.item.id)} size="small">
                      {l.item.id}
                    </AppLink>
                  }
                  description={l.item.name}
                />
              ),
              category: l.item.category || '—',
              warehouse: l.stock?.warehouse ?? '—',
              onHand: n(value(l, 'onHand') as number),
              allocated: n(value(l, 'allocated') as number),
              committed: n(value(l, 'committed') as number),
              frozen: n(value(l, 'frozen') as number),
              available: n(value(l, 'available') as number),
              location: l.stock ? (
                <AppLink to={`/app/inventory/warehouses/${encodeURIComponent(l.stock.warehouse)}?tab=locations`} size="small">
                  {l.stock.location}
                </AppLink>
              ) : (
                '—'
              ),
              status: (
                <Badge shape="pill" color={STATUS_COLOR[status]}>
                  {status}
                </Badge>
              ),
            };
          }}
          summary={totals && rows.length > 0 ? sums : undefined}
        />
        {filterOpen && (
          <ColumnFilter
            key={filterOpen}
            anchor={tableRef.current?.querySelector<HTMLElement>(`[role="columnheader"][data-column="${filterOpen}"]`)}
            label={cols.find(c => c.key === filterOpen)?.label ?? ''}
            value={filters[filterOpen] ?? ''}
            onApply={text => {
              setFilters(f => {
                const next = { ...f };
                if (text.trim()) next[filterOpen] = text.trim();
                else delete next[filterOpen];
                return next;
              });
              setFilterOpen(null);
            }}
            onClose={() => setFilterOpen(null)}
          />
        )}
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
