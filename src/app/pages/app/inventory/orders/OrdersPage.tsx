import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../../components/Button/Button';
import { ContextMenu } from '../../../../../components/ContextMenu/ContextMenu';
import { DataHeader, type DataColumn, type DataSort } from '../../../../../components/DataHeader/DataHeader';
import { DataRow } from '../../../../../components/DataRow/DataRow';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { Icon } from '../../../../../components/Icon/Icon';
import { PageTracker } from '../../../../../components/PageTracker/PageTracker';
import { SearchInput } from '../../../../../components/SearchBar/SearchBar';
import { Skeleton } from '../../../../../components/Skeleton/Skeleton';
import { AppLink } from '../../../../components/AppLink';
import { AppModal } from '../../../../components/AppModal';
import { RowMenu } from '../record/RowMenu';
import { useWarehouses } from '../warehouseStore';
import { NewOrderModal } from './NewOrderModal';
import { OrderStatusPill } from './OrderStatus';
import { DESIGNED_TYPES, ORDER_STATUSES, ORDER_TYPES, formatDate, type Order, type OrderStatus, type OrderType } from './orderData';
import { createOrder, orderPath, setOrders, useOrders } from './orderStore';
import table from '../table.module.css';
import { PAGE_SIZES } from '../record/tableKit';
import styles from './orders.module.css';
import { Toast } from '../../../../components/Toast';

const ALL = '__all';

const COLUMNS: DataColumn[] = [
  { key: 'number', label: 'Order #', width: 150 },
  { key: 'type', label: 'Type', width: 110 },
  { key: 'warehouse', label: 'Warehouse', width: 'fill' },
  { key: 'status', label: 'Status', width: 130 },
  { key: 'created', label: 'Created', width: 124, align: 'end' },
  { key: 'due', label: 'Due', width: 124, align: 'end' },
];

/**
 * Inventory › Orders: the list of orders, so the two designed records (Move Request, Adjustment) can be reached.
 * NOT IN FIGMA: the "→ Order" page (292:26345) is empty; this list copies the Warehouses list pattern until the
 * designer draws one (ORDERS.md, open question 1).
 */
export function OrdersPage() {
  const orders = useOrders();
  const warehouses = useWarehouses();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const [view, setView] = useState<string>(ALL);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<DataSort | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [starting, setStarting] = useState<OrderType | null>(null);
  const [cancelling, setCancelling] = useState<string[] | null>(null);

  useEffect(() => {
    document.title = 'HUB360 · Orders';
    // A short loading state, as if the list came from the server
    const t = window.setTimeout(() => setLoading(false), 500);
    return () => window.clearTimeout(t);
  }, []);

  const warehouseName = (code: string) => warehouses.find(w => w.code === code)?.name ?? '';
  const sortValue = (o: Order, key: string): string => {
    if (key === 'number') return o.id;
    if (key === 'warehouse') return o.warehouse;
    if (key === 'created') return o.created;
    if (key === 'due') return o.due ?? '';
    return o[key as 'type' | 'status'];
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = orders.filter(o => {
      if (view !== ALL && o.status !== view) return false;
      return !q || `${o.number} ${o.id} ${o.type} ${o.warehouse} ${warehouseName(o.warehouse)} ${o.status}`.toLowerCase().includes(q);
    });
    if (!sort) return list;
    const dir = sort.direction === 'ascending' ? 1 : -1;
    return [...list].sort((a, b) => sortValue(a, sort.key).localeCompare(sortValue(b, sort.key)) * dir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, warehouses, view, query, sort]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  const pageRows = rows.slice((current - 1) * pageSize, current * pageSize);
  useEffect(() => setPage(1), [query, view, pageSize]);

  const pageIds = pageRows.map(o => o.id);
  const allOnPage = pageIds.length > 0 && pageIds.every(id => selected.has(id));
  const cancellable = orders.filter(o => selected.has(o.id) && o.status === 'In Process');

  function toggleSelected(id: string, on: boolean) {
    setSelected(s => {
      const next = new Set(s);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar} role="toolbar" aria-label="Orders">
        <Dropdown
          variant="small"
          label="View"
          hideLabel
          options={[{ value: ALL, label: 'All' }, ...ORDER_STATUSES.map(s => ({ value: s, label: s }))]}
          value={view}
          onChange={v => setView(v as string)}
          renderValue={sel => `View: ${sel[0]?.label ?? 'All'}`}
        />
        <Dropdown
          variant="small"
          label="Actions"
          hideLabel
          placeholder="Actions"
          options={[
            { value: 'cancel', label: 'Cancel selected', disabled: cancellable.length === 0 },
            { value: 'export', label: 'Export to CSV' },
          ]}
          value={null}
          onChange={v => {
            if (v === 'export') return setNotice(`Exported ${rows.length} orders to CSV.`);
            setCancelling(cancellable.map(o => o.id));
          }}
          renderValue={() => (selected.size ? `Actions (${selected.size})` : 'Actions')}
        />
        <SearchInput
          className={styles.search}
          aria-label="Search orders"
          placeholder="Search"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <NewOrderMenu
          open={newOpen}
          onOpenChange={setNewOpen}
          onPick={type => {
            setNewOpen(false);
            setStarting(type);
          }}
        />
      </div>

      {notice && <Toast type="success" title={notice} onClose={() => setNotice(null)} />}

      <div className={styles.tableCard}>
        <div className={table.tableScroll}>
          <div role="table" aria-label="Orders" aria-busy={loading || undefined} className={table.table}>
            <DataHeader
              className={table.head}
              corners="none"
              columns={COLUMNS}
              leading="checkbox"
              sort={sort}
              onSortChange={key =>
                setSort(s => (s?.key === key ? { key, direction: s.direction === 'ascending' ? 'descending' : 'ascending' } : { key, direction: 'ascending' }))
              }
              allSelected={allOnPage}
              onSelectAllChange={on =>
                setSelected(s => {
                  const next = new Set(s);
                  pageIds.forEach(id => (on ? next.add(id) : next.delete(id)));
                  return next;
                })
              }
            />
            {loading ? (
              Array.from({ length: 5 }, (_, i) => (
                <div key={i} className={table.skeletonRow} aria-hidden>
                  <Skeleton width="100%" height={20} />
                </div>
              ))
            ) : pageRows.length === 0 ? (
              <div role="row" className={styles.empty}>
                <div role="cell" className={styles.emptyCell}>
                  <Icon name="search" size={32} />
                  <p className="text-large-bold">No orders match your search</p>
                  <p className="text-medium-regular">Try a different word, or clear the search and view.</p>
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => {
                      setQuery('');
                      setView(ALL);
                    }}
                  >
                    Clear search and view
                  </Button>
                </div>
              </div>
            ) : (
              pageRows.map((o, i) => {
                const cells: Record<string, ReactNode> = {
                  number: (
                    <AppLink to={orderPath(o)} size="small">
                      {o.number}
                    </AppLink>
                  ),
                  type: o.type,
                  warehouse: `${o.warehouse} · ${warehouseName(o.warehouse)}`,
                  status: <OrderStatusPill status={o.status} />,
                  created: formatDate(o.created),
                  due: formatDate(o.due),
                };
                return (
                  <div key={o.id} className={table.rowWrap} data-stripe={i % 2 === 0 || undefined}>
                    <DataRow
                      className={table.row}
                      columns={COLUMNS}
                      cells={cells}
                      leading="checkbox"
                      selected={selected.has(o.id)}
                      onSelectedChange={on => toggleSelected(o.id, on)}
                      selectLabel={`Select ${o.number}`}
                      moreLabel={`More actions for ${o.number}`}
                      onMore={() => setMenuFor(m => (m === o.id ? null : o.id))}
                    />
                    {menuFor === o.id && (
                      <RowMenu
                        label={o.number}
                        onClose={() => setMenuFor(null)}
                        items={[
                          { label: 'View', icon: 'visibility', onSelect: () => navigate(orderPath(o)) },
                          ...(o.status === 'In Process'
                            ? [{ label: 'Cancel Order', icon: 'close', onSelect: () => setCancelling([o.id]) }]
                            : []),
                        ]}
                      />
                    )}
                  </div>
                );
              })
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
          label="Order pages"
        />
      </div>

      <AppModal
        open={cancelling !== null}
        variant="confirm"
        icon="close"
        onClose={() => setCancelling(null)}
        title="Confirm Cancellation"
        description={
          cancelling && (
            <>
              You are about to <strong className={styles.verb}>CANCEL</strong>{' '}
              {cancelling.length === 1 ? 'this order' : `${cancelling.length} orders`}. A cancelled order can’t be processed
              or edited. Do you want to continue?
            </>
          )
        }
        secondaryAction={{ label: cancelling?.length === 1 ? 'Keep Order' : 'Keep Orders', onClick: () => setCancelling(null) }}
        primaryAction={{
          label: cancelling?.length === 1 ? 'Cancel Order' : 'Cancel Orders',
          danger: true,
          onClick: () => {
            if (cancelling) {
              setOrders(list => list.map(o => (cancelling.includes(o.id) ? { ...o, status: 'Cancelled' as OrderStatus } : o)));
              setSelected(new Set());
              setNotice(`${cancelling.length === 1 ? '1 order' : `${cancelling.length} orders`} cancelled.`);
            }
            setCancelling(null);
          },
        }}
      />

      <NewOrderModal
        type={starting}
        onClose={() => setStarting(null)}
        onCreate={(type, warehouse, due) => {
          const order = createOrder(type, warehouse, due);
          setStarting(null);
          navigate(orderPath(order));
        }}
      />
    </div>
  );
}

/* ---------- New Order ▾ ---------- */

/** The brand "New Order ▾" button and its menu: one item per order type; only Move and Adjustment are designed. */
function NewOrderMenu({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (type: OrderType) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onOpenChange(false);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open, onOpenChange]);
  return (
    <div ref={ref} className={styles.menuAnchor}>
      <Button
        size="small"
        variant="brand"
        icon="chevron-down"
        iconPosition="right"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        New Order
      </Button>
      {open && (
        <div className={styles.menu}>
          <ContextMenu
            aria-label="New order type"
            autoFocus
            onClose={() => onOpenChange(false)}
            items={ORDER_TYPES.map(type => {
              const designed = DESIGNED_TYPES.includes(type);
              return {
                label: designed ? (type === 'Move' ? 'Move Request' : type) : `${type} (not designed yet)`,
                disabled: !designed,
                onSelect: designed ? () => onPick(type) : undefined,
              };
            })}
          />
        </div>
      )}
    </div>
  );
}
