import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button } from '../../../../components/Button/Button';
import { ContextMenu } from '../../../../components/ContextMenu/ContextMenu';
import { DataHeader, type DataColumn, type DataSort } from '../../../../components/DataHeader/DataHeader';
import { DataRow } from '../../../../components/DataRow/DataRow';
import { Dropdown } from '../../../../components/Dropdown/Dropdown';
import { Icon } from '../../../../components/Icon/Icon';
import { Message } from '../../../../components/Message/Message';
import { PageTracker } from '../../../../components/PageTracker/PageTracker';
import { SearchInput } from '../../../../components/SearchBar/SearchBar';
import { Skeleton } from '../../../../components/Skeleton/Skeleton';
import { TextInput } from '../../../../components/TextInput/TextInput';
import { AppModal } from '../../../components/AppModal';
import { AddWarehouseModal } from './AddWarehouseModal';
import { EditColumnsModal } from './EditColumnsModal';
import { UploadFlow } from './UploadFlow';
import { DEFAULT_COLUMNS, FIELDS, SAMPLE_VIEWS, SAMPLE_WAREHOUSES, fieldByKey, type SavedView, type Warehouse } from './warehouseData';
import styles from './warehouses.module.css';

const PAGE_SIZES = [10, 25, 50];
const ALL_VIEW = '__all';

type StatusChange = { ids: string[]; active: boolean };

/**
 * Inventory › Warehouses: the Figma "Inventory Management – Core" › Warehouses flow (see WAREHOUSES.md), built with
 * the coded design system. A toolbar (view, columns, upload, actions, search, Add Warehouse), the warehouse table
 * (sort, column filters, selection, row menu) and pagination, plus the flow's modals.
 */
export function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(SAMPLE_WAREHOUSES);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  // Columns and saved views (Edit Columns)
  const [views, setViews] = useState<SavedView[]>(SAMPLE_VIEWS);
  const [viewName, setViewName] = useState<string>(ALL_VIEW);
  const [columns, setColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [frozen, setFrozen] = useState<string[]>([]);

  // Finding rows
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [filterOpen, setFilterOpen] = useState<string | null>(null);
  const [sort, setSort] = useState<DataSort | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Modals and menus
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [statusChange, setStatusChange] = useState<StatusChange | null>(null);
  const [editing, setEditing] = useState<Warehouse | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Warehouse | null>(null);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'Warehouses · HUB 360';
    // A short loading state, as if the list came from the server
    const t = window.setTimeout(() => setLoading(false), 500);
    return () => window.clearTimeout(t);
  }, []);

  // Rows after search, column filters and sort
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = warehouses.filter(w => {
      if (q && !`${w.code} ${w.name} ${FIELDS[2].show(w)}`.toLowerCase().includes(q)) return false;
      return Object.entries(filters).every(([key, text]) => {
        const field = key === 'status' ? null : fieldByKey(key);
        const shown = field ? field.show(w) : w.active ? 'Active' : 'Inactive';
        return shown.toLowerCase().includes(text.toLowerCase());
      });
    });
    if (!sort) return list;
    const field = fieldByKey(sort.key);
    const value = (w: Warehouse) => (field ? field.sortValue(w) : w.active ? 1 : 0);
    const dir = sort.direction === 'ascending' ? 1 : -1;
    return [...list].sort((a, b) => (value(a) > value(b) ? dir : value(a) < value(b) ? -dir : 0));
  }, [warehouses, query, filters, sort]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  const pageRows = rows.slice((current - 1) * pageSize, current * pageSize);
  useEffect(() => setPage(1), [query, filters, pageSize]);

  // Table columns: frozen ones first (they stay put when the others are rearranged), then the status pill
  const ordered = [...columns.filter(k => frozen.includes(k)), ...columns.filter(k => !frozen.includes(k))];
  const tableColumns: DataColumn[] = [
    ...ordered.map(key => {
      const f = fieldByKey(key)!;
      return { key, label: f.label, width: f.width, align: f.align, filterable: true };
    }),
    // Figma: the status pill has no header, and sits right before the ••• button
    { key: 'status', label: 'Status', width: 120, align: 'end', labelHidden: true, sortable: false },
  ];

  const pageIds = pageRows.map(w => w.id);
  const allOnPage = pageIds.length > 0 && pageIds.every(id => selected.has(id));
  const selectedRows = warehouses.filter(w => selected.has(w.id));

  function toggleSelected(id: string, on: boolean) {
    setSelected(s => {
      const next = new Set(s);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function applyView(name: string) {
    setViewName(name);
    const view = views.find(v => v.name === name);
    setColumns(view ? view.columns : DEFAULT_COLUMNS);
    setFrozen(view ? view.frozen : []);
  }

  function changeStatus({ ids, active }: StatusChange) {
    setWarehouses(list => list.map(w => (ids.includes(w.id) ? { ...w, active } : w)));
    setSelected(new Set());
    setNotice(`${ids.length === 1 ? '1 warehouse' : `${ids.length} warehouses`} ${active ? 'activated' : 'deactivated'}.`);
  }

  const viewOptions = [{ value: ALL_VIEW, label: 'All' }, ...views.map(v => ({ value: v.name, label: v.name }))];

  return (
    <div className={styles.page}>
      <div className={styles.toolbar} role="toolbar" aria-label="Warehouses">
        <Dropdown
          variant="small"
          label="View"
          hideLabel
          options={viewOptions}
          value={viewName}
          onChange={v => applyView(v as string)}
          renderValue={sel => `View: ${sel[0]?.label ?? 'All'}`}
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
            { value: 'activate', label: 'Activate selected', disabled: selectedRows.length === 0 },
            { value: 'deactivate', label: 'Deactivate selected', disabled: selectedRows.length === 0 },
            { value: 'export', label: 'Export to CSV' },
          ]}
          value={null}
          onChange={v => {
            if (v === 'export') return setNotice(`Exported ${rows.length} warehouses to CSV.`);
            setStatusChange({ ids: selectedRows.map(w => w.id), active: v === 'activate' });
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
        <Button size="small" variant="brand" onClick={() => setEditing('new')}>
          Add Warehouse
        </Button>
      </div>

      {notice && <Message type="success" title={notice} onClose={() => setNotice(null)} />}

      <div className={styles.tableCard}>
        <div className={styles.tableScroll} ref={tableRef}>
          <div role="table" aria-label="Warehouses" aria-busy={loading || undefined} className={styles.table}>
            <DataHeader
              className={styles.head}
              corners="none"
              columns={tableColumns}
              leading="checkbox"
              sort={sort}
              onSortChange={key =>
                setSort(s => (s?.key === key ? { key, direction: s.direction === 'ascending' ? 'descending' : 'ascending' } : { key, direction: 'ascending' }))
              }
              onFilter={key => setFilterOpen(open => (open === key ? null : key))}
              activeFilters={Object.keys(filters)}
              allSelected={allOnPage}
              onSelectAllChange={on => setSelected(s => {
                const next = new Set(s);
                pageIds.forEach(id => (on ? next.add(id) : next.delete(id)));
                return next;
              })}
            />
            {loading ? (
              Array.from({ length: 5 }, (_, i) => (
                <div key={i} className={styles.skeletonRow} aria-hidden>
                  <Skeleton width="100%" height={20} />
                </div>
              ))
            ) : pageRows.length === 0 ? (
              <EmptyState
                filtered={warehouses.length > 0}
                onAdd={() => setEditing('new')}
                onClear={() => {
                  setQuery('');
                  setFilters({});
                }}
              />
            ) : (
              pageRows.map((w, i) => {
                const cells: Record<string, ReactNode> = Object.fromEntries(ordered.map(key => [key, fieldByKey(key)!.show(w)]));
                cells.status = (
                  <span className={styles.status} data-active={w.active || undefined}>
                    {w.active ? 'Active' : 'Inactive'}
                  </span>
                );
                return (
                  <div
                    key={w.id}
                    className={styles.rowWrap}
                    data-stripe={i % 2 === 0 || undefined}
                    data-inactive={!w.active || undefined}
                  >
                    <DataRow
                      className={styles.row}
                      columns={tableColumns}
                      cells={cells}
                      leading="checkbox"
                      selected={selected.has(w.id)}
                      onSelectedChange={on => toggleSelected(w.id, on)}
                      selectLabel={`Select ${w.name}`}
                      moreLabel={`More actions for ${w.name}`}
                      onMore={() => setMenuFor(m => (m === w.id ? null : w.id))}
                    />
                    {menuFor === w.id && (
                      <RowMenu
                        warehouse={w}
                        onClose={() => setMenuFor(null)}
                        onEdit={() => setEditing(w)}
                        onStatus={() => setStatusChange({ ids: [w.id], active: !w.active })}
                        onDelete={() => setDeleting(w)}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
          {filterOpen && (
            <ColumnFilter
              key={filterOpen}
              anchor={tableRef.current?.querySelector<HTMLElement>(
                `[role="columnheader"]:nth-of-type(${tableColumns.findIndex(c => c.key === filterOpen) + 2})`,
              )}
              label={tableColumns.find(c => c.key === filterOpen)?.label ?? ''}
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
          label="Warehouse pages"
        />
      </div>

      {/* 2–3: Confirm Activation / Deactivation */}
      <AppModal
        open={statusChange !== null}
        variant="confirm"
        onClose={() => setStatusChange(null)}
        title={statusChange?.active ? 'Confirm Activation' : 'Confirm Deactivation'}
        description={
          statusChange && (
            <>
              You are about to <strong className={styles.verb}>{statusChange.active ? 'ACTIVATE' : 'DEACTIVATE'}</strong>{' '}
              {statusChange.ids.length === 1 ? 'this record' : `${statusChange.ids.length} records`}. This change will take effect
              immediately. Do you want to continue?
            </>
          )
        }
        primaryAction={{
          label: 'Confirm',
          onClick: () => {
            if (statusChange) changeStatus(statusChange);
            setStatusChange(null);
          },
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
        existingCodes={warehouses.map(w => w.code)}
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
        onDeleteView={name => {
          setViews(list => list.filter(v => v.name !== name));
          applyView(ALL_VIEW);
          setNotice(`View "${name}" deleted.`);
          setColumnsOpen(false);
        }}
      />

      <UploadFlow
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        existingCodes={warehouses.map(w => w.code)}
        onImport={imported => {
          setWarehouses(list => [...imported, ...list]);
          setNotice(`${imported.length === 1 ? '1 warehouse' : `${imported.length} warehouses`} imported.`);
          setUploadOpen(false);
        }}
      />
    </div>
  );
}

/* ---------- Row menu (•••) ---------- */

function RowMenu({
  warehouse,
  onClose,
  onEdit,
  onStatus,
  onDelete,
}: {
  warehouse: Warehouse;
  onClose: () => void;
  onEdit: () => void;
  onStatus: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Clicking anywhere else closes the menu
  useEffect(() => {
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node) && !(e.target as Element).closest('[aria-label^="More actions"]')) onClose();
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [onClose]);
  const choose = (fn: () => void) => () => {
    onClose();
    fn();
  };
  return (
    <div ref={ref} className={styles.rowMenu}>
      <ContextMenu
        aria-label={`Actions for ${warehouse.name}`}
        autoFocus
        onClose={onClose}
        items={[
          { label: 'Edit', icon: 'edit', onSelect: choose(onEdit) },
          warehouse.active
            ? { label: 'Deactivate', icon: 'visibility-off', onSelect: choose(onStatus) }
            : { label: 'Activate', icon: 'check', onSelect: choose(onStatus) },
          { label: 'Delete', icon: 'delete', onSelect: choose(onDelete) },
        ]}
      />
    </div>
  );
}

/* ---------- Column filter (header filter icon) ---------- */

function ColumnFilter({
  anchor,
  label,
  value,
  onApply,
  onClose,
}: {
  anchor: HTMLElement | null | undefined;
  label: string;
  value: string;
  onApply: (text: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(value);
  const ref = useRef<HTMLDivElement>(null);
  const left = anchor ? anchor.offsetLeft : 0;
  useEffect(() => {
    ref.current?.querySelector('input')?.focus();
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node) && !(e.target as Element).closest('[role="columnheader"]')) onClose();
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [onClose]);
  return (
    <div
      ref={ref}
      className={styles.filter}
      style={{ left }}
      role="dialog"
      aria-label={`Filter ${label}`}
      onKeyDown={e => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <form
        onSubmit={e => {
          e.preventDefault();
          onApply(text);
        }}
      >
        <TextInput label={`Filter ${label}`} value={text} onChange={e => setText(e.target.value)} placeholder="Contains…" />
        <div className={styles.filterActions}>
          <Button size="small" variant="outline" type="button" onClick={() => onApply('')}>
            Clear
          </Button>
          <Button size="small" variant="brand" type="submit">
            Apply
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Empty and no-results states ---------- */

function EmptyState({ filtered, onAdd, onClear }: { filtered: boolean; onAdd: () => void; onClear: () => void }) {
  return (
    <div role="row" className={styles.empty}>
      <div role="cell" className={styles.emptyCell}>
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
          <Button size="small" variant="brand" onClick={onAdd}>
            Add Warehouse
          </Button>
        )}
      </div>
    </div>
  );
}
