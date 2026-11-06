import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataHeader, type DataColumn } from '../../../../../components/DataHeader/DataHeader';
import { DataRow } from '../../../../../components/DataRow/DataRow';
import { AppLink } from '../../../../components/AppLink';
import { availableOf, type CatalogItem, type StockRow, type WarehouseLocation } from '../warehouseRecordData';
import { locationPath, useCatalog, useLocations, useStock } from '../warehouseStore';
import { RowMenu } from './RowMenu';
import { Pager, TableToolbar, count, useColumns, useTableControls, type TableControls } from './tableKit';
import styles from '../record.module.css';
import table from '../table.module.css';
import { Toast } from '../../../../../components/Toast/Toast';

/** A stock record with its item and location looked up. */
export type StockView = StockRow & { item?: CatalogItem; location?: WarehouseLocation; available: number };

const QUANTITIES = ['onHand', 'allocated', 'committed', 'frozen', 'available'] as const;

// Each quantity column is as narrow as its header (label + sort icon): 754 fixed + checkbox 28 + ••• 44 + 9 gaps × 16
// + 40 padding = 1010, so Description (the fill column, which wraps) is narrow at 1440px; Columns can hide some.
export const STOCK_COLUMNS: DataColumn[] = [
  { key: 'number', label: 'Item #', width: 110 },
  { key: 'description', label: 'Description', width: 'fill' },
  { key: 'onHand', label: 'On Hand', width: 100, align: 'end' },
  { key: 'allocated', label: 'Allocated', width: 106, align: 'end' },
  { key: 'committed', label: 'Committed', width: 116, align: 'end' },
  { key: 'frozen', label: 'Frozen', width: 88, align: 'end' },
  { key: 'available', label: 'Available', width: 104, align: 'end' },
  { key: 'location', label: 'Location', width: 96 },
];

/** The warehouse's stock records (optionally only those in some locations), joined to their items and locations. */
export function useStockView(code: string, locationIds?: Set<string>): StockView[] {
  const stock = useStock(code);
  const catalog = useCatalog();
  const locations = useLocations(code);
  return stock
    .filter(s => !locationIds || locationIds.has(s.locationId))
    .map(s => ({
      ...s,
      item: catalog.find(i => i.id === s.itemId),
      location: locations.find(l => l.id === s.locationId),
      available: availableOf(s),
    }));
}

/** Search and sort for the stock table. */
export function useStockTable(rows: StockView[]) {
  return useTableControls(rows, {
    search: s => `${s.item?.number ?? ''} ${s.item?.name ?? ''} ${s.item?.description ?? ''} ${s.location?.name ?? ''}`,
    sortValue: (s, key) =>
      (QUANTITIES as readonly string[]).includes(key)
        ? s[key as (typeof QUANTITIES)[number]]
        : key === 'number'
          ? (s.item?.number ?? '')
          : key === 'description'
            ? (s.item?.description ?? '')
            : (s.location?.name ?? ''),
  });
}

/**
 * The Stock table (Figma 76:11638): no status pill; Location links to Location Details; a bold Totals row (summing
 * every row that matches the search, not only this page) on the header's teal tint, then the pager.
 */
export function StockTable({
  code,
  t,
  columns,
  label = 'Warehouse stock',
}: {
  code: string;
  t: TableControls<StockView>;
  columns: DataColumn[];
  label?: string;
}) {
  const navigate = useNavigate();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const totals = Object.fromEntries(QUANTITIES.map(k => [k, t.rows.reduce((sum, s) => sum + s[k], 0)])) as Record<(typeof QUANTITIES)[number], number>;
  // The Totals row has no checkbox or •••: spacer columns (table.module.css's 28px checkbox cell, the 44px •••) keep
  // its cells under the header's
  const totalColumns: DataColumn[] = [{ key: 'lead', label: '', width: 28 }, ...columns, { key: 'end', label: '', width: 44 }];

  return (
    <>
      <div className={table.tableScroll}>
        <div role="table" aria-label={label} className={`${table.table} ${table.fillNarrowest}`}>
          <DataHeader className={table.head} corners="none" columns={columns} leading="checkbox" {...t.headerProps} />
          {t.pageRows.length === 0 && (
            <p className={`text-medium-regular ${styles.emptyRow}`}>{t.query ? 'No stock matches your search.' : 'No stock here yet.'}</p>
          )}
          {t.pageRows.map((s, i) => (
            <div key={s.id} className={table.rowWrap} data-stripe={i % 2 === 0 || undefined}>
              <DataRow
                className={table.row}
                columns={columns}
                leading="checkbox"
                cells={{
                  number: s.item?.number ?? '—',
                  description: s.item?.description || s.item?.name || '—',
                  onHand: count(s.onHand),
                  allocated: count(s.allocated),
                  committed: count(s.committed),
                  frozen: count(s.frozen),
                  available: count(s.available),
                  location: s.location ? (
                    <AppLink to={locationPath(code, s.location.id)} size="small">
                      {s.location.name}
                    </AppLink>
                  ) : (
                    '—'
                  ),
                }}
                {...t.rowSelect(s.id)}
                selectLabel={`Select ${s.item?.number ?? 'stock record'} in ${s.location?.name ?? 'unknown location'}`}
                moreLabel={`More actions for ${s.item?.number ?? 'stock record'} in ${s.location?.name ?? 'unknown location'}`}
                onMore={() => setMenuFor(m => (m === s.id ? null : s.id))}
              />
              {menuFor === s.id && (
                <RowMenu
                  label={`${s.item?.number ?? 'stock record'} in ${s.location?.name ?? 'unknown location'}`}
                  onClose={() => setMenuFor(null)}
                  items={[
                    ...(s.location ? [{ label: 'View Location', onSelect: () => navigate(locationPath(code, s.location!.id)) }] : []),
                    { label: 'View in Items', onSelect: () => navigate('/app/inventory/items') },
                  ]}
                />
              )}
            </div>
          ))}
          {t.rows.length > 0 && (
            <DataRow
              className={`${table.row} ${styles.totalsRow}`}
              columns={totalColumns}
              leading="none"
              actions={false}
              cells={{
                number: 'Totals',
                onHand: count(totals.onHand),
                allocated: count(totals.allocated),
                committed: count(totals.committed),
                frozen: count(totals.frozen),
                available: count(totals.available),
              }}
            />
          )}
        </div>
      </div>
      <Pager table={t} label="Stock pages" />
    </>
  );
}

/**
 * Warehouse record › Stock (Figma 76:11638). Figma's "Create Order ▾" is left out until Orders is built (Figma's note:
 * "When orders get built").
 */
export function StockTab({ code, onNotice }: { code: string; onNotice: (text: string) => void }) {
  const rows = useStockView(code);
  const [view, setView] = useState('all');
  const [info, setInfo] = useState<string | null>(null);
  const t = useStockTable(view === 'all' ? rows : rows.filter(s => (view === 'available' ? s.available > 0 : s.available === 0)));
  const cols = useColumns(STOCK_COLUMNS);

  return (
    <div className={styles.tab}>
      {info && <Toast type="info" title={info} onClose={() => setInfo(null)} />}
      <section className={styles.card} aria-label="Stock">
        <TableToolbar
          label="Stock"
          view={{
            options: [
              { value: 'all', label: 'All' },
              { value: 'available', label: 'Available' },
              { value: 'none', label: 'None available' },
            ],
            value: view,
            onChange: setView,
          }}
          onColumns={() => cols.setOpen(true)}
          onUpload={() => setInfo('Uploading stock counts from a spreadsheet isn’t part of this prototype yet.')}
          actions={{
            selectedCount: t.selectedRows.length,
            options: [{ value: 'export', label: t.selectedRows.length ? 'Export selected to CSV' : 'Export to CSV' }],
            onAction: () => onNotice(`Exported ${t.selectedRows.length || t.rows.length} stock records to CSV.`),
          }}
          search={{ value: t.query, onChange: t.setQuery, label: 'Search stock' }}
        />
        <StockTable code={code} t={t} columns={cols.columns} />
      </section>
      {cols.modal}
    </div>
  );
}
