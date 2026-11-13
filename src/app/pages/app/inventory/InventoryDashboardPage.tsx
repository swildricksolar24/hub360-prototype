import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../../../components/Badge/Badge';
import { Button } from '../../../../components/Button/Button';
import { DataTable, type DataColumn, type DataSort } from '../../../../components/DataTable/DataTable';
import { Dropdown } from '../../../../components/Dropdown/Dropdown';
import { Icon } from '../../../../components/Icon/Icon';
import { SearchInput } from '../../../../components/SearchBar/SearchBar';
import { Tile } from '../../../../components/Tile/Tile';
import { useWarehouses } from './warehouseStore';
import type { Warehouse } from './warehouseData';
import styles from './dashboard.module.css';
import { Toast } from '../../../../components/Toast/Toast';

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
/** DataTable rows need an id: the part number */
const LOW_STOCK_ROWS = LOW_STOCK.map(r => ({ ...r, id: r.item.split(' · ')[0] }));
/** Figma Low Stock table: Item is the fixed 290px Column 1 Wide, the action buttons sit in the 80px Button Action column */
const LOW_STOCK_COLUMNS: DataColumn[] = [
  { key: 'item', label: 'Item', width: 290 },
  { key: 'warehouse', label: 'Warehouse', width: 'fill' },
  { key: 'onHand', label: 'On Hand', width: 'fill' },
  { key: 'reorderPoint', label: 'Reorder Pt', width: 'fill' },
  { key: 'onOrder', label: 'On Order', width: 'fill' },
  { key: 'suggested', label: 'Suggested', width: 'fill' },
  { key: 'action', label: 'Action', width: 80, align: 'end', flush: true, sortable: false, labelHidden: true },
];

const VALUE_BY_WAREHOUSE = [
  { label: 'PHX-124 · Phoenix WH', value: 1104200 },
  { label: 'TUC-125 · Tucson WH', value: 486900 },
  { label: 'FLG-201 · Flagstaff WH', value: 171410 },
  { label: 'Vans & job sites', value: 79800 },
];

const RANGES = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'This year'];
const dollars = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/* ---------- Figures per warehouse (sample data) ---------- */

type Status = { label: string; count: number; color: (typeof STATUSES)[number]['color'] };
type Figures = { kpis: typeof KPIS; attention: Attention[]; statuses: Status[]; lowStock: typeof LOW_STOCK_ROWS; belowReorder: number };

/** Figma's sample figures: what All warehouses shows. */
const ALL_FIGURES: Figures = { kpis: KPIS, attention: ATTENTION, statuses: [...STATUSES], lowStock: LOW_STOCK_ROWS, belowReorder: 14 };

/**
 * A warehouse's own figures, so switching warehouses changes the dashboard. They're sample numbers made from the
 * warehouse's code (the same every time it's picked), scaled from Figma's All-warehouses figures, except Inventory
 * Value, which is the warehouse's own (Warehouses list).
 */
function figuresFor(w: Warehouse): Figures {
  // A repeatable 0–1 number per warehouse and figure
  let seed = 0;
  for (const ch of w.code) seed = (seed * 31 + ch.charCodeAt(0)) % 100003;
  const rand = (i: number) => (((seed + 1) * (i + 7) * 9301 + 49297) % 233280) / 233280;
  const share = 0.3 + rand(0) * 0.6;
  const scaled = (n: number, i: number, min = 0) => Math.max(min, Math.round(n * share * (0.6 + rand(i) * 0.8)));

  const statuses = STATUSES.map((s, i) => ({ ...s, count: scaled(s.count, i + 1) }));
  const count = (label: string) => statuses.find(s => s.label === label)?.count ?? 0;
  const open = statuses.reduce((sum, s) => sum + s.count, 0);
  const belowReorder = scaled(14, 10, 1);
  const noPo = Math.min(belowReorder, scaled(5, 11));
  const short = scaled(3, 12);
  const change = (rand(13) * 8 - 3).toFixed(1);

  const kpis = KPIS.map(k => {
    switch (k.label) {
      case 'Inventory Value':
        return { ...k, value: dollars(w.value), note: `${Number(change) >= 0 ? '+' : ''}${change}% vs last 30 days · cost roles only` };
      case 'Below Reorder Point':
        return { ...k, value: `${belowReorder} ${belowReorder === 1 ? 'item' : 'items'}`, note: `${noPo} with no open PO` };
      case 'Open Orders':
        return { ...k, value: String(open), note: `${Math.round(open * 0.3)} due this week` };
      case 'Waiting for Approval':
        return { ...k, value: String(count('Pending Approval')), note: `${Math.min(count('Pending Approval'), scaled(2, 14))} older than 3 days` };
      case 'Pending Review':
        return { ...k, value: String(count('Pending Review')), note: `${Math.min(count('Pending Review'), scaled(1, 15))} with a discrepancy` };
      case 'In Transit':
        return { ...k, value: String(count('In Transit')), note: `${Math.min(count('In Transit'), scaled(2, 16))} arriving tomorrow` };
      default:
        return { ...k, value: `${short} short` };
    }
  });

  const approvals = count('Pending Approval');
  const attention = ATTENTION.map(a =>
    a.title.includes('waiting for your approval')
      ? { ...a, title: `${approvals} ${approvals === 1 ? 'order' : 'orders'} waiting for your approval` }
      : a.title.includes('below reorder point')
        ? { ...a, title: `${noPo} ${noPo === 1 ? 'item' : 'items'} below reorder point with no open PO`, detail: `${w.name}: ${noPo}` }
        : a,
  );

  // Its Low Stock: some of the sample items, with this warehouse's quantities
  const lowStock = LOW_STOCK_ROWS.filter((_, i) => rand(20 + i) < 0.75)
    .slice(0, Math.max(1, Math.min(5, belowReorder)))
    .map((r, i) => {
      const reorderPoint = Math.max(2, Math.round(r.reorderPoint * (0.5 + rand(30 + i))));
      const onHand = Math.max(0, Math.round(reorderPoint * rand(40 + i) * 0.8));
      const onOrder = rand(50 + i) < 0.4 ? Math.round(reorderPoint * 1.5) : 0;
      return { ...r, warehouse: w.code, reorderPoint, onHand, onOrder, suggested: onOrder ? 0 : reorderPoint * 2 - onHand };
    });

  return { kpis, attention, statuses, lowStock, belowReorder };
}

/**
 * Inventory › Dashboard (Figma "Inventory / Dashboard", 819:7974): a toolbar (warehouse, Export, date range, and a
 * search box filling the rest), seven KPI tiles, Needs Your Attention, Open Orders by Status, Low Stock and Value by Warehouse. All
 * warehouses shows Figma's sample figures; a single warehouse shows its own (figuresFor), so switching changes them. The cards link to the Items and Orders lists. Purchasing and Receiving aren't
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
  // The chosen warehouse's figures (All shows Figma's)
  const chosen = warehouses.find(w => w.code === warehouse);
  const figures = chosen ? figuresFor(chosen) : ALL_FIGURES;
  const statusMax = Math.max(1, ...figures.statuses.map(s => s.count));
  const openCount = figures.statuses.reduce((sum, s) => sum + s.count, 0);
  const valueMax = Math.max(...VALUE_BY_WAREHOUSE.map(v => v.value));
  const valueTotal = VALUE_BY_WAREHOUSE.reduce((sum, v) => sum + v.value, 0);

  // Low Stock sorts by the column whose sort icon is pressed (ascending first, then descending)
  const [lowSort, setLowSort] = useState<DataSort>();
  const toggleLowSort = (key: string) =>
    setLowSort(s => ({ key, direction: s?.key === key && s.direction === 'ascending' ? 'descending' : 'ascending' }));
  const lowStockRows = lowSort
    ? [...figures.lowStock].sort((a, b) => {
        const x = a[lowSort.key as keyof LowStock];
        const y = b[lowSort.key as keyof LowStock];
        const order = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
        return lowSort.direction === 'ascending' ? order : -order;
      })
    : figures.lowStock;

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
      </div>

      {notice && <Toast type="info" title={notice} onClose={() => setNotice(null)} />}

      {/* Design-system Tile (Figma "Tile / KPI") */}
      <ul className={styles.kpis} aria-label="Key figures">
        {figures.kpis.map(k => (
          <li key={k.label}>
            <Tile icon={k.icon} label={k.label} value={k.value} note={k.note} onClick={() => navigate(k.to)} />
          </li>
        ))}
      </ul>

      <div className={styles.row}>
        <section className={styles.card} aria-labelledby="dash-attention">
          <h2 id="dash-attention" className={styles.cardTitle}>
            Needs Your Attention
          </h2>
          <ul className={styles.attention}>
            {figures.attention.map(a => (
              <li key={a.title} className={styles.attentionItem}>
                <Icon name={a.icon} size={24} color="currentColor" />
                <span className={styles.attentionText}>
                  <span className={styles.attentionTitle}>{a.title}</span>
                  <span className={styles.attentionDetail}>{a.detail}</span>
                </span>
                {/* Design-system Figma "Brand / Small / Outline" (3290:6405) */}
                <Button
                  size="small"
                  variant="brand-outline"
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
          {/* Figma: the title with the open-order total on the right */}
          <div className={styles.titleRow}>
            <h2 id="dash-status" className={styles.cardTitle}>
              Open Orders by Status
            </h2>
            <span className={`${styles.cardTitle} ${styles.cardTotal}`} aria-label={`${openCount} open orders`}>
              {openCount}
            </span>
          </div>
          <ul className={styles.bars}>
            {figures.statuses.map(s => (
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
          <p className={styles.footnote}>Completed and Cancelled are not counted. Select a status to open the filtered Orders list.</p>
        </section>
      </div>

      <div className={`${styles.row} ${styles.rowWide}`}>
        <section className={styles.card} aria-labelledby="dash-low-stock">
          <div className={styles.cardHead}>
            <h2 id="dash-low-stock" className={styles.cardTitle}>
              Low Stock
            </h2>
            {/* Design-system Figma "Brand / Small / Outline" (3290:6405) */}
            <Button size="small" variant="brand-outline" onClick={() => navigate(ITEMS_PATH)}>
              View All {figures.belowReorder}
            </Button>
          </div>
          {/*
           * Figma "Data Table" (Base 3131:272) with Column 1 Wide, Column 6 and Button Action on: a 290px Item column,
           * five shared columns and an 80px column of "Primary / Tiny / Brand" buttons.
           */}
          <DataTable
            aria-label="Low stock"
            columns={LOW_STOCK_COLUMNS}
            rows={lowStockRows}
            rowLabel={r => r.item}
            sort={lowSort}
            onSortChange={toggleLowSort}
            cells={r => ({
              item: r.item,
              warehouse: r.warehouse,
              onHand: r.onHand,
              reorderPoint: r.reorderPoint,
              onOrder: r.onOrder,
              suggested: r.suggested,
              action: (
                <Button
                  size="tiny"
                  variant="brand"
                  aria-label={`${r.onOrder > 0 ? 'View PO' : 'Create PO'} for ${r.item}`}
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
              ),
            })}
          />
          <p className={styles.footnote}>
            Suggested = reorder up to Max, minus stock already on order. Create PO opens a Draft Purchase with the item’s primary supplier.
          </p>
        </section>

        <section className={styles.card} aria-labelledby="dash-value">
          {/*
           * Figma: the title with the total on the right. Figma's sample total ($1,688,041) doesn't match its rows, so
           * the total is their sum, which is also the Inventory Value tile.
           */}
          <div className={styles.titleRow}>
            <h2 id="dash-value" className={styles.cardTitle}>
              Value by Warehouse
            </h2>
            <span className={`${styles.cardTitle} ${styles.cardTotal}`} aria-label={`Total ${dollars(valueTotal)}`}>
              {dollars(valueTotal)}
            </span>
          </div>
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
