import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../../../components/Badge/Badge';
import { Button } from '../../../../components/Button/Button';
import { Dropdown } from '../../../../components/Dropdown/Dropdown';
import { Icon } from '../../../../components/Icon/Icon';
import { SearchInput } from '../../../../components/SearchBar/SearchBar';
import { useWarehouses } from './warehouseStore';
import styles from './dashboard.module.css';
import { Toast } from '../../../components/Toast';

const ORDERS_PATH = '/app/inventory/orders';
const ITEMS_PATH = '/app/inventory/items';
const HOME_WAREHOUSE = 'PHX-124';
const ALL = '__all';

/* ---------- Sample figures, as drawn in Figma ---------- */

const KPIS = [
  { icon: 'dollar-sign', label: 'Inventory Value', value: '$1,842,310', note: '+3.2% vs last 30 days · cost roles only', to: ITEMS_PATH },
  { icon: 'caution', label: 'Below Reorder Point', value: '14 items', note: '5 with no open PO', to: ITEMS_PATH },
  { icon: 'orders', label: 'Open Orders', value: '37', note: '12 due this week', to: ORDERS_PATH },
  { icon: 'in-process', label: 'Waiting for Approval', value: '6', note: '2 older than 3 days', to: ORDERS_PATH },
  { icon: 'review', label: 'Pending Review', value: '4', note: '1 with a discrepancy', to: ORDERS_PATH },
  { icon: 'archive', label: 'In Transit', value: '3', note: '2 arriving tomorrow', to: ORDERS_PATH },
  { icon: 'solar', label: 'Stock needed for projects', value: '3 short', note: 'For Sale orders due in 14 days', to: ORDERS_PATH },
];

type Attention = { icon: string; title: string; detail: string; action: string; to?: string; notice?: string };
const ATTENTION: Attention[] = [
  { icon: 'in-process', title: '6 orders waiting for your approval', detail: 'Oldest: PO-10481 Purchase · 4 days', action: 'Review', to: ORDERS_PATH },
  { icon: 'caution', title: 'MV-10478 Move has a quantity discrepancy', detail: 'Reviewer counted 18, expected 20 at PHX-244', action: 'Open', to: ORDERS_PATH },
  { icon: 'archive', title: 'Wesco PO PO-10486 partially received', detail: '60 modules and 500 connectors still to come', action: 'Receive', notice: 'Receiving isn’t designed yet, so PO-10486 can’t be received in the prototype.' },
  { icon: 'caution', title: '5 items below reorder point with no open PO', detail: 'Phoenix WH: 3 · Tucson WH: 2', action: 'Create POs', notice: 'Purchase orders aren’t designed yet, so the 5 draft POs weren’t created.' },
];

/** Figma "Pill" (Badge) colors per order status */
const STATUSES = [
  { label: 'Draft', count: 5, color: 'black' },
  { label: 'Pending Approval', count: 6, color: 'amber' },
  { label: 'Approved', count: 7, color: 'green' },
  { label: 'In Process', count: 12, color: 'blue' },
  { label: 'In Transit', count: 3, color: 'blue' },
  { label: 'Pending Review', count: 4, color: 'amber' },
] as const;

type LowStock = { item: string; warehouse: string; onHand: number; reorderPoint: number; onOrder: number; suggested: number };
const LOW_STOCK: LowStock[] = [
  { item: 'PA-2045 · Enphase IQ8M Microinverter', warehouse: 'PHX-124', onHand: 18, reorderPoint: 60, onOrder: 96, suggested: 0 },
  { item: 'PA-1188 · IronRidge XR100 Rail 14 ft', warehouse: 'PHX-124', onHand: 22, reorderPoint: 40, onOrder: 0, suggested: 60 },
  { item: 'PA-3310 · MC4 Connector Pair', warehouse: 'TUC-125', onHand: 40, reorderPoint: 150, onOrder: 0, suggested: 300 },
  { item: 'PA-4402 · Tesla Powerwall 3', warehouse: 'PHX-124', onHand: 2, reorderPoint: 4, onOrder: 2, suggested: 0 },
  { item: 'PA-2210 · 10 AWG PV Wire (500 ft)', warehouse: 'TUC-125', onHand: 3, reorderPoint: 8, onOrder: 0, suggested: 10 },
];

const VALUE_BY_WAREHOUSE = [
  { label: 'PHX-124 · Phoenix WH', value: 1104200 },
  { label: 'TUC-125 · Tucson WH', value: 486900 },
  { label: 'FLG-201 · Flagstaff WH', value: 171410 },
  { label: 'Vans & job sites', value: 79800 },
];

const RANGES = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'This year'];
const dollars = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/**
 * Inventory › Dashboard (Figma "Inventory / Dashboard", 819:7974): a toolbar (warehouse, Export, date range, search,
 * New Order), seven KPI tiles, Needs Your Attention, Open Orders by Status, Low Stock and Value by Warehouse. The
 * figures are Figma's sample values; the cards link to the Items and Orders lists. Purchasing and Receiving aren't
 * designed yet, so their actions explain that instead.
 */
export function InventoryDashboardPage() {
  const navigate = useNavigate();
  const warehouses = useWarehouses();
  const [warehouse, setWarehouse] = useState<string>(HOME_WAREHOUSE);
  const [range, setRange] = useState('Last 30 days');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'HUB360 · Inventory · Dashboard';
  }, []);

  const warehouseOptions = [
    ...warehouses.map(w => ({ value: w.code, label: `${w.code} ${w.name}${w.code === HOME_WAREHOUSE ? ' (home)' : ''}` })),
    { value: ALL, label: 'All warehouses' },
  ];
  const statusMax = Math.max(...STATUSES.map(s => s.count));
  const openCount = STATUSES.reduce((sum, s) => sum + s.count, 0);
  const valueMax = Math.max(...VALUE_BY_WAREHOUSE.map(v => v.value));

  return (
    <div className={styles.page}>
      <div className={styles.toolbar} role="toolbar" aria-label="Dashboard">
        {/* Figma note: opens on the user's home warehouse (they can switch to All) */}
        <Dropdown
          variant="small"
          label="Warehouse"
          hideLabel
          options={warehouseOptions}
          value={warehouse}
          onChange={v => setWarehouse(v as string)}
          renderValue={sel => `Warehouse: ${sel[0]?.label ?? 'All warehouses'}`}
        />
        <Button size="small" variant="primary" icon="export-download" onClick={() => setNotice(`Exported the dashboard for ${range.toLowerCase()} to CSV.`)}>
          Export
        </Button>
        <Dropdown variant="small" label="Date range" hideLabel options={RANGES.map(r => ({ value: r, label: r }))} value={range} onChange={v => setRange(v as string)} />
        <SearchInput
          className={styles.search}
          aria-label="Search items, orders or suppliers"
          placeholder="Search items, orders or suppliers"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && query.trim()) navigate(ITEMS_PATH);
          }}
        />
        <Button size="small" variant="brand" onClick={() => navigate(ORDERS_PATH)}>
          New Order
        </Button>
      </div>

      {notice && <Toast type="info" title={notice} onClose={() => setNotice(null)} />}

      {/* Figma "Tile / KPI" (design-system library, was "KPI Tile (Proposed)") */}
      <ul className={styles.kpis} aria-label="Key figures">
        {KPIS.map(k => (
          <li key={k.label}>
            <button type="button" className={styles.kpi} onClick={() => navigate(k.to)}>
              <span className={styles.kpiLabel}>
                <Icon name={k.icon} size={20} color="currentColor" />
                {k.label}
              </span>
              <span className={styles.kpiValue}>{k.value}</span>
              <span className={styles.kpiNote}>{k.note}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className={styles.row}>
        <section className={styles.card} aria-labelledby="dash-attention">
          <h2 id="dash-attention" className={styles.cardTitle}>
            Needs Your Attention
          </h2>
          <ul className={styles.attention}>
            {ATTENTION.map(a => (
              <li key={a.title} className={styles.attentionItem}>
                <Icon name={a.icon} size={24} color="currentColor" />
                <span className={styles.attentionText}>
                  <span className={styles.attentionTitle}>{a.title}</span>
                  <span className={styles.attentionDetail}>{a.detail}</span>
                </span>
                <Button
                  size="small"
                  variant="brand"
                  className={styles.softBrand}
                  onClick={() => (a.to ? navigate(a.to) : setNotice(a.notice ?? null))}
                  aria-label={`${a.action}: ${a.title}`}
                >
                  {a.action}
                </Button>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.card} aria-labelledby="dash-status">
          <h2 id="dash-status" className={styles.cardTitle}>
            Open Orders by Status
          </h2>
          <ul className={styles.bars}>
            {STATUSES.map(s => (
              <li key={s.label}>
                <button type="button" className={styles.statusBar} onClick={() => navigate(ORDERS_PATH)} aria-label={`${s.label}: ${s.count} orders`}>
                  <span className={styles.statusLabel}>
                    <Badge shape="pill" color={s.color}>
                      {s.label}
                    </Badge>
                  </span>
                  <span className={styles.track} aria-hidden>
                    <span className={styles.fill} style={{ width: `${(s.count / statusMax) * 100}%` }} />
                  </span>
                  <span className={styles.count}>{s.count}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className={styles.footnote}>{openCount} open · Completed and Cancelled are not counted. Select a status to open the filtered Orders list.</p>
        </section>
      </div>

      <div className={`${styles.row} ${styles.rowWide}`}>
        <section className={styles.card} aria-labelledby="dash-low-stock">
          <div className={styles.cardHead}>
            <h2 id="dash-low-stock" className={styles.cardTitle}>
              Low Stock
            </h2>
            <Button size="small" variant="brand" onClick={() => navigate(ITEMS_PATH)}>
              View All 14
            </Button>
          </div>
          {/* Figma "Dashboard Table Row (Proposed)": a compact table for dashboard cards */}
          <div className={styles.miniTable} role="table" aria-label="Low stock">
            <div className={styles.miniHead} role="row">
              {['Item', 'Warehouse', 'On Hand', 'Reorder Pt', 'On Order', 'Suggested'].map(h => (
                <span key={h} role="columnheader">
                  {h}
                </span>
              ))}
              <span role="columnheader" className={styles.srOnly}>
                Action
              </span>
            </div>
            {LOW_STOCK.map(r => (
              <div key={r.item} className={styles.miniRow} role="row">
                <span role="cell">{r.item}</span>
                <span role="cell">{r.warehouse}</span>
                <span role="cell">{r.onHand}</span>
                <span role="cell">{r.reorderPoint}</span>
                <span role="cell">{r.onOrder}</span>
                <span role="cell">{r.suggested}</span>
                <span role="cell" className={styles.miniAction}>
                  <Button
                    size="tiny"
                    variant="brand"
                    className={styles.softBrand}
                    onClick={() =>
                      setNotice(
                        r.onOrder > 0
                          ? `Purchase orders aren’t designed yet, so the open PO for ${r.item.split(' · ')[1]} can’t be shown.`
                          : `Purchase orders aren’t designed yet, so a draft PO for ${r.suggested} × ${r.item.split(' · ')[1]} wasn’t created.`,
                      )
                    }
                  >
                    {r.onOrder > 0 ? 'View PO' : 'Create PO'}
                  </Button>
                </span>
              </div>
            ))}
          </div>
          <p className={styles.footnote}>
            Suggested = reorder up to Max, minus stock already on order. Create PO opens a Draft Purchase with the item’s primary supplier.
          </p>
        </section>

        <section className={styles.card} aria-labelledby="dash-value">
          <h2 id="dash-value" className={styles.cardTitle}>
            Value by Warehouse
          </h2>
          <ul className={styles.values}>
            {VALUE_BY_WAREHOUSE.map(v => (
              <li key={v.label} className={styles.value}>
                <span className={styles.valueTop}>
                  <span>{v.label}</span>
                  <strong>{dollars(v.value)}</strong>
                </span>
                <span className={`${styles.track} ${styles.trackThin}`} aria-hidden>
                  <span className={styles.fill} style={{ width: `${(v.value / valueMax) * 100}%` }} />
                </span>
              </li>
            ))}
          </ul>
          <p className={styles.footnote}>At cost, using each item’s costing method.</p>
        </section>
      </div>
    </div>
  );
}
