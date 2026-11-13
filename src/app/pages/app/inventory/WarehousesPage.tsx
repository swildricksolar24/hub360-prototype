import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../components/Button/Button';
import { DataTable, type DataColumn, type DataSort } from '../../../../components/DataTable/DataTable';
import { Dropdown } from '../../../../components/Dropdown/Dropdown';
import { Icon } from '../../../../components/Icon/Icon';
import { PageTracker } from '../../../../components/PageTracker/PageTracker';
import { SearchInput } from '../../../../components/SearchBar/SearchBar';
import { AppLink } from '../../../components/AppLink';
import { AppModal } from '../../../components/AppModal';
import { AddWarehouseModal } from './AddWarehouseModal';
import { EditColumnsModal } from './EditColumnsModal';
import { UploadFlow } from './UploadFlow';
import { DEFAULT_COLUMNS, FIELDS, SAMPLE_VIEWS, fieldByKey, type SavedView, type Warehouse } from './warehouseData';
import { RowMenu } from './record/RowMenu';
import { PAGE_SIZES, StatusPill } from './record/tableKit';
import { recordPath, setWarehouses, useWarehouses } from './warehouseStore';
import { ColumnFilter, filterOptions, matchesFilters, withFilter, type ColumnFilters } from './ColumnFilter';
import { WarehouseStatusModal, applyWarehouseStatus, type ActivateOptions } from './WarehouseStatusModal';
import { useAuth } from '../../../auth/AuthContext';
import { useHelperFlag } from '../../../shell/helperFlags';
import { HelperToggle, PrototypeHelper } from '../../../shell/PrototypeHelper';
import record from './record.module.css';
import styles from './warehouses.module.css';
import { Toast } from '../../../../components/Toast/Toast';

const ALL_VIEW = '__all';
/** The View menu: which warehouses the table shows */
type StatusView = 'all' | 'active' | 'inactive';
const STATUS_VIEWS: { value: StatusView; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

type StatusChange = { ids: string[]; active: boolean };

const NO_WAREHOUSES: Warehouse[] = [];

/** Columns whose values repeat, so filtering by them makes sense (codes, names, addresses, zip codes and amounts don't). */
const FILTER_KEYS = new Set(['city', 'state', 'country']); // and the Status column below
/** A cell's text as it shows, for the column filters' value lists. */
const cellText = (w: Warehouse, key: string) => (key === 'status' ? (w.active ? 'Active' : 'Inactive') : (fieldByKey(key)?.show(w) ?? ''));

/**
 * Inventory › Warehouses: the Figma "Inventory Management – Core" › Warehouses flow (see WAREHOUSES.md), built with
 * the coded design system. A toolbar (view, columns, upload, actions, search, Add Warehouse), the warehouse table
 * (sort, column filters, selection, row menu) and pagination, plus the flow's modals.
 */
export function WarehousesPage() {
  // Shared with the warehouse record pages (warehouseStore.ts)
  const stored = useWarehouses();
  // Helper switch "No warehouses": the page shows an empty list (the store keeps its warehouses)
  const warehouses = useHelperFlag('warehouses.empty') ? NO_WAREHOUSES : stored;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  // Helper switch "Keep loading": the skeleton stays after the 500 ms load
  const keepLoading = useHelperFlag('warehouses.loading');
  const showLoading = loading || keepLoading;
  const [notice, setNotice] = useState<string | null>(null);

  // View menu: a status filter (All / Active / Inactive) plus the column layouts saved from Edit Columns
  const [statusView, setStatusView] = useState<StatusView>('all');
  const [views, setViews] = useState<SavedView[]>(SAMPLE_VIEWS);
  const [viewName, setViewName] = useState<string>(ALL_VIEW);
  const [columns, setColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [frozen, setFrozen] = useState<string[]>([]);

  // Finding rows
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<ColumnFilters>({});
  const [filterOpen, setFilterOpen] = useState<string | null>(null);
  const [sort, setSort] = useState<DataSort | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Modals and menus
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [statusChange, setStatusChange] = useState<StatusChange | null>(null);
  // The dialog keeps showing the last change while it closes
  const shownChange = useRef(statusChange);
  if (statusChange) shownChange.current = statusChange;
  const { user } = useAuth();
  const [editing, setEditing] = useState<Warehouse | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Warehouse | null>(null);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'HUB360 · Warehouses';
    // A short loading state, as if the list came from the server
    const t = window.setTimeout(() => setLoading(false), 500);
    return () => window.clearTimeout(t);
  }, []);

  // Rows after search, column filters and sort
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = warehouses.filter(w => {
      if (statusView === 'active' && !w.active) return false;
      if (statusView === 'inactive' && w.active) return false;
      if (q &&!`${w.code} ${w.name} ${FIELDS[2].show(w)}`.toLowerCase().includes(q)) return false;
      return matchesFilters(w, filters, cellText);
    });
    if (!sort) return list;
    const field = fieldByKey(sort.key);
    const value = (w: Warehouse) => (field ? field.sortValue(w) : w.active ? 1 : 0);
    const dir = sort.direction === 'ascending' ? 1 : -1;
    return [...list].sort((a, b) => (value(a) > value(b) ? dir : value(a) < value(b) ? -dir : 0));
  }, [warehouses, statusView, query, filters, sort]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  const pageRows = rows.slice((current - 1) * pageSize, current * pageSize);
  useEffect(() => setPage(1), [statusView, query, filters, pageSize]);

  // Table columns: frozen ones first (they stay put when the others are rearranged), then the status pill
  const ordered = [...columns.filter(k => frozen.includes(k)), ...columns.filter(k => !frozen.includes(k))];
  const tableColumns: DataColumn[] = [
    ...ordered.map(key => {
      const f = fieldByKey(key)!;
      return { key, label: f.label, width: f.width, minWidth: f.minWidth, priority: f.priority, align: f.align, filterable: FILTER_KEYS.has(key) };
    }),
    // Figma's status pill has no header; with its filter it gets one: "Status", over the pills (which start at the left
    // of the column), sorting and filtering by Active / Inactive. It sits right before the ••• button
    { key: 'status', label: 'Status', width: 120, fixed: true, filterable: true },
  ];
  // DataTable fits the columns to the card: they shrink to minWidth, then hide by priority (Empty, Filled Locations,
  // Locations)
  const selectedRows = warehouses.filter(w => selected.has(w.id));

  function changeStatus({ ids, active }: StatusChange, note: string, options: ActivateOptions) {
    setNotice(applyWarehouseStatus(warehouses.filter(w => ids.includes(w.id)), active, note, options, user?.name ?? 'You'));
    setSelected(new Set());
  }

  // The View menu filters the rows by status
  const activeCount = warehouses.filter(w => w.active).length;
  const statusCounts: Record<StatusView, number> = { all: warehouses.length, active: activeCount, inactive: warehouses.length - activeCount };
  const viewOptions = STATUS_VIEWS.map(s => ({ value: s.value, label: `${s.label} (${statusCounts[s.value]})` }));
  const viewLabel = `View: ${STATUS_VIEWS.find(s => s.value === statusView)!.label}`;

  return (
    <div className={styles.page}>
      <div className={styles.toolbar} role="toolbar" aria-label="Warehouses">
        <Dropdown
          variant="small"
          label="View"
          hideLabel
          options={viewOptions}
          value={statusView}
          onChange={v => setStatusView(v as StatusView)}
          renderValue={() => viewLabel}
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
          // Disabled (and inert to the pointer) until a row is checked; Selected while any are
          className={styles.actions}
          disabled={selectedRows.length === 0}
          selected={selectedRows.length > 0}
          options={[
            // Disabled when every checked warehouse already has that status
            { value: 'activate', label: 'Activate', disabled: selectedRows.every(w => w.active) },
            { value: 'deactivate', label: 'Deactivate', disabled: selectedRows.every(w => !w.active) },
          ]}
          value={null}
          // Only the checked warehouses that change: activating skips the ones already active, and the reverse
          onChange={v => {
            const active = v === 'activate';
            setStatusChange({ ids: selectedRows.filter(w => w.active !== active).map(w => w.id), active });
          }}
          renderValue={() => (selectedRows.length ? `Actions (${selectedRows.length})` : 'Actions')}
        />
        <SearchInput
          className={styles.search}
          aria-label="Search warehouses"
          placeholder="Search"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <Button size="small" variant="brand" icon="plus" onClick={() => setEditing('new')}>
          Add Warehouse
        </Button>
      </div>

      {notice && <Toast type="success" title={notice} onClose={() => setNotice(null)} />}

      <div className={styles.tableCard}>
        {/* Volt Data Table (Figma "Data Table" page), as on Items, Orders and the warehouse record, with its column
            filters and loading skeleton. The box around it places a column's filter pop-over under its header cell. */}
        <div className={styles.tableBox} ref={tableRef}>
          <DataTable
            aria-label="Warehouses"
            className={`${styles.table} ${record.statusStart}`}
            columns={tableColumns}
            rows={pageRows}
            totalRows={warehouses.length}
            rowLabel={w => w.name}
            loading={showLoading}
            sort={sort}
            onSortChange={key =>
              setSort(s => (s?.key === key ? { key, direction: s.direction === 'ascending' ? 'descending' : 'ascending' } : { key, direction: 'ascending' }))
            }
            onFilter={key => setFilterOpen(open => (open === key ? null : key))}
            activeFilters={Object.keys(filters)}
            openFilter={filterOpen ?? undefined}
            selected={[...selected]}
            onSelectedChange={ids => setSelected(new Set(ids))}
            inactive={w => !w.active}
            empty={
              <EmptyState
                filtered={warehouses.length > 0}
                onAdd={() => setEditing('new')}
                onClear={() => {
                  setQuery('');
                  setFilters({});
                }}
              />
            }
            onMore={w => setMenuFor(m => (m === w.id ? null : w.id))}
            renderAfterRow={w =>
              menuFor === w.id && (
                <RowMenu
                  label={w.name}
                  onClose={() => setMenuFor(null)}
                  items={[
                    { label: 'View', onSelect: () => navigate(recordPath(w)) },
                    // Both, with the one matching the current status disabled
                    { label: 'Activate', disabled: w.active, onSelect: () => setStatusChange({ ids: [w.id], active: true }) },
                    { label: 'Deactivate', disabled: !w.active, onSelect: () => setStatusChange({ ids: [w.id], active: false }) },
                    { label: 'Delete', onSelect: () => setDeleting(w) },
                  ]}
                />
              )
            }
            cells={w => {
              const cells: Record<string, ReactNode> = Object.fromEntries(ordered.map(key => [key, fieldByKey(key)!.show(w)]));
              // The code and the name open the warehouse's record
              for (const key of ['code', 'name'] as const) {
                if (key in cells) cells[key] = <AppLink to={recordPath(w)} size="small">{cells[key]}</AppLink>;
              }
              cells.status = <StatusPill active={w.active} />;
              return cells;
            }}
          />
          {filterOpen && (
            <ColumnFilter
              key={filterOpen}
              anchor={tableRef.current?.querySelector<HTMLElement>(`[role="columnheader"][data-column="${filterOpen}"]`)}
              label={tableColumns.find(c => c.key === filterOpen)?.label ?? ''}
              options={filterOptions(warehouses, w => cellText(w, filterOpen))}
              value={filters[filterOpen] ?? []}
              onApply={values => {
                setFilters(f => withFilter(f, filterOpen, values));
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
          label="Warehouse pages"
        />
      </div>

      {/* 2–3: Activate / Deactivate (Figma "Activation" 843:60109, "Deactivate Warehouse — Improved" 843:60078) */}
      <WarehouseStatusModal
        open={statusChange !== null}
        warehouses={warehouses.filter(w => shownChange.current?.ids.includes(w.id))}
        active={shownChange.current?.active ?? false}
        onClose={() => setStatusChange(null)}
        onConfirm={(note, options) => {
          if (statusChange) changeStatus(statusChange, note, options);
          setStatusChange(null);
        }}
      />

      {/* Row menu › Delete */}
      <AppModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete warehouse?"
        description={deleting && `${deleting.name} (${deleting.code}) will be removed. This action cannot be undone.`}
        primaryAction={{
          label: 'Delete Warehouse',
          danger: true,
          onClick: () => {
            if (deleting) {
              setWarehouses(list => list.filter(w => w.id !== deleting.id));
              setNotice(`${deleting.name} was deleted.`);
            }
            setDeleting(null);
          },
        }}
      />

      <AddWarehouseModal
        open={editing !== null}
        warehouse={editing === 'new' ? null : editing}
        // Every stored code, even while the Helper's "No warehouses" hides them, so a new one can't repeat one
        existingCodes={stored.map(w => w.code)}
        onClose={() => setEditing(null)}
        onSave={w => {
          const isNew = editing === 'new';
          setWarehouses(list => (isNew ? [w, ...list] : list.map(x => (x.id === w.id ? w : x))));
          setNotice(isNew ? `${w.name} was added.` : `${w.name} was updated.`);
          setEditing(null);
        }}
      />

      <EditColumnsModal
        open={columnsOpen}
        view={views.find(v => v.name === viewName) ?? null}
        columns={columns}
        frozen={frozen}
        onClose={() => setColumnsOpen(false)}
        onApply={(next, nextFrozen, name) => {
          setColumns(next);
          setFrozen(nextFrozen);
          if (name) {
            const modified = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            setViews(list => [...list.filter(v => v.name !== name && v.name !== viewName), { name, columns: next, frozen: nextFrozen, modified }]);
            setViewName(name);
            setNotice(`View "${name}" saved.`);
          }
          setColumnsOpen(false);
        }}
      />

      <UploadFlow
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        existing={stored}
        onImport={(creates, updates) => {
          const updated = new Map(updates.map(w => [w.code, w]));
          setWarehouses(list => [...creates, ...list.map(w => updated.get(w.code) ?? w)]);
          const count = (n: number) => (n === 1 ? '1 warehouse' : `${n} warehouses`);
          setNotice(
            creates.length && updates.length
              ? `${count(creates.length)} added and ${updates.length} updated.`
              : creates.length
                ? `${count(creates.length)} imported.`
                : `${count(updates.length)} updated.`,
          );
          setUploadOpen(false);
        }}
      />

      {/* Prototype Helper switches (not in Figma); UploadFlow and WarehouseStatusModal read the upload and status ones */}
      <PrototypeHelper title="Warehouses">
        <HelperToggle flag="warehouses.loading" label="Keep loading" />
        <HelperToggle flag="warehouses.empty" label="No warehouses" />
        <HelperToggle flag="warehouses.uploadFails" label="Upload fails" />
        <HelperToggle flag="warehouses.uploadBadRows" label="Upload has bad rows" />
        <HelperToggle flag="warehouses.uploadUnmatched" label="Unmatched columns" />
        <HelperToggle flag="warehouses.nothingHeld" label="Nothing still held" />
        <HelperToggle flag="warehouses.deactivationHistory" label="Show deactivation history" />
      </PrototypeHelper>
    </div>
  );
}

/* ---------- Empty and no-results states ---------- */

function EmptyState({ filtered, onAdd, onClear }: { filtered: boolean; onAdd: () => void; onClear: () => void }) {
  return (
    // Shown in the Data Table's empty cell (which is the row and cell)
    <div className={styles.emptyCell}>
      <Icon name={filtered ? 'search' : 'warehouse'} size={32} />
      <p className="text-large-bold">{filtered ? 'No warehouses match your search' : 'No warehouses yet'}</p>
      <p className="text-medium-regular">
        {filtered ? 'Try a different word, or clear the search and filters.' : 'Add your first warehouse, or upload a spreadsheet.'}
      </p>
      {filtered ? (
        <Button size="small" variant="outline" onClick={onClear}>
          Clear search and filters
        </Button>
      ) : (
        <Button size="small" variant="brand" icon="plus" onClick={onAdd}>
          Add Warehouse
        </Button>
      )}
    </div>
  );
}
