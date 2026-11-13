import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type DataColumn } from '../../../../../components/DataTable/DataTable';
import { AppLink } from '../../../../components/AppLink';
import { HelperToggle, PrototypeHelper } from '../../../../shell/PrototypeHelper';
import { useHelperFlag } from '../../../../shell/helperFlags';
import { availableOf, belowReorder, type CatalogItem, type StockRow, type WarehouseLocation } from '../warehouseRecordData';
import { locationPath, setStock, useCatalog, useLocations, useStock } from '../warehouseStore';
import { RowMenu } from './RowMenu';
import { FilterBox, Pager, StatusPill, TableToolbar, count, useColumns, useTableControls, viewInItems, type TableControls } from './tableKit';
import styles from '../record.module.css';
import table from '../table.module.css';
import { Toast } from '../../../../../components/Toast/Toast';

/** A stock record with its item and location looked up. */
export type StockView = StockRow & { item?: CatalogItem; location?: WarehouseLocation; available: number; active: boolean };

const QUANTITIES = ['onHand', 'allocated', 'committed', 'frozen', 'available'] as const;

// Each quantity column is as narrow as its header (label + sort icon). On a narrow card the columns shrink to their
// minWidth, then hide by priority (useFittingColumns): Frozen, then Committed, then Reorder Pt, then Location. Columns
// can hide more.
export const STOCK_COLUMNS: DataColumn[] = [
  // Wide enough for the longest item number on one line ("0004-5896-4521": 115px + the cell's 16px padding)
  { key: 'number', label: 'Item #', width: 136, minWidth: 132 },
  { key: 'description', label: 'Description', width: 'fill', minWidth: 120 },
  { key: 'onHand', label: 'On Hand', width: 100, align: 'end' },
  { key: 'allocated', label: 'Allocated', width: 106, align: 'end' },
  { key: 'committed', label: 'Committed', width: 116, align: 'end', priority: 3 },
  { key: 'frozen', label: 'Frozen', width: 88, align: 'end', priority: 4 },
  { key: 'available', label: 'Available', width: 104, align: 'end' },
  // What View › Below Reorder compares Available with (shortened as on the Inventory Dashboard's Low Stock table)
  { key: 'reorderPoint', label: 'Reorder Pt', width: 112, align: 'end', priority: 2 },
  // Location and Status repeat across stock records, so they filter (a checkbox list of their values)
  { key: 'location', label: 'Location', width: 96, priority: 1, filterable: true },
  // Active / Inactive (Stock › Actions › Activate / Deactivate): the status dot and word, as on the other tables
  { key: 'status', label: 'Status', width: 110, filterable: true },
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
      active: s.active !== false,
    }));
}

/**
 * Stock › View: All, by availability, or by stock level against each record's reorder point (Stocked: at or above it;
 * Below Reorder: under it).
 */
export const STOCK_VIEWS = [
  { value: 'all', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'none', label: 'None available' },
  { value: 'stocked', label: 'Stocked' },
  { value: 'belowReorder', label: 'Below Reorder' },
];
export const STOCK_VIEW_TESTS: Record<string, (s: StockView) => boolean> = {
  available: s => s.available > 0,
  none: s => s.available === 0,
  stocked: s => !belowReorder(s),
  belowReorder: s => belowReorder(s),
};

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
            : key === 'status'
              ? String(s.active)
              : key === 'reorderPoint'
                ? (s.reorderPoint ?? -1)
                : (s.location?.name ?? ''),
    filterText: (s, key) => (key === 'status' ? (s.active ? 'Active' : 'Inactive') : (s.location?.name ?? '')),
  });
}

/**
 * The Stock table (Figma 76:11638): Location links to Location Details; a Status column (Active / Inactive, as on the
 * other tables; an inactive record's values go to the weak text color); a bold Totals row (summing every row that
 * matches the search, not only this page) on the header's teal tint, then the pager.
 */
/** Activates or deactivates stock records (Stock › Actions, or a row's •••). */
export function setStockActive(code: string, ids: string[], active: boolean) {
  setStock(code, list => list.map(s => (ids.includes(s.id) ? { ...s, active } : s)));
}
export function StockTable({
  code,
  t,
  columns,
  label = 'Warehouse stock',
  noStock,
  onNotice,
}: {
  code: string;
  t: TableControls<StockView>;
  columns: DataColumn[];
  label?: string;
  /** There's no stock at all, so the empty line says "No stock here yet" even while a search is typed. */
  noStock?: boolean;
  /** Confirms a row's Activate / Deactivate. */
  onNotice?: (text: string) => void;
}) {
  const navigate = useNavigate();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  // The Totals row sums every row that matches the search, not only this page
  const totals = Object.fromEntries(QUANTITIES.map(k => [k, t.rows.reduce((sum, s) => sum + s[k], 0)])) as Record<(typeof QUANTITIES)[number], number>;
  const nameOf = (s: StockView) => `${s.item?.number ?? 'stock record'} in ${s.location?.name ?? 'unknown location'}`;

  return (
    <>
      {/* Volt Data Table (Figma "Data Table" page) with its summary row for the Totals, as on Locations and Contacts */}
      <FilterBox table={t} columns={columns}>
        <DataTable
          aria-label={label}
          className={`${table.fillNarrowest} ${styles.statusStart}`}
          columns={columns}
          rows={t.pageRows}
          rowLabel={nameOf}
          sort={t.headerProps.sort}
          onSortChange={t.headerProps.onSortChange}
          {...t.selectProps}
          {...t.filterProps}
          inactive={s => !s.active}
          empty={(t.query || t.filtered) && !noStock ? 'No stock matches your search or filters.' : 'No stock here yet.'}
          onMore={s => setMenuFor(m => (m === s.id ? null : s.id))}
          renderAfterRow={s =>
            menuFor === s.id && (
              <RowMenu
                label={nameOf(s)}
                onClose={() => setMenuFor(null)}
                items={[
                  ...(s.location ? [{ label: 'View Location', onSelect: () => navigate(locationPath(code, s.location!.id)) }] : []),
                  // The item's record in Items, when it has one
                  ...viewInItems(s.item?.name, navigate),
                  {
                    label: s.active ? 'Deactivate' : 'Activate',
                    onSelect: () => {
                      setStockActive(code, [s.id], !s.active);
                      onNotice?.(`${nameOf(s)} ${s.active ? 'deactivated' : 'activated'}.`);
                    },
                  },
                ]}
              />
            )
          }
          cells={s => ({
            number: s.item?.number ?? '—',
            description: s.item?.description || s.item?.name || '—',
            onHand: count(s.onHand),
            allocated: count(s.allocated),
            committed: count(s.committed),
            frozen: count(s.frozen),
            available: count(s.available),
            reorderPoint: s.reorderPoint === undefined ? '—' : count(s.reorderPoint),
            location: s.location ? (
              <AppLink to={locationPath(code, s.location.id)} size="small">
                {s.location.name}
              </AppLink>
            ) : (
              '—'
            ),
            status: <StatusPill active={s.active} />,
          })}
          summary={
            t.rows.length > 0
              ? {
                  number: 'Totals',
                  onHand: count(totals.onHand),
                  allocated: count(totals.allocated),
                  committed: count(totals.committed),
                  frozen: count(totals.frozen),
                  available: count(totals.available),
                }
              : undefined
          }
        />
      </FilterBox>
      <Pager table={t} label="Stock pages" />
    </>
  );
}

/**
 * Warehouse record › Stock (Figma 571:56332): the toolbar on its own card (View · Columns · Upload · Actions · Search),
 * then the stock table with its Totals row. Figma's "Create Order ▾" waits for Orders (Figma's note: "When orders get
 * built").
 */
export function StockTab({ code, onNotice }: { code: string; onNotice: (text: string) => void }) {
  const stored = useStockView(code);
  // Helper switch: no stock, so the table shows "No stock here yet" (the view only; the store keeps its rows)
  const empty = useHelperFlag('stock.empty');
  const rows = empty ? [] : stored;
  const [view, setView] = useState('all');
  const [info, setInfo] = useState<string | null>(null);
  const t = useStockTable(rows.filter(s => STOCK_VIEW_TESTS[view]?.(s) ?? true));
  const cols = useColumns(STOCK_COLUMNS);

  return (
    <div className={styles.tab}>
      {info && <Toast type="info" title={info} onClose={() => setInfo(null)} />}
      <PrototypeHelper title="Stock">
        <HelperToggle flag="stock.empty" label="No stock" />
      </PrototypeHelper>
      <section className={styles.card} aria-label="Stock tools">
        <TableToolbar
          label="Stock"
          view={{ options: STOCK_VIEWS, value: view, onChange: setView }}
          onColumns={() => cols.setOpen(true)}
          onUpload={() => setInfo('Uploading stock counts from a spreadsheet isn’t part of this prototype yet.')}
          actions={{
            selectedCount: t.selectedRows.length,
            options: [
              // Like the other tables' Actions: on the checked rows, and disabled until a row is checked
              { value: 'activate', label: 'Activate', disabled: t.selectedRows.length === 0 },
              { value: 'deactivate', label: 'Deactivate', disabled: t.selectedRows.length === 0 },
              { value: 'export', label: 'Export to CSV' },
            ],
            onAction: v => {
              if (v === 'export') return onNotice(`Exported ${t.selectedRows.length || t.rows.length} stock records to CSV.`);
              const active = v === 'activate';
              const n = t.selectedRows.length;
              setStockActive(code, t.selectedRows.map(s => s.id), active);
              onNotice(`${n} stock record${n === 1 ? '' : 's'} ${active ? 'activated' : 'deactivated'}.`);
              t.clearSelection();
            },
          }}
          search={{ value: t.query, onChange: t.setQuery, label: 'Search stock' }}
        />
      </section>
      <section className={styles.card} aria-label="Stock">
        <StockTable code={code} t={t} columns={cols.columns} noStock={rows.length === 0} onNotice={onNotice} />
      </section>
      {cols.modal}
    </div>
  );
}
