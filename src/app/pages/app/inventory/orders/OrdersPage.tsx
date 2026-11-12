import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../../../../components/Button/Button';
import { ContextMenu } from '../../../../../components/ContextMenu/ContextMenu';
import { DataTable, type DataColumn, type DataSort } from '../../../../../components/DataTable/DataTable';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { Icon } from '../../../../../components/Icon/Icon';
import { PageTracker } from '../../../../../components/PageTracker/PageTracker';
import { SearchInput } from '../../../../../components/SearchBar/SearchBar';
import { AppLink } from '../../../../components/AppLink';
import { AppModal } from '../../../../components/AppModal';
import { RowMenu } from '../record/RowMenu';
import { useWarehouses } from '../warehouseStore';
import { NewOrderModal } from './NewOrderModal';
import { OrderStatusPill } from './OrderStatus';
import { DESIGNED_TYPES, ORDER_STATUSES, ORDER_TYPES, formatDate, type Order, type OrderStatus, type OrderType } from './orderData';
import { createOrder, orderPath, setOrders, useOrders } from './orderStore';
import { PAGE_SIZES } from '../record/tableKit';
import styles from './orders.module.css';
import { Toast } from '../../../../../components/Toast/Toast';
import { useHelperFlag } from '../../../../shell/helperFlags';
import { HelperToggle, PrototypeHelper } from '../../../../shell/PrototypeHelper';

const ALL = '__all';

// On a narrow card the columns shrink to their minWidth (text wraps to 2 lines); nothing hides
const COLUMNS: DataColumn[] = [
  { key: 'number', label: 'Order #', width: 150, minWidth: 110 },
  { key: 'type', label: 'Type', width: 110, minWidth: 90 },
  { key: 'warehouse', label: 'Warehouse', width: 'fill', minWidth: 120 },
  { key: 'status', label: 'Status', width: 130, minWidth: 110 },
  { key: 'created', label: 'Created', width: 124, minWidth: 100, align: 'end' },
  { key: 'due', label: 'Due', width: 124, minWidth: 100, align: 'end' },
];

/**
 * Inventory › Orders: the list of orders, so the two designed records (Move Request, Adjustment) can be reached.
 * NOT IN FIGMA: the "→ Order" page (292:26345) is empty; this list copies the Warehouses list pattern until the
 * designer draws one (ORDERS.md, open question 1).
 */
export function OrdersPage() {
  const allOrders = useOrders();
  const warehouses = useWarehouses();
  const navigate = useNavigate();
  const [timerLoading, setLoading] = useState(true);
  const keepLoading = useHelperFlag('orders.loading');
  const noOrders = useHelperFlag('orders.empty');
  // Helper switch: "Keep loading" holds the skeleton after the 500 ms timer
  const loading = timerLoading || keepLoading;
  // Helper switch: "No orders" shows the list as if it had none (the store is untouched)
  const orders = useMemo(() => (noOrders ? [] : allOrders), [noOrders, allOrders]);
  const [notice, setNotice] = useState<string | null>(null);

  const [view, setView] = useState<string>(ALL);
  // ?q= starts the search, e.g. a warehouse code from the Deactivate confirmation's "View Open Orders"
  const [params] = useSearchParams();
  const [query, setQuery] = useState(() => params.get('q') ?? '');
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

  const cancellable = orders.filter(o => selected.has(o.id) && o.status === 'In Process');

  return (
    <div className={styles.page}>
      <PrototypeHelper title="Orders">
        <HelperToggle flag="orders.loading" label="Keep loading" />
        <HelperToggle flag="orders.empty" label="No orders" />
      </PrototypeHelper>
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
            { value: 'cancel', label: 'Cancel', disabled: cancellable.length === 0 },
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
        {/* Volt Data Table (Figma "Data Table" page), as on the warehouse record's tables; its skeleton while loading */}
        <DataTable
          aria-label="Orders"
          columns={COLUMNS}
          rows={pageRows}
          rowLabel={o => o.number}
          loading={loading}
          sort={sort}
          onSortChange={key =>
            setSort(s => (s?.key === key ? { key, direction: s.direction === 'ascending' ? 'descending' : 'ascending' } : { key, direction: 'ascending' }))
          }
          selected={[...selected]}
          onSelectedChange={ids => setSelected(new Set(ids))}
          empty={
            <div className={styles.emptyCell}>
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
          }
          onMore={o => setMenuFor(m => (m === o.id ? null : o.id))}
          renderAfterRow={o =>
            menuFor === o.id && (
              <RowMenu
                label={o.number}
                onClose={() => setMenuFor(null)}
                items={[
                  { label: 'View', onSelect: () => navigate(orderPath(o)) },
                  ...(o.status === 'In Process' ? [{ label: 'Cancel Order', onSelect: () => setCancelling([o.id]) }] : []),
                ]}
              />
            )
          }
          cells={o => ({
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
          label="Order pages"
        />
      </div>

      <AppModal
        open={cancelling !== null}
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
