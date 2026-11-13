import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../../components/Button/Button';
import { ButtonGroup, ButtonGroupItem } from '../../../../../components/ButtonGroup/ButtonGroup';
import { DataTable, type DataColumn, type DataSort } from '../../../../../components/DataTable/DataTable';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { Icon } from '../../../../../components/Icon/Icon';
import { Message } from '../../../../../components/Message/Message';
import { PageTracker } from '../../../../../components/PageTracker/PageTracker';
import { SearchInput } from '../../../../../components/SearchBar/SearchBar';
import { TwoLineCell } from '../../../../../components/TwoLineCell/TwoLineCell';
import { UploadFile } from '../../../../../components/UploadFile/UploadFile';
import { AppLink } from '../../../../components/AppLink';
import { AppModal } from '../../../../components/AppModal';
import { useHelperFlag } from '../../../../shell/helperFlags';
import { HelperToggle, PrototypeHelper } from '../../../../shell/PrototypeHelper';
import { RowMenu } from '../record/RowMenu';
import { PAGE_SIZES } from '../record/tableKit';
import { available, blankItem, ITEM_TYPES, unitLabel, type Item, type ItemType } from './itemData';
import { ColumnFilter, filterOptions, matchesFilters, withFilter, type ColumnFilters } from '../ColumnFilter';
import { NEW_TAB_STATE } from '../../../../shell/navigation';
import warehouseStyles from '../warehouses.module.css';
import { deactivateItem, deleteItems, itemPath, mergeItems, setItems, usedIn, useItems } from './itemStore';
import { AddItemModal, DeactivateItemModal, DeleteItemsModal, MergeItemsModal } from './ItemModals';
import { ColumnsModal, MenuButton, nextSort, sortRows, StatusPill, useSelection } from './shared';
import { DEFAULT_STOCK_COLUMNS, STOCK_COLUMN_OPTIONS, StockTable, type StockLine } from './StockTable';
import record from '../record.module.css';
import styles from './items.module.css';
import { Toast } from '../../../../../components/Toast/Toast';


// Figma "→ Items" Overview (681:14463): Item (the number, with the name under it) · Type · Category · Unit · On Hand ·
// Available · Warehouses · Status, each with a filter and sort. On a narrow card the columns shrink to their minWidth, then
// Unit, Type and Warehouses hide in that order (their header labels need room for the filter and sort icons).
const OVERVIEW_COLUMNS: DataColumn[] = [
  // Never narrower than the longest full item number on one line ("PA-0002-AJ89-98HB": 143px, + the link's 4px and the
  // cell's 16px padding)
  { key: 'item', label: 'Item', width: 'fill', minWidth: 172 },
  { key: 'type', label: 'Type', width: 116, minWidth: 100, priority: 2, filterable: true },
  { key: 'category', label: 'Category', width: 140, minWidth: 128, filterable: true },
  { key: 'unit', label: 'Unit', width: 100, minWidth: 96, priority: 3, filterable: true },
  { key: 'onHand', label: 'On Hand', width: 124, minWidth: 124 },
  { key: 'available', label: 'Available', width: 126, minWidth: 126 },
  { key: 'warehouses', label: 'Warehouses', width: 146, minWidth: 146, priority: 1 },
];
const OVERVIEW_OPTIONS = OVERVIEW_COLUMNS.map(c => ({ key: c.key, label: c.label, locked: c.key === 'item' }));
const STATUS_COLUMN: DataColumn = { key: 'status', label: 'Status', width: 120, minWidth: 108, filterable: true };

const onHandOf = (i: Item) => i.stock.reduce((n, s) => n + s.onHand, 0);
const availableOf = (i: Item) => i.stock.reduce((n, s) => n + available(s), 0);
const warehousesOf = (i: Item) => new Set(i.stock.map(s => s.warehouse)).size;
const count = (n: number) => n.toLocaleString('en-US');

/** View ▾: saved filters of the list. */
const VIEWS: { value: string; label: string; test: (i: Item) => boolean }[] = [
  { value: 'all', label: 'All', test: () => true },
  { value: 'active', label: 'Active', test: i => i.active },
  { value: 'inactive', label: 'Inactive', test: i => !i.active },
  { value: 'Part', label: 'Parts', test: i => i.type === 'Part' },
  { value: 'Assembly', label: 'Assemblies', test: i => i.type === 'Assembly' },
  { value: 'Kit', label: 'Kits', test: i => i.type === 'Kit' },
];

const NO_ITEMS: Item[] = [];

/** A cell's value for sorting (numbers stay numbers). */
const cellValue = (i: Item, key: string): string | number =>
  key === 'item'
    ? i.id
    : key === 'status'
      ? (i.active ? 1 : 0)
      : key === 'unit'
        ? unitLabel(i.unitType)
        : key === 'onHand'
          ? onHandOf(i)
          : key === 'available'
            ? availableOf(i)
            : key === 'warehouses'
              ? warehousesOf(i)
              : String(i[key as 'type' | 'category'] ?? '');
/** A cell's text for the column filters' value lists: the Item column lists item names. */
const filterText = (i: Item, key: string) =>
  key === 'item' ? i.name : key === 'status' ? (i.active ? 'Active' : 'Inactive') : String(cellValue(i, key));

/**
 * Inventory › Items (ITEMS.md §1; Figma "→ Items" 681:14463 Overview, 681:14475 Stock): one list of parts, assemblies
 * and kits. A toolbar (Overview | Stock, view, columns, upload, actions, search, Add New ▾), the table and a pager,
 * plus the Add, Merging and Deleting modals.
 */
export function ItemsPage() {
  const items = useItems();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [mode, setMode] = useState<'overview' | 'stock'>('overview');
  const [view, setView] = useState('all');
  const [query, setQuery] = useState('');
  // Column filters (each header's filter icon): the values checked per column
  const [filters, setFilters] = useState<ColumnFilters>({});
  const [filterOpen, setFilterOpen] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useState<DataSort | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [columns, setColumns] = useState(OVERVIEW_COLUMNS.map(c => c.key));
  const [stockColumns, setStockColumns] = useState(DEFAULT_STOCK_COLUMNS);
  const sel = useSelection();

  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [adding, setAdding] = useState<ItemType | null>(null);
  const [merging, setMerging] = useState<Item[] | null>(null);
  const [deleting, setDeleting] = useState<Item[] | null>(null);
  // Items waiting to be deactivated (a row's ••• › Deactivate, or Actions › Deactivate on the checked rows)
  const [deactivating, setDeactivating] = useState<Item[]>([]);
  const deactivated = useRef<string[]>([]);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const keepLoading = useHelperFlag('items.loading');
  const noItems = useHelperFlag('items.empty');
  // Helper switch: "No items" lists none (the store keeps them)
  const shown = noItems ? NO_ITEMS : items;
  // Helper switch: "Keep loading" holds the skeleton
  const showLoading = loading || keepLoading;

  useEffect(() => {
    document.title = 'HUB360 · Items';
    // A short loading state, as if the list came from the server
    const t = window.setTimeout(() => setLoading(false), 500);
    return () => window.clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const test = VIEWS.find(v => v.value === view)?.test ?? (() => true);
    return shown.filter(
      i =>
        test(i) &&
        (!q || `${i.id} ${i.customNumber} ${i.name} ${i.type} ${i.category} ${i.subcategory}`.toLowerCase().includes(q)) &&
        matchesFilters(i, filters, filterText),
    );
  }, [shown, query, view, filters]);
  const rows = sortRows(filtered, sort, cellValue);
  useEffect(() => setPage(1), [query, view, filters, pageSize]);
  // Figma's line above the table: how many items the list shows, and how many of each type
  const totals = [
    { label: 'Items', n: filtered.length },
    { label: 'Parts', n: filtered.filter(i => i.type === 'Part').length },
    { label: 'Kits', n: filtered.filter(i => i.type === 'Kit').length },
    { label: 'Assemblies', n: filtered.filter(i => i.type === 'Assembly').length },
  ];

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  const pageRows = rows.slice((current - 1) * pageSize, current * pageSize);
  const selectedRows = items.filter(i => sel.selected.has(i.id));

  const tableColumns: DataColumn[] = [...OVERVIEW_COLUMNS.filter(c => columns.includes(c.key)), STATUS_COLUMN];

  // Stock view: one line per item and warehouse location; an item with no stock still gets a line (Figma's KT-0042: "—")
  const stockLines = filtered.flatMap((item): StockLine[] => (item.stock.length ? item.stock.map(stock => ({ item, stock })) : [{ item, stock: null }]));

  const named = (names: string[]) => (names.length === 1 ? names[0] : `${names.length} items`);
  function setActive(chosen: Item[], active: boolean) {
    // Only the items that change; checked rows already in that state are left out of the notice
    const list = chosen.filter(i => i.active !== active);
    if (list.length === 0) return setNotice(`${named(chosen.map(i => i.name))} ${chosen.length === 1 ? 'is' : 'are'} already ${active ? 'active' : 'inactive'}.`);
    const ids = list.map(i => i.id);
    setItems(all => all.map(x => (ids.includes(x.id) ? { ...x, active } : x)));
    setNotice(`${named(list.map(i => i.name))} ${active ? 'activated' : 'deactivated'}.`);
  }

  // Deactivating several items: the ones no other active build uses (builds being deactivated with them don't count)
  // are confirmed together first; each one still used gets the single-item modal in turn, which asks what to do with
  // those builds. One item goes straight to that modal (its plain Confirm Deactivation, or the builds question).
  const queued = new Set(deactivating.map(i => i.id));
  const blocked = (i: Item) => usedIn(i.id, items).some(u => u.active && !queued.has(u.id));
  const plain = deactivating.filter(i => !blocked(i));
  const batch = deactivating.length > 1 && plain.length > 0;
  function startDeactivating(list: Item[]) {
    deactivated.current = [];
    const active = list.filter(i => i.active);
    if (active.length === 0) return setNotice(`${named(list.map(i => i.name))} ${list.length === 1 ? 'is' : 'are'} already inactive.`);
    setDeactivating(active);
  }
  function continueDeactivating(done: Item[], rest: Item[]) {
    deactivated.current.push(...done.map(i => i.name));
    setDeactivating(rest);
    if (rest.length === 0) finishDeactivating();
  }
  function finishDeactivating() {
    if (deactivated.current.length) setNotice(`${named(deactivated.current)} deactivated.`);
    deactivated.current = [];
    setDeactivating([]);
  }

  function created(item: Item) {
    setItems(list => [item, ...list]);
    setAdding(null);
    // Figma note on Create: the new item opens in a new app tab, so this tab keeps the table
    navigate(itemPath(item.id), { state: { ...NEW_TAB_STATE.state, notice: `${item.name} was created.` } });
  }

  const addMenu = (
    <MenuButton
      label="Add New"
      items={ITEM_TYPES.map(t => ({ label: t, onSelect: () => setAdding(t) }))}
    />
  );

  return (
    <div className={styles.page}>
      <div className={styles.toolbar} role="toolbar" aria-label="Items">
        <ButtonGroup size="small" aria-label="Show">
          <ButtonGroupItem aria-pressed={mode === 'overview'} onClick={() => setMode('overview')}>
            Overview
          </ButtonGroupItem>
          <ButtonGroupItem aria-pressed={mode === 'stock'} onClick={() => setMode('stock')}>
            Stock
          </ButtonGroupItem>
        </ButtonGroup>
        <Dropdown
          variant="small"
          label="View"
          hideLabel
          options={VIEWS.map(v => ({ value: v.value, label: v.label }))}
          value={view}
          onChange={v => setView(v as string)}
          renderValue={s => `View: ${s[0]?.label ?? 'All'}`}
        />
        <Button size="small" variant="primary" icon="view-column" onClick={() => setColumnsOpen(true)}>
          Columns
        </Button>
        <Button size="small" variant="primary" icon="upload" onClick={() => setUploadOpen(true)}>
          Upload
        </Button>
        <Dropdown
          variant="small"
          label="Actions"
          hideLabel
          placeholder="Actions"
          options={[
            // Like the warehouse tables' Actions: on the checked rows, and disabled until a row is checked
            { value: 'activate', label: 'Activate', disabled: selectedRows.length === 0 },
            { value: 'deactivate', label: 'Deactivate', disabled: selectedRows.length === 0 },
            // Merging combines checked items into one of them, so it needs at least two
            { value: 'merge', label: 'Merge', disabled: selectedRows.length < 2 },
            { value: 'delete', label: 'Delete', disabled: selectedRows.length === 0 },
            { value: 'export', label: 'Export to CSV' },
          ]}
          value={null}
          onChange={v => {
            if (v === 'export') return setNotice(`Exported ${rows.length} items to CSV.`);
            if (v === 'activate') {
              setActive(selectedRows, true);
              sel.clear();
            }
            if (v === 'deactivate') {
              startDeactivating(selectedRows);
              sel.clear();
            }
            if (v === 'merge') setMerging(selectedRows);
            if (v === 'delete') setDeleting(selectedRows);
          }}
          renderValue={() => (selectedRows.length ? `Actions (${selectedRows.length})` : 'Actions')}
        />
        <SearchInput className={styles.search} aria-label="Search items" placeholder="Search" value={query} onChange={e => setQuery(e.target.value)} />
        {addMenu}
      </div>

      {notice && <Toast type="success" title={notice} onClose={() => setNotice(null)} />}

      <PrototypeHelper title="Items">
        <HelperToggle flag="items.loading" label="Keep loading" />
        <HelperToggle flag="items.empty" label="No items" />
      </PrototypeHelper>

      <div className={styles.tableCard}>
        {mode === 'stock' ? (
          <StockTable lines={stockLines} columns={stockColumns} label="Item stock" />
        ) : (
          <>
            <div className={styles.overview}>
            {/* Figma: the totals above the table ("1,412 Items  1,218 Parts  112 Kits  82 Assemblies") */}
            <p className={styles.totals} aria-live="polite">
              {totals.map(t => (
                <span key={t.label}>
                  <strong>{count(t.n)}</strong> {t.label}
                </span>
              ))}
            </p>
            {/* Volt Data Table (Figma "Data Table" page), as on Orders and the warehouse record; its skeleton while
                loading. The box around it places a column's filter pop-over under its header cell. */}
            <div className={warehouseStyles.tableBox} ref={tableRef}>
            <DataTable
              aria-label="Items"
              className={record.statusStart}
              columns={tableColumns}
              rows={pageRows}
              totalRows={shown.length}
              rowLabel={item => item.name}
              loading={showLoading}
              sort={sort}
              onSortChange={key => setSort(nextSort(key))}
              onFilter={key => setFilterOpen(open => (open === key ? null : key))}
              activeFilters={Object.keys(filters)}
              openFilter={filterOpen ?? undefined}
              selected={[...sel.selected]}
              onSelectedChange={ids => {
                sel.setMany([...sel.selected], false);
                sel.setMany(ids, true);
              }}
              inactive={item => !item.active}
              empty={
                <EmptyState
                  filtered={shown.length > 0}
                  onClear={() => {
                    setQuery('');
                    setView('all');
                    setFilters({});
                  }}
                  addButton={addMenu}
                />
              }
              onMore={item => setMenuFor(m => (m === item.id ? null : item.id))}
              renderAfterRow={item =>
                menuFor === item.id && (
                  <RowMenu
                    label={item.name}
                    onClose={() => setMenuFor(null)}
                    items={[
                      { label: 'View', onSelect: () => navigate(itemPath(item.id)) },
                      item.active
                        ? { label: 'Deactivate', onSelect: () => startDeactivating([item]) }
                        : { label: 'Activate', onSelect: () => setActive([item], true) },
                      { label: 'Delete', onSelect: () => setDeleting([item]) },
                    ]}
                  />
                )
              }
              cells={item => ({
                // Volt TwoLineCell: the number (it opens the record) with the name under it in tiny weak text
                item: (
                  <TwoLineCell
                    title={
                      <AppLink to={itemPath(item.id)} size="small">
                        {item.id}
                      </AppLink>
                    }
                    description={item.name}
                  />
                ),
                type: item.type,
                category: item.category || '—',
                unit: unitLabel(item.unitType),
                onHand: count(onHandOf(item)),
                available: count(availableOf(item)),
                warehouses: count(warehousesOf(item)),
                status: <StatusPill active={item.active} />,
              })}
            />
            {filterOpen && (
              <ColumnFilter
                key={filterOpen}
                anchor={tableRef.current?.querySelector<HTMLElement>(`[role="columnheader"][data-column="${filterOpen}"]`)}
                label={tableColumns.find(c => c.key === filterOpen)?.label ?? ''}
                options={filterOptions(shown, i => filterText(i, filterOpen))}
                value={filters[filterOpen] ?? []}
                onApply={values => {
                  setFilters(f => withFilter(f, filterOpen, values));
                  setFilterOpen(null);
                }}
                onClose={() => setFilterOpen(null)}
              />
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
              label="Item pages"
            />
          </>
        )}
      </div>

      <AddItemModal type={adding} existing={items} onClose={() => setAdding(null)} onCreate={created} />

      <MergeItemsModal
        open={merging !== null}
        sources={merging ?? []}
        onClose={() => setMerging(null)}
        onMerge={(target, sources) => {
          mergeItems(
            sources.map(s => s.id),
            target.id,
          );
          sel.clear();
          setMerging(null);
          setNotice(`${sources.length === 1 ? sources[0].name : `${sources.length} items`} merged into ${target.name}.`);
        }}
      />

      <DeleteItemsModal
        open={deleting !== null}
        items={deleting ?? []}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          const list = deleting ?? [];
          deleteItems(list.map(i => i.id));
          sel.clear();
          setDeleting(null);
          setNotice(`${list.length === 1 ? list[0].name : `${list.length} items`} deleted.`);
        }}
      />

      <AppModal
        open={batch}
        onClose={finishDeactivating}
        title="Confirm Deactivation"
        description={`You are about to DEACTIVATE ${named(plain.map(i => i.name))}. ${plain.length === 1 ? 'It stays' : 'They stay'} on file and can be activated again. Do you want to continue?`}
        primaryAction={{
          label: 'Confirm',
          onClick: () => {
            const ids = plain.map(i => i.id);
            setItems(all => all.map(x => (ids.includes(x.id) ? { ...x, active: false } : x)));
            continueDeactivating(plain, deactivating.filter(i => !ids.includes(i.id)));
          },
        }}
      />

      <DeactivateItemModal
        item={batch ? null : (deactivating[0] ?? null)}
        all={items}
        onClose={finishDeactivating}
        onConfirm={(how, replacementId) => {
          const [first, ...rest] = deactivating;
          if (first) {
            deactivateItem(first.id, how, replacementId);
            continueDeactivating([first], rest);
          }
        }}
      />

      <ColumnsModal
        open={columnsOpen}
        columns={mode === 'stock' ? STOCK_COLUMN_OPTIONS : OVERVIEW_OPTIONS}
        visible={mode === 'stock' ? stockColumns : columns}
        onClose={() => setColumnsOpen(false)}
        onApply={keys => {
          if (mode === 'stock') setStockColumns(keys);
          else setColumns(keys);
          setColumnsOpen(false);
        }}
      />

      <UploadItemsModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onImport={(imported, fileName) => {
          setItems(list => [...imported, ...list]);
          setUploadOpen(false);
          setNotice(`${imported.length} items imported from ${fileName}.`);
        }}
      />
    </div>
  );
}

/** Rows a sample upload adds: the prototype can't read the file, so every upload brings in these. */
const SAMPLE_IMPORT: [ItemType, string, string, string][] = [
  ['Part', 'Stainless Lag Screw', 'Fasteners', 'Screws'],
  ['Part', 'Wire Management Clip', 'Electrical', 'Connectors'],
  ['Part', 'Grounding Lug', 'Electrical', 'Connectors'],
];

/** Upload: drop a spreadsheet of items (the warehouse list's full mapping flow is in UploadFlow.tsx). */
function UploadItemsModal({ open, onClose, onImport }: { open: boolean; onClose: () => void; onImport: (items: Item[], fileName: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  useEffect(() => {
    if (open) setFile(null);
  }, [open]);
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Upload Items"
      description="Upload a spreadsheet with one item per row: type, custom #, name, category and subcategory."
      primaryAction={{
        label: 'Import Items',
        disabled: !file,
        onClick: () =>
          file &&
          onImport(
            SAMPLE_IMPORT.map(([type, name, category, subcategory]) => blankItem(type, name, '', { category, subcategory })),
            file.name,
          ),
      }}
    >
      <div className={styles.modalBody}>
        <UploadFile onFiles={f => setFile(f[0] ?? null)} title="Drop your spreadsheet here, or" hint="Supports CSV, XLS, XLSX" icon="file-upload" accept=".csv,.xls,.xlsx" />
        {file && (
          <Message type="info" title={`${file.name} is ready to import`} body="This prototype can’t read the file, so it imports three sample parts." onClose={() => setFile(null)} />
        )}
      </div>
    </AppModal>
  );
}

function EmptyState({ filtered, onClear, addButton }: { filtered: boolean; onClear: () => void; addButton: ReactNode }) {
  return (
    // Shown in the Data Table's empty cell (which is the row and cell)
    <div className={styles.emptyCell}>
      <Icon name={filtered ? 'search' : 'part'} size={32} />
      <p className="text-large-bold">{filtered ? 'No items match your search' : 'No items yet'}</p>
      <p className="text-medium-regular">{filtered ? 'Try a different word, or clear the search and view.' : 'Add your first part, assembly or kit.'}</p>
      {filtered ? (
        <Button size="small" variant="outline" onClick={onClear}>
          Clear search and view
        </Button>
      ) : (
        addButton
      )}
    </div>
  );
}
