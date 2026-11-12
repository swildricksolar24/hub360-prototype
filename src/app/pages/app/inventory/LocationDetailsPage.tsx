import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../../components/Button/Button';
import { DataTable, type DataColumn } from '../../../../components/DataTable/DataTable';
import { Dropdown } from '../../../../components/Dropdown/Dropdown';
import { Icon } from '../../../../components/Icon/Icon';
import { TextArea } from '../../../../components/TextArea/TextArea';
import { TextInput } from '../../../../components/TextInput/TextInput';
import { AppLink } from '../../../components/AppLink';
import { AppModal } from '../../../components/AppModal';
import { RecordActions, RecordPage } from '../../../components/RecordPage';
import { SearchItemsModal } from './record/ItemModals';
import { LocationFormModal, RemoveLocationModal, RuleToggle, parentOptions } from './record/LocationModals';
import { LocationTree } from './record/LocationStructure';
import { createLocation, removeLocation } from './record/LocationsTab';
import { canMoveUnder, codeOf, depthOf, descendantIds, flattenTree, moveUnder, pathOf } from './record/locationTree';
import { RowMenu } from './record/RowMenu';
import { STOCK_COLUMNS, STOCK_VIEWS, STOCK_VIEW_TESTS, StockTable, useStockTable, useStockView, type StockView } from './record/StockTab';
import { Pager, Segmented, StatusPill, TableToolbar, useColumns, useTableControls } from './record/tableKit';
import type { Warehouse } from './warehouseData';
import { LOCATION_TYPES, MAX_LOCATION_DEPTH, type CatalogItem, type WarehouseLocation } from './warehouseRecordData';
import {
  locationPath,
  recordPath,
  setLocations,
  setStock,
  setWarehouseItems,
  useCatalog,
  useLocations,
  useStock,
  useWarehouseItems,
  useWarehouses,
} from './warehouseStore';
import styles from './record.module.css';
import listStyles from './warehouses.module.css';
import { Toast } from '../../../../components/Toast/Toast';

const LIST_PATH = '/app/inventory/warehouses';

/** The Location Details card's fields; the header's Save saves them. */
type Draft = { name: string; type: string; description: string; code: string; capacity: string; parentId: string | null };
const toDraft = (l: WarehouseLocation, list: WarehouseLocation[]): Draft => ({
  name: l.name,
  type: l.type,
  description: l.description,
  code: codeOf(list, l.id),
  capacity: l.capacity ?? '',
  parentId: l.parentId,
});

const required = (text: string): ReactNode => (
  <>
    {text} <span className={styles.requiredMark}>*</span>
  </>
);

/**
 * Inventory › Warehouses › a warehouse › one location (WAREHOUSE_RECORD.md 5c; Figma "Location Details" 421:13272 and
 * its Structure sub-tab 570:34435), at /app/inventory/warehouses/:code/locations/:locationId. The Tier 3 header with
 * the full action set, the Location Details card (saved by Save), and a card that switches between the items in this
 * location (Overview), their stock and the location's sublocations (Structure).
 */
export function LocationDetailsPage() {
  const { code = '', locationId = '' } = useParams();
  const navigate = useNavigate();
  const warehouses = useWarehouses();
  const warehouse: Warehouse | undefined = warehouses.find(w => w.code === code);
  const locations = useLocations(code);
  const stock = useStock(code);
  const location = locations.find(l => l.id === locationId);

  const [draft, setDraft] = useState<Draft | null>(() => (location ? toDraft(location, locations) : null));
  // Figma 857:28345: the details are read-only until the header's Edit (872:62836)
  const [editing, setEditing] = useState(false);
  const [tried, setTried] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [statusChange, setStatusChange] = useState<boolean | null>(null);
  const [removing, setRemoving] = useState(false);
  const [addingUnder, setAddingUnder] = useState<string | null>(null);

  // Another location (‹ / ›, or a sublocation's edit) starts from its own saved details
  useEffect(() => {
    setDraft(location ? toDraft(location, locations) : null);
    setTried(false);
    setNotice(null);
    setEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, locationId]);

  if (!warehouse || !location || !draft) {
    return (
      <div className={styles.notFound}>
        <Icon name="location" size={32} />
        <p className="text-large-bold">{warehouse ? 'Location not found' : 'Warehouse not found'}</p>
        <p className="text-medium-regular">
          {warehouse ? (
            <>
              {warehouse.name} has no location with this ID. <AppLink to={recordPath(warehouse, 'locations')}>Back to its locations</AppLink>
            </>
          ) : (
            <>
              There’s no warehouse with the system ID “{code}”. <AppLink to={LIST_PATH}>Back to Warehouses</AppLink>
            </>
          )}
        </p>
      </div>
    );
  }
  const w = warehouse;
  const l = location;

  const name = draft.name.trim();
  const errors = {
    name: !name
      ? 'Enter a location name'
      : locations.some(x => x.id !== l.id && x.parentId === l.parentId && x.name.toLowerCase() === name.toLowerCase())
        ? `There’s already a location named “${name}” here`
        : undefined,
    type: !draft.type ? 'Choose a type' : undefined,
    code: !draft.code.trim()
      ? 'Enter a code'
      : locations.some(x => x.id !== l.id && codeOf(locations, x.id).toLowerCase() === draft.code.trim().toLowerCase())
        ? `Another location already has the code “${draft.code.trim()}”`
        : undefined,
    parent: draft.parentId !== l.parentId && !canMoveUnder(locations, l.id, draft.parentId) ? `It can’t move there: the tree would be deeper than ${MAX_LOCATION_DEPTH} levels` : undefined,
  };
  function save() {
    if (!draft) return;
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    const fields = { name, type: draft.type, description: draft.description.trim(), code: draft.code.trim(), capacity: draft.capacity.trim() || undefined };
    setLocations(code, list => {
      const moved = draft.parentId !== l.parentId ? moveUnder(list, l.id, draft.parentId) : list;
      return moved.map(x => (x.id === l.id ? { ...x, ...fields } : x));
    });
    setEditing(false);
    setTried(false);
    setNotice(`${name} was saved.`);
  }
  function cancelEditing() {
    setDraft(toDraft(l, locations));
    setTried(false);
    setEditing(false);
  }
  const toggleRule = (rule: 'frozen' | 'nonPickable') => {
    setLocations(code, list => list.map(x => (x.id === l.id ? { ...x, [rule]: !l[rule] } : x)));
    setNotice(`${l.name} is ${l[rule] ? 'no longer ' : ''}${rule === 'frozen' ? 'frozen' : 'non-pickable'}.`);
  };
  const set =
    <K extends keyof Draft>(key: K) =>
    (value: Draft[K]) =>
      setDraft(d => (d ? { ...d, [key]: value } : d));

  // Previous / next location in tree order, reusing this app tab
  const order = flattenTree(locations).map(r => r.location);
  const index = order.findIndex(x => x.id === l.id);
  const go = (to: WarehouseLocation | undefined) => (to ? () => navigate(locationPath(code, to.id), { state: { replaceTab: true } }) : undefined);

  // The breadcrumb runs through the warehouse and the locations above this one
  const ancestors: WarehouseLocation[] = [];
  for (let p = locations.find(x => x.id === l.parentId); p; p = locations.find(x => x.id === p!.parentId)) ancestors.unshift(p);
  const canAddSub = depthOf(locations, l.id) < MAX_LOCATION_DEPTH;
  const subtreeIds = [l.id, ...descendantIds(locations, l.id)];

  const content = (
    <div className={styles.tab}>
      {notice && <Toast type="success" title={notice} onClose={() => setNotice(null)} />}

      {/* Figma 857:28345: the Location Details card (read-only until Edit) beside the Rules card */}
      <div className={styles.locationTop}>
        <section className={styles.card} aria-labelledby="loc-details-title">
          <div className={styles.cardHead}>
            <h2 id="loc-details-title" className={styles.cardTitle}>
              Location Details
            </h2>
            <Button size="small" variant="primary" icon="document" onClick={() => setNotice(`The barcode label for ${l.name} (${codeOf(locations, l.id)}) was sent to the label printer.`)}>
              Print Label
            </Button>
          </div>
          {editing ? (
            <form
              className={styles.form}
              noValidate
              onSubmit={e => {
                e.preventDefault();
                save();
              }}
            >
              <div className={styles.halves}>
                <TextInput label={required('Name')} value={draft.name} onChange={e => set('name')(e.target.value)} error={tried ? errors.name : undefined} autoComplete="off" required />
                <TextInput label={required('Code (barcode)')} value={draft.code} onChange={e => set('code')(e.target.value)} error={tried ? errors.code : undefined} autoComplete="off" required />
                <Dropdown
                  label="Type *"
                  placeholder="Select"
                  options={LOCATION_TYPES.map(t => ({ value: t, label: t }))}
                  value={draft.type || null}
                  onChange={v => set('type')(v as string)}
                  error={tried ? errors.type : undefined}
                  required
                />
                <Dropdown
                  label="Parent location"
                  options={[
                    { value: '', label: `Top level (${w.name})` },
                    ...parentOptions(locations).filter(o => o.value !== l.id && !descendantIds(locations, l.id).includes(o.value)),
                  ]}
                  value={draft.parentId ?? ''}
                  onChange={v => set('parentId')((v as string) || null)}
                  error={tried ? errors.parent : undefined}
                />
              </div>
              <TextArea label="Description" value={draft.description} onChange={e => set('description')(e.target.value)} />
              <TextInput label="Capacity (optional)" value={draft.capacity} placeholder="e.g. 1 pallet · 2,500 lb" onChange={e => set('capacity')(e.target.value)} autoComplete="off" />
              <button type="submit" hidden />
            </form>
          ) : (
            <dl className={styles.locationFields}>
              <div className={styles.field}>
                <dt className="text-tiny-regular">Name</dt>
                <dd className="text-medium-bold">{l.name}</dd>
              </div>
              <div className={styles.field}>
                <dt className="text-tiny-regular">Code (barcode)</dt>
                <dd className="text-medium-bold">{codeOf(locations, l.id)}</dd>
              </div>
              <div className={styles.field}>
                <dt className="text-tiny-regular">Type</dt>
                <dd className="text-medium-bold">{l.type || '—'}</dd>
              </div>
              <div className={styles.field}>
                <dt className="text-tiny-regular">Parent location</dt>
                <dd className="text-medium-bold">{l.parentId ? pathOf(locations, l.parentId) : `Top level (${w.name})`}</dd>
              </div>
              <div className={styles.field} data-wide>
                <dt className="text-tiny-regular">Description</dt>
                <dd className="text-medium-bold">{l.description || '—'}</dd>
              </div>
              <div className={styles.field} data-wide>
                <dt className="text-tiny-regular">Capacity (optional)</dt>
                <dd className="text-medium-bold">{l.capacity || '—'}</dd>
              </div>
            </dl>
          )}
        </section>

        <section className={styles.card} aria-labelledby="loc-rules-title">
          <div className={styles.cardHead}>
            <h2 id="loc-rules-title" className={styles.cardTitle}>
              Rules
            </h2>
          </div>
          <RuleToggle label="Frozen" description="Blocks all stock movement in and out, e.g. during a cycle count." on={l.frozen} onChange={() => toggleRule('frozen')} />
          <RuleToggle label="Non-pickable" description="Stock here is counted but left out of pick lists, e.g. returns or QC." on={l.nonPickable} onChange={() => toggleRule('nonPickable')} />
        </section>
      </div>

      <LocationContents code={code} location={l} locations={locations} onNotice={setNotice} onAddSublocation={setAddingUnder} />
    </div>
  );

  return (
    <>
      <RecordPage
        title={l.name.toUpperCase()}
        icon="location"
        breadcrumb={[
          { label: 'Inventory' },
          { label: 'Warehouses', to: LIST_PATH },
          { label: w.name, to: recordPath(w, 'locations') },
          ...ancestors.map(a => ({ label: a.name, to: locationPath(code, a.id) })),
          { label: l.name },
        ]}
        meta={
          <>
            WAREHOUSE: <strong>{w.code}</strong>
          </>
        }
        actions={
          <RecordActions
            active={l.active}
            onActiveChange={on => setStatusChange(on)}
            options={[
              l.active ? { value: 'deactivate', label: 'Deactivate' } : { value: 'activate', label: 'Activate' },
              ...(canAddSub ? [{ value: 'add-sub', label: 'Add Sublocation' }] : []),
              { value: 'export', label: 'Export' },
              { value: 'delete', label: 'Delete' },
            ]}
            onAction={value => {
              if (value === 'activate' || value === 'deactivate') setStatusChange(value === 'activate');
              else if (value === 'add-sub') setAddingUnder(l.id);
              else if (value === 'export') setNotice(`Exported ${l.name} to CSV.`);
              else if (value === 'delete') setRemoving(true);
            }}
            // Edit opens the details for editing; while editing the button saves them, with Cancel beside it
            saveLabel={editing ? 'Save' : 'Edit'}
            onSave={editing ? save : () => setEditing(true)}
            onCancel={editing ? cancelEditing : undefined}
            onPrevious={go(order[index - 1])}
            onNext={go(order[index + 1])}
          />
        }
        sections={[{ id: 'details', label: 'Details', content }]}
      />

      <AppModal
        open={statusChange !== null}
        onClose={() => setStatusChange(null)}
        title={statusChange ? 'Confirm Activation' : 'Confirm Deactivation'}
        description={
          <>
            You are about to <strong className={listStyles.verb}>{statusChange ? 'ACTIVATE' : 'DEACTIVATE'}</strong> this location. This
            change will take effect immediately. Do you want to continue?
          </>
        }
        primaryAction={{
          label: 'Confirm',
          onClick: () => {
            const active = statusChange === true;
            setLocations(code, list => list.map(x => (x.id === l.id ? { ...x, active } : x)));
            setNotice(`${l.name} ${active ? 'activated' : 'deactivated'}.`);
            setStatusChange(null);
          },
        }}
      />
      <LocationFormModal
        open={addingUnder !== null}
        sublocation
        parentId={addingUnder}
        locations={locations}
        onClose={() => setAddingUnder(null)}
        onCreate={fields => {
          const created = createLocation(code, fields);
          setNotice(`${created.name} added to ${locations.find(x => x.id === fields.parentId)?.name ?? l.name}.`);
          setAddingUnder(null);
        }}
      />
      <RemoveLocationModal
        location={removing ? l : null}
        locations={locations}
        stockCount={stock.filter(s => subtreeIds.includes(s.locationId)).length}
        onClose={() => setRemoving(false)}
        onConfirm={() => {
          setRemoving(false);
          navigate(recordPath(w, 'locations'), { state: { replaceTab: true } });
          removeLocation(code, locations, l);
        }}
      />
    </>
  );
}

/* ---------- Overview | Stock | Structure ---------- */

/** An item stocked in this location or one of its sublocations (one row per stock record). */
type LocationItem = { id: string; item?: CatalogItem; location?: WarehouseLocation; active: boolean };

// On the Volt Data Table: on a narrow card the columns shrink to their minWidth, then hide by priority (Sub Category,
// then Category, then Type), so the table fits the card down to a 1024px window
const OVERVIEW_COLUMNS: DataColumn[] = [
  { key: 'location', label: 'Location', width: 100, minWidth: 90 },
  // Wide enough for the longest item number on one line (115px + the cell's 16px padding)
  { key: 'number', label: 'Item #', width: 136, minWidth: 132 },
  { key: 'name', label: 'Name', width: 'fill', minWidth: 120 },
  { key: 'type', label: 'Type', width: 84, minWidth: 76, priority: 1 },
  { key: 'category', label: 'Category', width: 116, minWidth: 100, priority: 2 },
  { key: 'subCategory', label: 'Sub Category', width: 120, minWidth: 110, priority: 3 },
  // Figma: the status pill has no header, and sits right before the ••• button
  { key: 'status', label: 'Status', width: 108, align: 'end', labelHidden: true, sortable: false },
];
const OVERVIEW_VIEWS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];
type Mode = 'overview' | 'stock' | 'structure';

/**
 * Location Details' second card: a toolbar with the Overview | Stock | Structure switch, then the items in this
 * location and its sublocations (Overview, Figma's table), their stock (the Stock tab's table, filtered; not designed
 * in Figma) or this location's part of the Locations › Structure tree.
 */
function LocationContents({
  code,
  location,
  locations,
  onNotice,
  onAddSublocation,
}: {
  code: string;
  location: WarehouseLocation;
  locations: WarehouseLocation[];
  onNotice: (text: string) => void;
  onAddSublocation: (parentId: string) => void;
}) {
  const navigate = useNavigate();
  const catalog = useCatalog();
  const items = useWarehouseItems(code);
  const [mode, setMode] = useState<Mode>('overview');
  const [view, setView] = useState('all');
  const [treeQuery, setTreeQuery] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [removing, setRemoving] = useState<StockView | null>(null);

  const ids = useMemo(() => new Set([location.id, ...descendantIds(locations, location.id)]), [locations, location.id]);
  const stockRows = useStockView(code, ids);
  const rows: LocationItem[] = stockRows.map(s => ({
    id: s.id,
    item: s.item,
    location: s.location,
    // An item's status is the warehouse's (Items tab); one the warehouse doesn't list counts as active
    active: items.find(i => i.id === s.itemId)?.active ?? true,
  }));

  const t = useTableControls(rows, {
    search: r => `${r.location?.name ?? ''} ${r.item?.number ?? ''} ${r.item?.name ?? ''} ${r.item?.type ?? ''} ${r.item?.category ?? ''} ${r.item?.subCategory ?? ''}`,
    sortValue: (r, key) =>
      key === 'location' ? (r.location?.name ?? '') : String(r.item?.[key as keyof CatalogItem] ?? ''),
    filter: r => mode !== 'overview' || view === 'all' || r.active === (view === 'active'),
  });
  const st = useStockTable(
    // Stock › View: the same options as the warehouse's Stock tab (Available, Stocked, Below Reorder…)
    mode !== 'stock' ? stockRows : stockRows.filter(s => STOCK_VIEW_TESTS[view]?.(s) ?? true),
  );
  const overviewCols = useColumns(OVERVIEW_COLUMNS);
  const stockCols = useColumns(STOCK_COLUMNS);

  function changeMode(next: Mode) {
    setMode(next);
    setView('all');
    setMenuFor(null);
  }

  // Add Item: the chosen items get a stock record in this location (starting at 0), and join the warehouse's items
  const here = new Set(stockRows.filter(s => s.locationId === location.id).map(s => s.itemId));
  function addItems(list: CatalogItem[]) {
    const fresh = list.filter(i => !here.has(i.id));
    const stamp = Date.now();
    setStock(code, current => [
      ...current,
      ...fresh.map((i, n) => ({ id: `st-${stamp}-${n}`, itemId: i.id, locationId: location.id, onHand: 0, allocated: 0, committed: 0, frozen: 0 })),
    ]);
    setWarehouseItems(code, current => [...current, ...fresh.filter(i => !current.some(c => c.id === i.id)).map(i => ({ ...i, active: true }))]);
    return fresh.length;
  }

  const search =
    mode === 'overview'
      ? { value: t.query, onChange: t.setQuery, label: 'Search items in this location' }
      : mode === 'stock'
        ? { value: st.query, onChange: st.setQuery, label: 'Search stock in this location' }
        : { value: treeQuery, onChange: setTreeQuery, label: 'Search sublocations' };
  const selectedCount = mode === 'overview' ? t.selectedRows.length : mode === 'stock' ? st.selectedRows.length : 0;
  const canAddSub = depthOf(locations, location.id) < MAX_LOCATION_DEPTH;

  return (
    <section className={styles.card} aria-label={`${location.name} contents`}>
      {info && <Toast type="info" title={info} onClose={() => setInfo(null)} />}
      <TableToolbar
        label={`${location.name} contents`}
        lead={
          <Segmented
            label="Show"
            options={[
              // Figma 857:28345: Tree (the sublocations), Flat List (the items here) and Stock
              { value: 'structure', label: 'Tree' },
              { value: 'overview', label: 'Flat List' },
              { value: 'stock', label: 'Stock' },
            ]}
            value={mode}
            onChange={changeMode}
          />
        }
        view={mode === 'structure' ? undefined : { options: mode === 'overview' ? OVERVIEW_VIEWS : STOCK_VIEWS, value: view, onChange: setView }}
        onColumns={mode === 'overview' ? () => overviewCols.setOpen(true) : mode === 'stock' ? () => stockCols.setOpen(true) : undefined}
        onUpload={() => setInfo('Uploading from a spreadsheet isn’t part of this prototype yet.')}
        actions={{
          selectedCount,
          options: [{ value: 'export', label: 'Export to CSV' }],
          onAction: () =>
            onNotice(
              mode === 'structure'
                ? `Exported the structure of ${location.name} to CSV.`
                : `Exported ${selectedCount || (mode === 'overview' ? t.rows.length : st.rows.length)} ${mode === 'overview' ? 'items' : 'stock records'} to CSV.`,
            ),
        }}
        search={search}
        trailing={
          mode === 'structure' ? (
            <Button size="small" variant="brand" icon="plus" disabled={!canAddSub} onClick={() => onAddSublocation(location.id)}>
              Add Sublocation
            </Button>
          ) : (
            <Button size="small" variant="brand" icon="plus" onClick={() => setSearching(true)}>
              Add Item
            </Button>
          )
        }
      />

      {mode === 'structure' && (
        <LocationTree
          locations={locations}
          rootId={location.id}
          query={treeQuery}
          onChange={next => setLocations(code, () => next)}
          onAddChild={onAddSublocation}
          onEdit={x => navigate(locationPath(code, x.id))}
        />
      )}

      {mode === 'stock' && <StockTable code={code} t={st} columns={stockCols.columns} label={`Stock in ${location.name}`} onNotice={onNotice} />}

      {mode === 'overview' && (
        <>
          {/* Volt Data Table (Figma "Data Table" page), as on the warehouse's Locations, Contacts and Printers */}
          <DataTable
            aria-label={`Items in ${location.name}`}
            className={styles.statusStart}
            columns={overviewCols.columns}
            rows={t.pageRows}
            rowLabel={r => `${r.item?.name ?? 'Unknown item'} in ${r.location?.name ?? 'a removed location'}`}
            sort={t.headerProps.sort}
            onSortChange={t.headerProps.onSortChange}
            {...t.selectProps}
            inactive={r => !r.active}
            empty={rows.length === 0 ? 'Nothing is stored here yet. Use Add Item to add an item.' : 'No items match your search or view.'}
            onMore={r => setMenuFor(m => (m === r.id ? null : r.id))}
            renderAfterRow={r => {
              if (menuFor !== r.id) return null;
              const name = r.item?.name ?? 'Unknown item';
              const where = r.location?.name ?? 'a removed location';
              const stockRow = stockRows.find(s => s.id === r.id);
              return (
                <RowMenu
                  label={`${name} in ${where}`}
                  onClose={() => setMenuFor(null)}
                  items={[
                    ...(r.location && r.location.id !== location.id ? [{ label: 'View Location', onSelect: () => navigate(locationPath(code, r.location!.id)) }] : []),
                    { label: 'View in Items', onSelect: () => navigate('/app/inventory/items') },
                    { label: 'Remove from Location', onSelect: () => stockRow && setRemoving(stockRow) },
                  ]}
                />
              );
            }}
            cells={r => ({
              // A sublocation links to its own Location Details; this location is the page itself
              location:
                r.location && r.location.id !== location.id ? (
                  <AppLink to={locationPath(code, r.location.id)} size="small">
                    {r.location.name}
                  </AppLink>
                ) : (
                  (r.location?.name ?? 'a removed location')
                ),
              number: r.item?.number ?? '—',
              name: r.item?.name ?? 'Unknown item',
              type: r.item?.type ?? '—',
              category: r.item?.category || '—',
              subCategory: r.item?.subCategory || '—',
              status: <StatusPill active={r.active} />,
            })}
          />
          <Pager table={t} label="Item pages" />
        </>
      )}

      {overviewCols.modal}
      {stockCols.modal}
      <SearchItemsModal
        open={searching}
        title="Add Item"
        items={catalog.filter(i => !here.has(i.id))}
        onClose={() => setSearching(false)}
        onPick={item => {
          addItems([item]);
          onNotice(`${item.name} added to ${location.name}.`);
          setSearching(false);
        }}
        onPickAll={list => {
          const n = addItems(list);
          onNotice(`${n} item${n === 1 ? '' : 's'} added to ${location.name}.`);
          setSearching(false);
        }}
      />
      <AppModal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove item from location?"
        description={
          removing &&
          `${removing.item?.name ?? 'This item'} will be removed from ${removing.location?.name ?? 'this location'}, along with its stock record (${removing.onHand.toLocaleString('en-US')} on hand). The item stays in the warehouse’s Items. This action cannot be undone.`
        }
        primaryAction={{
          label: 'Remove Item',
          danger: true,
          onClick: () => {
            if (removing) {
              setStock(code, list => list.filter(s => s.id !== removing.id));
              onNotice(`${removing.item?.name ?? 'Item'} removed from ${removing.location?.name ?? 'this location'}.`);
            }
            setRemoving(null);
          },
        }}
      />
    </section>
  );
}
