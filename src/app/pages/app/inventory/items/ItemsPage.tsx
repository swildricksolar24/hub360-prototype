import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../../components/Button/Button';
import { ButtonGroup, ButtonGroupItem } from '../../../../../components/ButtonGroup/ButtonGroup';
import { DataTable, type DataColumn, type DataSort } from '../../../../../components/DataTable/DataTable';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { Icon } from '../../../../../components/Icon/Icon';
import { Message } from '../../../../../components/Message/Message';
import { PageTracker } from '../../../../../components/PageTracker/PageTracker';
import { SearchInput } from '../../../../../components/SearchBar/SearchBar';
import { UploadFile } from '../../../../../components/UploadFile/UploadFile';
import { AppLink } from '../../../../components/AppLink';
import { AppModal } from '../../../../components/AppModal';
import { useHelperFlag } from '../../../../shell/helperFlags';
import { HelperToggle, PrototypeHelper } from '../../../../shell/PrototypeHelper';
import { RowMenu } from '../record/RowMenu';
import { PAGE_SIZES } from '../record/tableKit';
import { blankItem, ITEM_TYPES, type Item, type ItemType } from './itemData';
import { deactivateItem, deleteItems, itemPath, mergeItems, setItems, useItems } from './itemStore';
import { AddItemModal, DeactivateItemModal, DeleteItemsModal, MergeItemsModal } from './ItemModals';
import { ColumnsModal, MenuButton, nextSort, sortRows, StatusPill, useSelection } from './shared';
import { STOCK_COLUMN_OPTIONS, StockTable } from './StockTable';
import record from '../record.module.css';
import styles from './items.module.css';
import { Toast } from '../../../../../components/Toast/Toast';


// On a narrow card the columns shrink to their minWidth (text wraps to 2 lines); nothing hides
const OVERVIEW_COLUMNS: DataColumn[] = [
  // Never narrower than the longest full item number on one line ("PA-0002-AJ89-98HB": 143px, + the link's 4px and the
  // cell's 16px padding)
  { key: 'number', label: 'Item #', width: 168, minWidth: 164 },
  { key: 'name', label: 'Name', width: 'fill', minWidth: 112 },
  { key: 'type', label: 'Type', width: 100, minWidth: 76 },
  { key: 'category', label: 'Category', width: 140, minWidth: 100 },
  { key: 'subcategory', label: 'Sub Category', width: 140, minWidth: 100 },
];
const OVERVIEW_OPTIONS = OVERVIEW_COLUMNS.map(c => ({ key: c.key, label: c.label, locked: c.key === 'number' || c.key === 'name' }));

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

const cellValue = (i: Item, key: string) =>
  key === 'number' ? i.id : key === 'status' ? (i.active ? 1 : 0) : String(i[key as 'name' | 'type' | 'category' | 'subcategory'] ?? '');

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
  const [sort, setSort] = useState<DataSort | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [columns, setColumns] = useState(OVERVIEW_COLUMNS.map(c => c.key));
  const [stockColumns, setStockColumns] = useState(STOCK_COLUMN_OPTIONS.map(c => c.key));
  const sel = useSelection();

  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [adding, setAdding] = useState<ItemType | null>(null);
  const [merging, setMerging] = useState<Item[] | null>(null);
  const [deleting, setDeleting] = useState<Item[] | null>(null);
  const [deactivating, setDeactivating] = useState<Item | null>(null);
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
    return shown.filter(i => test(i) && (!q || `${i.id} ${i.customNumber} ${i.name} ${i.type} ${i.category} ${i.subcategory}`.toLowerCase().includes(q)));
  }, [shown, query, view]);
  const rows = sortRows(filtered, sort, cellValue);
  useEffect(() => setPage(1), [query, view, pageSize]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  const pageRows = rows.slice((current - 1) * pageSize, current * pageSize);
  const selectedRows = items.filter(i => sel.selected.has(i.id));

  const tableColumns: DataColumn[] = [
    ...OVERVIEW_COLUMNS.filter(c => columns.includes(c.key)),
    // Figma: the status pill has no header, and sits right before the ••• button
    { key: 'status', label: 'Status', width: 120, align: 'end', labelHidden: true, sortable: false },
  ];

  const stockLines = filtered.flatMap(item => item.stock.map(stock => ({ item, stock })));

  function created(item: Item) {
    setItems(list => [item, ...list]);
    setAdding(null);
    navigate(itemPath(item.id), { state: { notice: `${item.name} was created.` } });
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
        <ButtonGroup aria-label="Show">
          <ButtonGroupItem className={styles.segment} aria-pressed={mode === 'overview'} onClick={() => setMode('overview')}>
            Overview
          </ButtonGroupItem>
          <ButtonGroupItem className={styles.segment} aria-pressed={mode === 'stock'} onClick={() => setMode('stock')}>
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
            { value: 'merge', label: 'Merge', disabled: selectedRows.length === 0 },
            { value: 'delete', label: 'Delete', disabled: selectedRows.length === 0 },
            { value: 'export', label: 'Export to CSV' },
          ]}
          value={null}
          onChange={v => {
            if (v === 'export') return setNotice(`Exported ${rows.length} items to CSV.`);
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
            {/* Volt Data Table (Figma "Data Table" page), as on Orders and the warehouse record; its skeleton while loading */}
            <DataTable
              aria-label="Items"
              className={record.statusStart}
              columns={tableColumns}
              rows={pageRows}
              rowLabel={item => item.name}
              loading={showLoading}
              sort={sort}
              onSortChange={key => setSort(nextSort(key))}
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
                      { label: 'Merge', onSelect: () => setMerging([item]) },
                      item.active
                        ? { label: 'Deactivate', onSelect: () => setDeactivating(item) }
                        : {
                            label: 'Activate',
                            onSelect: () => {
                              setItems(list => list.map(x => (x.id === item.id ? { ...x, active: true } : x)));
                              setNotice(`${item.name} activated.`);
                            },
                          },
                      { label: 'Delete', onSelect: () => setDeleting([item]) },
                    ]}
                  />
                )
              }
              cells={item => ({
                number: (
                  <AppLink to={itemPath(item.id)} size="small">
                    {item.id}
                  </AppLink>
                ),
                name: (
                  <AppLink to={itemPath(item.id)} size="small">
                    {item.name}
                  </AppLink>
                ),
                type: item.type,
                category: item.category || '—',
                subcategory: item.subcategory || '—',
                status: <StatusPill active={item.active} />,
              })}
            />
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
        all={items}
        onClose={() => setMerging(null)}
        onMerge={target => {
          const sources = merging ?? [];
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

      <DeactivateItemModal
        item={deactivating}
        all={items}
        onClose={() => setDeactivating(null)}
        onConfirm={(how, replacementId) => {
          if (deactivating) {
            deactivateItem(deactivating.id, how, replacementId);
            setNotice(`${deactivating.name} deactivated.`);
          }
          setDeactivating(null);
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
