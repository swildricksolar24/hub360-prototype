import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../../../components/Button/Button';
import { DataHeader, type DataColumn, type DataSort } from '../../../../../../components/DataHeader/DataHeader';
import { DataRow } from '../../../../../../components/DataRow/DataRow';
import { PageTracker } from '../../../../../../components/PageTracker/PageTracker';
import { SearchInput } from '../../../../../../components/SearchBar/SearchBar';
import { AppLink } from '../../../../../components/AppLink';
import { AppModal } from '../../../../../components/AppModal';
import { PAGE_SIZES } from '../../record/tableKit';
import type { HistoryEntry, Item, Order } from '../itemData';
import { useItems } from '../itemStore';
import { ColumnsModal, nextSort, sortRows } from '../shared';
import record from '../../record.module.css';
import table from '../../table.module.css';
import styles from '../items.module.css';

const COLUMNS: DataColumn[] = [
  { key: 'warehouse', label: 'Warehouse', width: 120 },
  { key: 'action', label: 'Action Type', width: 150 },
  { key: 'performed', label: 'Action Performed', width: 'fill', sortable: false },
  { key: 'createdBy', label: 'Created By', width: 170 },
  { key: 'date', label: 'Date Created', width: 140 },
];
const COLUMN_OPTIONS = COLUMNS.map(c => ({ key: c.key, label: c.label, locked: c.key === 'action' || c.key === 'performed' }));

// The item history's orders are sample data that the Orders list doesn't hold, so links open the list
const ORDERS_PATH = '/app/inventory/orders';
const warehousePath = (code: string, tab?: string) => `/app/inventory/warehouses/${encodeURIComponent(code)}${tab ? `?tab=${tab}` : ''}`;

const cellValue = (h: HistoryEntry, key: string): string | number =>
  key === 'date' ? Date.parse(h.date) || 0 : key === 'warehouse' ? h.warehouse : key === 'createdBy' ? h.createdBy : h.action;

/**
 * Item record › History (ITEMS.md §7; Figma 283:76194): what happened to the item in each warehouse, newest first.
 * The Action Type chip opens the Stock, Pick or Build order; the sentence links its location and order.
 */
export function HistoryTab({ item }: { item: Item }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<DataSort | undefined>({ key: 'date', direction: 'descending' });
  const [columns, setColumns] = useState(COLUMNS.map(c => c.key));
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [opened, setOpened] = useState<HistoryEntry | null>(null);

  const q = query.trim().toLowerCase();
  const found = item.history.filter(h => !q || `${h.warehouse} ${h.action} ${h.performed} ${h.order?.number ?? ''} ${h.createdBy} ${h.date}`.toLowerCase().includes(q));
  const rows = sortRows(found, sort, cellValue);
  useEffect(() => setPage(1), [query, pageSize]);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  const pageRows = rows.slice((current - 1) * pageSize, current * pageSize);
  const tableColumns = COLUMNS.filter(c => columns.includes(c.key));

  /** The sentence, with the stock location and the order as links. */
  function sentence(h: HistoryEntry): ReactNode {
    const location = item.stock.find(s => s.warehouse === h.warehouse && h.performed.includes(s.location))?.location;
    const [before, after] = location ? h.performed.split(location) : [h.performed, ''];
    return (
      <span className={styles.sentence}>
        {before}
        {location && (
          <AppLink to={warehousePath(h.warehouse, 'locations')} size="small">
            {location}
          </AppLink>
        )}
        {after}
        {h.order && (
          <>
            {' '}
            <AppLink to={ORDERS_PATH} size="small">
              {h.order.number}
            </AppLink>
          </>
        )}
        .
      </span>
    );
  }

  return (
    <div className={record.tab}>
      <section className={record.card} aria-label="History">
        <div className={styles.toolbar} data-inset role="toolbar" aria-label="History">
          <Button size="small" variant="primary" icon="view-column" onClick={() => setColumnsOpen(true)}>
            Columns
          </Button>
          <SearchInput className={styles.search} aria-label="Search history" placeholder="Search" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className={styles.tableStack}>
          <div className={table.tableScroll}>
            <div role="table" aria-label={`History of ${item.name}`} className={table.table}>
              <DataHeader className={table.head} corners="none" columns={tableColumns} leading="none" actions={false} sort={sort} onSortChange={k => setSort(nextSort(k))} />
              {pageRows.length === 0 && (
                <p className={`text-medium-regular ${record.emptyRow}`}>{item.history.length === 0 ? 'Nothing has happened to this item yet.' : `No history matches “${query}”.`}</p>
              )}
              {pageRows.map((h, i) => (
                <div key={h.id} className={table.rowWrap} data-stripe={i % 2 === 0 || undefined}>
                  <DataRow
                    className={table.row}
                    columns={tableColumns}
                    leading="none"
                    actions={false}
                    cells={{
                      warehouse: (
                        <AppLink to={warehousePath(h.warehouse)} size="small">
                          {h.warehouse}
                        </AppLink>
                      ),
                      action: h.order ? (
                        <button type="button" className={styles.actionType} onClick={() => setOpened(h)} aria-label={`Open ${h.action} ${h.order.number}`}>
                          {h.action}
                        </button>
                      ) : (
                        <span className={styles.actionType}>{h.action}</span>
                      ),
                      performed: sentence(h),
                      createdBy: h.createdBy,
                      date: h.date,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          {rows.length > 0 && (
            <PageTracker
              page={current}
              pageCount={pageCount}
              onPageChange={setPage}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZES}
              onPageSizeChange={setPageSize}
              maxPageButtons={5}
              label="History pages"
            />
          )}
        </div>
      </section>

      <OrderModal entry={opened} onClose={() => setOpened(null)} />

      <ColumnsModal
        open={columnsOpen}
        columns={COLUMN_OPTIONS}
        visible={columns}
        onClose={() => setColumnsOpen(false)}
        onApply={keys => {
          setColumns(keys);
          setColumnsOpen(false);
        }}
      />
    </div>
  );
}

/* ---------- Stock Order / Pick Order / Build Order ---------- */

const ORDER_COLUMNS: DataColumn[] = [
  { key: 'number', label: 'Order #', width: 110, sortable: false },
  { key: 'createdBy', label: 'Created By', width: 'fill', sortable: false },
  { key: 'createdOn', label: 'Created On', width: 120, sortable: false },
  { key: 'dueOn', label: 'Due On', width: 120, sortable: false },
  { key: 'warehouse', label: 'Warehouse', width: 100, sortable: false },
  { key: 'status', label: 'Status', width: 100, sortable: false },
];
const BUILD_COLUMNS: DataColumn[] = [
  { key: 'type', label: 'Item Type', width: 100, sortable: false },
  { key: 'number', label: 'Item #', width: 160, sortable: false },
  { key: 'name', label: 'Item Name', width: 'fill', sortable: false },
  { key: 'required', label: 'Qty Required', width: 120, align: 'end', sortable: false },
  { key: 'picked', label: 'Qty Picked', width: 110, align: 'end', sortable: false },
];
const LINE_COLUMNS: DataColumn[] = [
  { key: 'type', label: 'Item Type', width: 100, sortable: false },
  { key: 'number', label: 'Item #', width: 160, sortable: false },
  { key: 'name', label: 'Item Name', width: 'fill', sortable: false },
  { key: 'requested', label: 'Requested Quantity', width: 150, align: 'end', sortable: false },
  { key: 'picked', label: 'Pick Quantity', width: 110, align: 'end', sortable: false },
  { key: 'difference', label: 'Difference', width: 100, align: 'end', sortable: false },
];

/** A small read-only table inside the order modal. */
function StaticTable({ label, columns, rows }: { label: string; columns: DataColumn[]; rows: { id: string; cells: Record<string, ReactNode> }[] }) {
  return (
    <div className={table.tableScroll}>
      <div role="table" aria-label={label} className={table.table}>
        <DataHeader className={table.head} corners="none" columns={columns} leading="none" actions={false} />
        {rows.map((r, i) => (
          <div key={r.id} className={table.rowWrap} data-stripe={i % 2 === 0 || undefined}>
            <DataRow className={table.row} columns={columns} leading="none" actions={false} cells={r.cells} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Stock Order / Pick Order / Build Order (ITEMS.md §7): the order's header row, a build order's assembly, and its
 * items with what was requested and picked. Go To Order opens Orders.
 */
function OrderModal({ entry, onClose }: { entry: HistoryEntry | null; onClose: () => void }) {
  const all = useItems();
  const navigate = useNavigate();
  const order: Order | undefined = entry?.order;
  const find = (id: string) => all.find(i => i.id === id);
  const built = order?.build ? find(order.build.itemId) : undefined;
  const count = (n: number) => n.toLocaleString('en-US');
  return (
    <AppModal
      open={!!order}
      onClose={onClose}
      width={960}
      title={entry && order ? `${entry.action} ${order.number}` : ''}
      primaryAction={{
        label: 'Go To Order',
        onClick: () => {
          onClose();
          navigate(ORDERS_PATH);
        },
      }}
    >
      {entry && order && (
        <div className={styles.modalBody}>
          <StaticTable
            label="Order"
            columns={ORDER_COLUMNS}
            rows={[
              {
                id: order.number,
                cells: {
                  number: order.number,
                  createdBy: order.createdBy,
                  createdOn: order.createdOn,
                  dueOn: order.dueOn,
                  warehouse: order.warehouse,
                  status: <span className={styles.orderStatus}>{order.status}</span>,
                },
              },
            ]}
          />
          {order.build && (
            <>
              <h3 className={styles.subheading}>{built?.type ?? 'Assembly'} Built</h3>
              <StaticTable
                label="Assembly built"
                columns={BUILD_COLUMNS}
                rows={[
                  {
                    id: order.build.itemId,
                    cells: {
                      type: built?.type ?? '—',
                      number: order.build.itemId,
                      name: built?.name ?? 'A deleted item',
                      required: count(order.build.required),
                      picked: count(order.build.picked),
                    },
                  },
                ]}
              />
              <h3 className={styles.subheading}>Items</h3>
            </>
          )}
          <StaticTable
            label="Order items"
            columns={LINE_COLUMNS}
            rows={order.lines.map(l => {
              const it = find(l.itemId);
              const diff = l.picked - l.requested;
              return {
                id: l.itemId,
                cells: {
                  type: it?.type ?? '—',
                  number: l.itemId,
                  name: it?.name ?? 'A deleted item',
                  requested: count(l.requested),
                  picked: count(l.picked),
                  difference: <span className={diff < 0 ? styles.negative : undefined}>{diff > 0 ? `+${count(diff)}` : count(diff)}</span>,
                },
              };
            })}
          />
          <p className={styles.lastModified}>Last Modified: {order.modified}</p>
        </div>
      )}
    </AppModal>
  );
}
