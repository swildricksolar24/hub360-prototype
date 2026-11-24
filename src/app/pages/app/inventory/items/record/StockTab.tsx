import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../../../../../components/Badge/Badge';
import { Button } from '../../../../../../components/Button/Button';
import { DataTable, type DataColumn, type DataSort } from '../../../../../../components/DataTable/DataTable';
import { Dropdown } from '../../../../../../components/Dropdown/Dropdown';
import { EditableCell } from '../../../../../../components/EditableCell/EditableCell';
import { Icon } from '../../../../../../components/Icon/Icon';
import { PageTracker } from '../../../../../../components/PageTracker/PageTracker';
import { Toast } from '../../../../../../components/Toast/Toast';
import { AppModal } from '../../../../../components/AppModal';
import { useColumnFilters } from '../../ColumnFilter';
import { codeOf } from '../../record/locationTree';
import { RowMenu } from '../../record/RowMenu';
import { count, PAGE_SIZES, Segmented, TableToolbar, useColumns } from '../../record/tableKit';
import { useLocations, useWarehouses } from '../../warehouseStore';
import { available, type Item, type StockRow, type WarehouseLevels } from '../itemData';
import { updateItem } from '../itemStore';
import { nextSort, sortRows } from '../shared';
import {
  availableIn,
  DEMAND_WINDOWS,
  demandFor,
  inTransit,
  levelsIn,
  lotOf,
  notShipped,
  openPoQty,
  orderingStatus,
  projectedRequirement,
  warehousesOf,
  type DemandWindow,
} from '../stockPlanning';
import record from '../../record.module.css';
import warehouseStyles from '../../warehouses.module.css';
import styles from '../items.module.css';

type View = 'current' | 'ordering';
const VIEWS: { value: View; label: string }[] = [
  { value: 'current', label: 'Current' },
  { value: 'ordering', label: 'Ordering' },
];

const SEARCH_PLACEHOLDER = 'Search by name or code (e.g. A-01-02)';
const UPLOAD_NOTE = 'Uploading stock from a spreadsheet isn’t part of this prototype yet.';

/* ---------- Current ---------- */

const AMOUNTS = ['onHand', 'allocated', 'committed', 'frozen', 'available'] as const;
type Amounts = Record<(typeof AMOUNTS)[number], number>;
const amountsOf = (rows: StockRow[]): Amounts => ({
  onHand: rows.reduce((t, s) => t + s.onHand, 0),
  allocated: rows.reduce((t, s) => t + s.allocated, 0),
  committed: rows.reduce((t, s) => t + s.committed, 0),
  frozen: rows.reduce((t, s) => t + s.frozen, 0),
  available: rows.reduce((t, s) => t + available(s), 0),
});

/** A Current row: a warehouse (its locations added up, with its open PO units) or one of its locations. */
type CurrentRow = Amounts & { id: string; code: string; name: string; lot: string | null; openPos: number | null; stock?: StockRow };

/**
 * Figma "CURRENT STOCKING LEVELS" (1162:37738): Warehouse / Location · Lot · On Hand · Allocated · Committed · Frozen ·
 * Available · Open POs. Open POs are per warehouse, so a location leaves it blank.
 */
const CURRENT_COLUMNS: DataColumn[] = [
  { key: 'name', label: 'Warehouse / Location', width: 'fill', minWidth: 220, filterable: true },
  { key: 'lot', label: 'Lot', width: 120, minWidth: 96, filterable: true },
  { key: 'onHand', label: 'On Hand', width: 124, minWidth: 116 },
  { key: 'allocated', label: 'Allocated', width: 128, minWidth: 124, priority: 3 },
  { key: 'committed', label: 'Committed', width: 140, minWidth: 136, priority: 2 },
  { key: 'frozen', label: 'Frozen', width: 112, minWidth: 100, priority: 4 },
  { key: 'available', label: 'Available', width: 132, minWidth: 128 },
  { key: 'openPos', label: 'Open POs', width: 132, minWidth: 124, priority: 1 },
];

/** Current › View: every location, or by what's free to pick. */
const CURRENT_VIEWS = [
  { value: 'all', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'none', label: 'None available' },
  { value: 'frozen', label: 'Frozen' },
];
const CURRENT_VIEW_TESTS: Record<string, (s: StockRow) => boolean> = {
  available: s => available(s) > 0,
  none: s => available(s) === 0,
  frozen: s => s.frozen > 0,
};

/* ---------- Ordering ---------- */

type OrderingRow = { id: string; code: string; name: string; levels: WarehouseLevels; available: number; inTransit: number; projected: number };

/**
 * Figma "ORDERING LEVELS" (1167:61541): Warehouse · Min · Reorder Pt · Max (typed in place) · Available · In Transit ·
 * Projected Requirement · Status.
 */
const ORDERING_COLUMNS: DataColumn[] = [
  { key: 'name', label: 'Warehouse', width: 'fill', minWidth: 180, filterable: true },
  { key: 'min', label: 'Min', width: 136, minWidth: 112 },
  { key: 'reorderPoint', label: 'Reorder Pt', width: 136, minWidth: 112 },
  { key: 'max', label: 'Max', width: 136, minWidth: 112 },
  { key: 'available', label: 'Available', width: 120, minWidth: 116 },
  { key: 'inTransit', label: 'In Transit', width: 124, minWidth: 116, priority: 2 },
  { key: 'projected', label: 'Projected Requirement', width: 196, minWidth: 140, priority: 1 },
  { key: 'status', label: 'Status', width: 172, minWidth: 160, filterable: true },
];
const ORDERING_VIEWS = [
  { value: 'all', label: 'All' },
  { value: 'In stock', label: 'In stock' },
  { value: 'Below reorder pt', label: 'Below reorder pt' },
];

const LEVEL_KEYS = ['min', 'reorderPoint', 'max'] as const;
const LEVEL_LABEL: Record<(typeof LEVEL_KEYS)[number], string> = { min: 'Min', reorderPoint: 'Reorder Pt', max: 'Max' };
/** Min ≤ Reorder Pt ≤ Max: the field that breaks the order shows its error. */
function levelErrors(l: WarehouseLevels): Partial<Record<(typeof LEVEL_KEYS)[number], boolean>> {
  const { min, reorderPoint: re, max } = l;
  return {
    reorderPoint: min != null && re != null && re < min,
    max: max != null && ((re != null && max < re) || (min != null && max < min)),
  };
}

/** The summary line over each table (Figma: 16px weak text, the numbers bold). */
function Summary({ items }: { items: [string, number][] }) {
  return (
    <p className={`text-medium-regular ${styles.stockSummary}`}>
      {items.map(([label, value]) => (
        <span key={label}>
          {label}: <strong>{count(value)}</strong>
        </span>
      ))}
    </p>
  );
}

/**
 * An item record's Stock tab (ITEMS.md §6): a Current | Ordering switch. Current (Figma 1162:37738) lists the item's
 * stock by warehouse, each warehouse a bold row that opens to its locations; Ordering (1167:61541) shows the Average
 * Demand tiles and each warehouse's Min / Reorder Pt / Max, saved as you type.
 */
export function StockTab({ item, onNotice }: { item: Item; onNotice: (text: string) => void }) {
  const [view, setView] = useState<View>('current');
  const [info, setInfo] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const warehouses = useWarehouses();
  const nameOf = (code: string) => {
    const w = warehouses.find(x => x.code === code);
    return w ? `${w.name} (${code})` : code;
  };
  const switcher = <Segmented label="Stock view" options={VIEWS} value={view} onChange={setView} />;

  return (
    <div className={record.tab}>
      {info && <Toast type="info" title={info} onClose={() => setInfo(null)} />}
      {view === 'current' ? (
        <CurrentView item={item} nameOf={nameOf} switcher={switcher} onInfo={setInfo} onNotice={onNotice} onAdd={() => setAdding(true)} />
      ) : (
        <OrderingView item={item} nameOf={nameOf} switcher={switcher} onInfo={setInfo} onNotice={onNotice} />
      )}
      <AddToLocationModal
        open={adding}
        item={item}
        onClose={() => setAdding(false)}
        onAdd={(code, location) => {
          updateItem(item.id, it => ({
            ...it,
            stock: [...it.stock, { id: `${it.id}-s${Date.now()}`, warehouse: code, location, onHand: 0, allocated: 0, committed: 0, frozen: 0 }],
          }));
          setAdding(false);
          onNotice(`${item.name} was added to ${location} in ${nameOf(code)}.`);
        }}
      />
    </div>
  );
}

type ViewProps = { item: Item; nameOf: (code: string) => string; switcher: ReactNode; onInfo: (text: string) => void; onNotice: (text: string) => void };

/** A pager over a list (the Stock tables page by warehouse). */
function usePaging<T>(rows: T[]) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  return {
    rows: rows.slice((current - 1) * pageSize, current * pageSize),
    setPage,
    pager: (label: string) => (
      <PageTracker
        page={current}
        pageCount={pageCount}
        onPageChange={setPage}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZES}
        onPageSizeChange={setPageSize}
        maxPageButtons={5}
        label={label}
      />
    ),
  };
}

function CurrentView({ item, nameOf, switcher, onInfo, onNotice, onAdd }: ViewProps & { onAdd: () => void }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<DataSort | undefined>();
  const [selected, setSelected] = useState<string[]>([]);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  // Figma opens the first warehouse and closes the rest; a search opens every warehouse with a match
  const [closed, setClosed] = useState<Set<string>>(() => new Set(warehousesOf(item).slice(1).map(w => w.code)));
  const cols = useColumns(CURRENT_COLUMNS);

  const q = query.trim().toLowerCase();
  const locationRow = (s: StockRow): CurrentRow => ({ id: s.id, code: s.warehouse, name: s.location, lot: lotOf(item, s), openPos: null, stock: s, ...amountsOf([s]) });
  const matchesQuery = (s: StockRow) => !q || `${nameOf(s.warehouse)} ${s.location} ${lotOf(item, s) ?? ''}`.toLowerCase().includes(q);
  const filterText = (r: CurrentRow, key: string) => (key === 'name' ? nameOf(r.code) : (r.lot ?? '—'));
  const filters = useColumnFilters(item.stock.map(locationRow), filterText);
  const groups = warehousesOf(item)
    .map(w => ({ code: w.code, rows: w.rows.filter(s => (CURRENT_VIEW_TESTS[filter]?.(s) ?? true) && matchesQuery(s) && filters.matches(locationRow(s))) }))
    .filter(w => w.rows.length > 0);
  const value = (r: CurrentRow, key: string) => (key === 'name' ? r.name : key === 'lot' ? (r.lot ?? '') : ((r[key as keyof Amounts] as number) ?? r.openPos ?? 0));
  const groupRows = sortRows(
    groups.map((g): CurrentRow & { locations: CurrentRow[] } => ({
      id: `wh:${g.code}`,
      code: g.code,
      name: nameOf(g.code),
      lot: null,
      openPos: openPoQty(item, g.code),
      ...amountsOf(g.rows),
      locations: sortRows(g.rows.map(locationRow), sort, value),
    })),
    sort?.key === 'lot' ? undefined : sort,
    value,
  );
  const paging = usePaging(groupRows);
  useEffect(() => paging.setPage(1), [filter, query, filters.filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // A warehouse opens to its locations unless it's closed (a search or filter shows every match)
  const open = (code: string) => !!q || Object.keys(filters.filters).length > 0 || !closed.has(code);
  const rows = paging.rows.flatMap(g => [g, ...(open(g.code) ? g.locations : [])]);
  const checked = item.stock.filter(s => selected.includes(s.id));
  // A warehouse row has no checkbox (Figma). It counts as checked when all its locations are, so the header's
  // select-all shows checked when every location is. Select-all (on or off) also covers a closed warehouse's locations.
  const groupsChecked = paging.rows.filter(g => g.locations.every(l => selected.includes(l.id))).map(g => g.id);
  const changeSelection = (ids: string[]) => {
    const locationsOf = (on: boolean) =>
      paging.rows.filter(g => ids.includes(g.id) === on && groupsChecked.includes(g.id) !== on).flatMap(g => g.locations.map(l => l.id));
    const removed = new Set(locationsOf(false));
    setSelected([...new Set([...ids.filter(id => !id.startsWith('wh:') && !removed.has(id)), ...locationsOf(true)])]);
  };
  const totals = amountsOf(groups.flatMap(g => g.rows));
  const toggle = (code: string) =>
    setClosed(c => {
      const next = new Set(c);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  return (
    <section className={record.card} aria-label="Current stock">
      <Summary
        items={[
          ['On Hand', totals.onHand],
          ['Allocated', totals.allocated],
          ['Committed', totals.committed],
          ['Frozen', totals.frozen],
          ['Available', totals.available],
          ['Open POs', groups.reduce((t, g) => t + openPoQty(item, g.code), 0)],
        ]}
      />
      <TableToolbar
        label="Current stock"
        lead={switcher}
        view={{ options: CURRENT_VIEWS, value: filter, onChange: setFilter }}
        onColumns={() => cols.setOpen(true)}
        onUpload={() => onInfo(UPLOAD_NOTE)}
        actions={{
          selectedCount: checked.length,
          options: [
            // Only an empty location can be taken off the item
            { value: 'remove', label: 'Remove from Location', disabled: checked.length === 0 || checked.some(s => s.onHand > 0) },
            { value: 'export', label: 'Export to CSV' },
          ],
          onAction: v => {
            if (v === 'export') return onNotice(`Exported ${checked.length || item.stock.length} stock locations to CSV.`);
            updateItem(item.id, it => ({ ...it, stock: it.stock.filter(s => !selected.includes(s.id)) }));
            onNotice(`${item.name} was removed from ${checked.length === 1 ? checked[0].location : `${checked.length} locations`}.`);
            setSelected([]);
          },
        }}
        search={{ value: query, onChange: setQuery, label: 'Search stock', placeholder: SEARCH_PLACEHOLDER }}
        trailing={
          <Button size="medium" variant="brand" onClick={onAdd}>
            Add to Location
          </Button>
        }
      />
      <div className={warehouseStyles.tableBox} ref={filters.boxRef}>
        <DataTable
          aria-label={`Stock for ${item.name}`}
          className={styles.stockGroups}
          columns={cols.columns}
          rows={rows}
          totalRows={item.stock.length}
          rowLabel={r => (r.stock ? `${r.name} in ${nameOf(r.code)}` : r.name)}
          sort={sort}
          onSortChange={k => setSort(nextSort(k))}
          {...filters.tableProps}
          selected={[...selected, ...groupsChecked]}
          onSelectedChange={changeSelection}
          striped={false}
          rowProps={r => ({ className: r.stock ? styles.stockLocationRow : styles.stockGroupRow })}
          empty={q || filter !== 'all' || Object.keys(filters.filters).length ? 'No stock matches your search or filters.' : `${item.name} isn’t stocked in any warehouse yet.`}
          onMore={r => setMenuFor(m => (m === r.id ? null : r.id))}
          renderAfterRow={r =>
            menuFor === r.id && (
              <RowMenu
                label={r.stock ? `${r.name} in ${nameOf(r.code)}` : nameOf(r.code)}
                onClose={() => setMenuFor(null)}
                items={[{ label: 'View Warehouse Stock', onSelect: () => navigate(`/app/inventory/warehouses/${encodeURIComponent(r.code)}?tab=stock`) }]}
              />
            )
          }
          cells={r => {
            if (!r.stock) {
              const isOpen = open(r.code);
              return {
                name: (
                  <span className={styles.stockGroupName}>
                    <button
                      type="button"
                      className={styles.createToggle}
                      aria-expanded={isOpen}
                      aria-label={`${isOpen ? 'Hide' : 'Show'} the locations in ${r.name}`}
                      onClick={() => toggle(r.code)}
                    >
                      <Icon name={isOpen ? 'chevron-down' : 'chevron-right'} size={16} color="currentColor" />
                    </button>
                    <strong>{r.name}</strong>
                  </span>
                ),
                lot: '',
                onHand: <strong>{count(r.onHand)}</strong>,
                allocated: <strong>{count(r.allocated)}</strong>,
                committed: <strong>{count(r.committed)}</strong>,
                frozen: <strong>{count(r.frozen)}</strong>,
                available: <strong>{count(r.available)}</strong>,
                openPos: <strong>{count(r.openPos ?? 0)}</strong>,
              };
            }
            return {
              name: (
                <span className={styles.stockLocation}>
                  <Icon name="location" size={16} color="currentColor" />
                  {r.name}
                </span>
              ),
              lot: r.lot ?? '—',
              onHand: count(r.onHand),
              allocated: count(r.allocated),
              committed: count(r.committed),
              frozen: count(r.frozen),
              available: count(r.available),
              openPos: '',
            };
          }}
        />
        {filters.popover(cols.columns)}
      </div>
      {paging.pager(`Stock for ${item.name} pages`)}
      {cols.modal}
    </section>
  );
}

function OrderingView({ item, nameOf, switcher, onInfo, onNotice }: ViewProps) {
  const [days, setDays] = useState<DemandWindow>(7);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<DataSort | undefined>();
  const cols = useColumns(ORDERING_COLUMNS);
  const projected = projectedRequirement(item, days);
  const q = query.trim().toLowerCase();

  const all: OrderingRow[] = warehousesOf(item).map(w => ({
    id: w.code,
    code: w.code,
    name: nameOf(w.code),
    levels: levelsIn(item, w.code),
    available: availableIn(item, w.code),
    inTransit: inTransit(item, w.code),
    projected: projected[w.code] ?? 0,
  }));
  const filterText = (r: OrderingRow, key: string) => (key === 'status' ? orderingStatus(item, r.code) : r.name);
  const filters = useColumnFilters(all, filterText);
  const shown = all.filter(r => (filter === 'all' || orderingStatus(item, r.code) === filter) && (!q || r.name.toLowerCase().includes(q)) && filters.matches(r));
  const value = (r: OrderingRow, key: string): string | number =>
    key === 'name' ? r.name : key === 'status' ? orderingStatus(item, r.code) : key in r.levels ? (r.levels[key as keyof WarehouseLevels] ?? -1) : (r[key as 'available'] as number);
  const sorted = sortRows(shown, sort, value);
  const paging = usePaging(sorted);
  useEffect(() => paging.setPage(1), [filter, query, filters.filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const setLevel = (code: string, key: keyof WarehouseLevels, text: string) => {
    const digits = text.replace(/[^\d]/g, '');
    updateItem(item.id, it => ({
      ...it,
      warehouseLevels: { ...it.warehouseLevels, [code]: { ...levelsIn(it, code), [key]: digits === '' ? null : Number(digits) } },
    }));
  };
  const codes = all.map(r => r.code);
  const sum = (f: (code: string) => number) => codes.reduce((t, c) => t + f(c), 0);

  return (
    <>
      {/* Figma's Average Demand tiles, over the card: the chosen one sets Projected Requirement */}
      <div className={styles.demandTiles} role="group" aria-label="Average demand">
        {DEMAND_WINDOWS.map(d => (
          <button key={d} type="button" className={styles.demandTile} aria-pressed={d === days} onClick={() => setDays(d)}>
            <span className="text-tiny-regular">
              <strong className="text-tiny-bold">{d} Day</strong> (Average Demand)
            </span>
            <span className="text-heading-3-bold">{count(demandFor(item, d))}</span>
          </button>
        ))}
      </div>
      <section className={record.card} aria-label="Ordering levels">
        <Summary
          items={[
            ['Available', sum(c => availableIn(item, c))],
            ['Open PO Qty', sum(c => openPoQty(item, c))],
            ['In Transit', sum(c => inTransit(item, c))],
            ['Not Shipped', sum(c => notShipped(item, c))],
            ['Projected Requirement', sum(c => projected[c] ?? 0)],
          ]}
        />
        <TableToolbar
          label="Ordering levels"
          lead={switcher}
          view={{ options: ORDERING_VIEWS, value: filter, onChange: setFilter }}
          onColumns={() => cols.setOpen(true)}
          onUpload={() => onInfo(UPLOAD_NOTE)}
          actions={{
            selectedCount: 0,
            options: [
              { value: 'reset', label: 'Reset Levels', disabled: !item.warehouseLevels },
              { value: 'export', label: 'Export to CSV' },
            ],
            onAction: v => {
              if (v === 'export') return onNotice(`Exported ordering levels for ${all.length} warehouses to CSV.`);
              updateItem(item.id, it => ({ ...it, warehouseLevels: undefined }));
              onNotice(`Ordering levels for ${item.name} were reset.`);
            },
          }}
          search={{ value: query, onChange: setQuery, label: 'Search warehouses', placeholder: SEARCH_PLACEHOLDER }}
          trailing={
            <Button size="medium" variant="brand" onClick={() => onInfo('Purchase orders aren’t part of this prototype yet.')}>
              Order
            </Button>
          }
        />
        <div className={warehouseStyles.tableBox} ref={filters.boxRef}>
          <DataTable
            aria-label={`Ordering levels for ${item.name}`}
            className={styles.orderingTable}
            columns={cols.columns}
            rows={paging.rows}
            totalRows={all.length}
            rowLabel={r => r.name}
            sort={sort}
            onSortChange={k => setSort(nextSort(k))}
            {...filters.tableProps}
            empty={q || filter !== 'all' || Object.keys(filters.filters).length ? 'No warehouses match your search or filters.' : `${item.name} isn’t stocked in any warehouse yet.`}
            cells={r => {
              const errors = levelErrors(r.levels);
              const status = orderingStatus(item, r.code);
              return {
                name: r.name,
                ...Object.fromEntries(
                  LEVEL_KEYS.map(k => [
                    k,
                    <EditableCell
                      key={k}
                      label={`${LEVEL_LABEL[k]} for ${r.name}`}
                      inputType="text"
                      value={r.levels[k] == null ? '' : String(r.levels[k])}
                      placeholder="—"
                      error={errors[k]}
                      onValueChange={text => setLevel(r.code, k, text)}
                    />,
                  ]),
                ),
                available: count(r.available),
                inTransit: count(r.inTransit),
                projected: count(r.projected),
                status: (
                  <Badge shape="pill" color={status === 'In stock' ? 'green' : 'amber'}>
                    {status}
                  </Badge>
                ),
              };
            }}
          />
          {filters.popover(cols.columns)}
        </div>
        {paging.pager(`Ordering levels for ${item.name} pages`)}
        {cols.modal}
      </section>
    </>
  );
}

/** Add to Location: pick a warehouse and one of its locations; the item is added there with nothing on hand. */
function AddToLocationModal({ open, item, onClose, onAdd }: { open: boolean; item: Item; onClose: () => void; onAdd: (code: string, location: string) => void }) {
  const warehouses = useWarehouses();
  const [code, setCode] = useState('');
  const [locationId, setLocationId] = useState('');
  const locations = useLocations(code);
  useEffect(() => {
    if (open) {
      setCode('');
      setLocationId('');
    }
  }, [open]);
  const stocked = new Set(item.stock.filter(s => s.warehouse === code).map(s => s.location));
  const choices = locations.filter(l => l.active).map(l => ({ id: l.id, code: codeOf(locations, l.id), name: l.name }));
  const chosen = choices.find(l => l.id === locationId);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Add to Location"
      description={`Choose where to keep ${item.name}. It starts with nothing on hand.`}
      width={640}
      primaryAction={{ label: 'Add to Location', disabled: !chosen, onClick: () => chosen && onAdd(code, chosen.code) }}
    >
      <div className={styles.addLocationBody}>
        <Dropdown
          label="Warehouse"
          required
          placeholder="Select a warehouse"
          options={warehouses.filter(w => w.active).map(w => ({ value: w.code, label: `${w.name} (${w.code})` }))}
          value={code || null}
          onChange={v => {
            setCode(v as string);
            setLocationId('');
          }}
        />
        <Dropdown
          label="Location"
          required
          placeholder={code ? 'Select a location' : 'Select a warehouse first'}
          disabled={!code}
          options={choices.map(l => ({
            value: l.id,
            label: `${l.code} · ${l.name}${stocked.has(l.code) ? ' (already stocked here)' : ''}`,
            disabled: stocked.has(l.code),
          }))}
          value={locationId || null}
          onChange={v => setLocationId(v as string)}
        />
      </div>
    </AppModal>
  );
}
