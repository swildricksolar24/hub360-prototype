/**
 * Sample data and helpers for Inventory › Orders (see ../ORDERS.md). In memory, like the rest of the prototype.
 * The stock catalog is shared by every warehouse, to keep the prototype small.
 */

export type OrderType = 'Move' | 'Adjustment' | 'Transfer' | 'Build' | 'Sale' | 'Purchase' | 'Return';
export type OrderStatus = 'In Process' | 'Completed' | 'Cancelled';

export const ORDER_TYPES: OrderType[] = ['Move', 'Adjustment', 'Transfer', 'Build', 'Sale', 'Purchase', 'Return'];
/** The only order records Figma designs (Move Request 296:52864, Adjustment 705:167001). */
export const DESIGNED_TYPES: OrderType[] = ['Move', 'Adjustment'];
export const ORDER_STATUSES: OrderStatus[] = ['In Process', 'Completed', 'Cancelled'];

/** Order # prefix per type; Figma's old Move frame shows "MO # 12456". */
export const ORDER_PREFIX: Record<OrderType, string> = {
  Move: 'MO',
  Adjustment: 'AD',
  Transfer: 'TO',
  Build: 'BO',
  Sale: 'SO',
  Purchase: 'PO',
  Return: 'RO',
};

/** One item at one location (Add Items picker rows: Item # · Name · Location · OH · Avail · frozen / hidden). */
export type StockItem = {
  id: string;
  itemNo: string;
  name: string;
  type: 'Part' | 'Assembly' | 'Kit';
  location: string;
  onHand: number;
  avail: number;
  unitCost: number;
  /** Locked (e.g. during a count): can't be moved. */
  frozen?: boolean;
  /** Hidden from the catalog. */
  hidden?: boolean;
};

/** A Move Request line: the stock it moves from, how much, and where to. */
export type MoveLine = { id: string; stockId: string; moveQty: number | null; newLocation: string | null };

/** An Adjustment line: an item and a quantity (negative takes stock away). */
export type AdjustLine = { id: string; itemNo: string; qty: number | null };

export type Order = {
  /** URL id, e.g. "MO-12456". */
  id: string;
  /** The order # as shown, e.g. "MO # 12456". */
  number: string;
  type: OrderType;
  /** Warehouse code (warehouseStore). */
  warehouse: string;
  status: OrderStatus;
  /** ISO dates (YYYY-MM-DD). */
  created: string;
  due?: string;
  moveLines: MoveLine[];
  adjustLines: AdjustLine[];
};

export const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
export const count = (n: number) => n.toLocaleString('en-US');

/** "2026-05-18" → "May 18, 2026". */
export function formatDate(iso?: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const todayIso = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/* ---------- Stock ---------- */

const S = (
  id: string,
  itemNo: string,
  name: string,
  type: StockItem['type'],
  location: string,
  onHand: number,
  avail: number,
  unitCost: number,
  flags: { frozen?: boolean; hidden?: boolean } = {},
): StockItem => ({ id, itemNo, name, type, location, onHand, avail, unitCost, ...flags });

export const STOCK: StockItem[] = [
  S('s1', 'AD23-4529', 'Lug Nut with optional screw', 'Part', 'PHX-066', 204, 180, 0.42),
  S('s2', 'AD23-4529', 'Lug Nut with optional screw', 'Part', 'B-01-01', 60, 60, 0.42),
  S('s3', '1234567', 'Hex Bolt', 'Part', 'PHX-244', 520, 500, 1.24),
  S('s4', 'PA-1234567', 'Hex Nut', 'Part', 'PHX-244', 860, 840, 0.98),
  S('s5', 'AS-1234567', 'Shock Build', 'Assembly', 'B-02-03', 42, 40, 3.24),
  S('s6', 'REC-325', 'REC 325 Solar Panel', 'Part', 'PHX-101', 96, 80, 189),
  S('s7', 'REC-325', 'REC 325 Solar Panel', 'Part', 'B-01-01', 24, 24, 189),
  S('s8', 'IQ8-PLUS', 'Enphase IQ8+ Microinverter', 'Part', 'PHX-102', 310, 300, 142.5),
  S('s9', 'RL-168', 'Mounting Rail 168 in.', 'Part', 'PHX-210', 140, 130, 38.75),
  S('s10', 'MC4-PAIR', 'MC4 Connector Pair', 'Part', 'B-01-02', 1200, 1150, 2.15, { frozen: true }),
  S('s11', 'KT-RK100', 'Roof Mount Kit', 'Kit', 'B-03-01', 35, 30, 64),
  S('s12', 'WR-10AWG', '10 AWG PV Wire, 500 ft', 'Part', 'PHX-066', 18, 18, 112, { hidden: true }),
  S('s13', 'GB-LUG', 'Grounding Lug', 'Part', 'PHX-244', 640, 600, 0.86),
  S('s14', 'EC-150', 'End Clamp', 'Part', 'B-02-01', 480, 470, 1.1),
  S('s15', 'MC-150', 'Mid Clamp', 'Part', 'B-02-01', 520, 500, 1.05),
  S('s16', 'SW-60A', 'AC Disconnect 60A', 'Part', 'PHX-301', 22, 20, 48.9, { frozen: true }),
  S('s17', 'AS-4410', 'Combiner Box Assembly', 'Assembly', 'B-03-02', 12, 10, 225),
  S('s18', 'IQ8-PLUS', 'Enphase IQ8+ Microinverter', 'Part', 'B-01-02', 40, 36, 142.5),
];

export const stockById = (id: string) => STOCK.find(s => s.id === id);
export const LOCATIONS = [...new Set(STOCK.map(s => s.location))].sort();

/** One row per item (Adjustment search and lines), with the item's unit cost. */
export const ITEMS = [...new Map(STOCK.map(s => [s.itemNo, { itemNo: s.itemNo, name: s.name, type: s.type, unitCost: s.unitCost }])).values()];
export const itemByNo = (itemNo: string) => ITEMS.find(i => i.itemNo === itemNo);

/* ---------- Validation ---------- */

export type MoveLineErrors = { moveQty?: string; newLocation?: string };

/** What a Move line still needs before Process Move. */
export function moveLineErrors(line: MoveLine): MoveLineErrors {
  const stock = stockById(line.stockId);
  const errors: MoveLineErrors = {};
  if (line.moveQty === null || line.moveQty <= 0) errors.moveQty = 'Enter a quantity';
  else if (!Number.isInteger(line.moveQty)) errors.moveQty = 'Whole numbers only';
  else if (stock && line.moveQty > stock.onHand) errors.moveQty = `Max ${count(stock.onHand)}`;
  if (!line.newLocation) errors.newLocation = 'Choose a location';
  else if (stock && line.newLocation === stock.location) errors.newLocation = 'Same as Location';
  return errors;
}

/** What an Adjustment line still needs before Post Adjustment. */
export function adjustLineError(line: AdjustLine): string | undefined {
  if (line.qty === null || line.qty === 0) return 'Enter a quantity';
  if (!Number.isInteger(line.qty)) return 'Whole numbers only';
  return undefined;
}

/* ---------- Sample orders ---------- */

let lineSeq = 0;
export const newLineId = () => `l${Date.now().toString(36)}${(lineSeq++).toString(36)}`;

const M = (stockId: string, moveQty: number | null, newLocation: string | null): MoveLine => ({ id: newLineId(), stockId, moveQty, newLocation });
const A = (itemNo: string, qty: number): AdjustLine => ({ id: newLineId(), itemNo, qty });

const O = (
  type: OrderType,
  num: number,
  warehouse: string,
  status: OrderStatus,
  created: string,
  due: string | undefined,
  lines: { move?: MoveLine[]; adjust?: AdjustLine[] } = {},
): Order => ({
  id: `${ORDER_PREFIX[type]}-${num}`,
  number: `${ORDER_PREFIX[type]} # ${num}`,
  type,
  warehouse,
  status,
  created,
  due,
  moveLines: lines.move ?? [],
  adjustLines: lines.adjust ?? [],
});

export const SAMPLE_ORDERS: Order[] = [
  O('Move', 12456, 'PHX-124', 'In Process', '2026-10-28', '2026-11-04', {
    move: [
      M('s1', 24, 'PHX-244'),
      M('s3', 50, 'B-01-01'),
      M('s6', 12, 'B-01-01'),
      M('s4', 120, 'PHX-066'),
      M('s5', 6, 'B-03-01'),
      M('s8', 40, 'B-01-02'),
      M('s9', 20, 'PHX-244'),
      M('s11', 5, 'B-02-01'),
      M('s13', 100, 'B-02-03'),
      M('s14', 60, 'PHX-210'),
      M('s15', 60, 'PHX-210'),
      M('s17', null, null),
    ],
  }),
  O('Adjustment', 20871, 'PHX-124', 'In Process', '2026-10-30', '2026-11-06', {
    adjust: [A('1234567', 2), A('PA-1234567', 2), A('AS-1234567', 1)],
  }),
  O('Move', 12455, 'MES-201', 'Completed', '2026-10-21', '2026-10-24', {
    move: [M('s2', 20, 'PHX-066'), M('s7', 8, 'PHX-101')],
  }),
  O('Transfer', 30112, 'PHX-126', 'In Process', '2026-10-27', '2026-11-10'),
  O('Sale', 48820, 'TEM-301', 'In Process', '2026-10-29', '2026-11-03'),
  O('Purchase', 77031, 'PHX-124', 'Completed', '2026-10-12', '2026-10-26'),
  O('Adjustment', 20870, 'GIL-401', 'Completed', '2026-10-18', undefined, {
    adjust: [A('MC4-PAIR', -4), A('EC-150', 10)],
  }),
  O('Move', 12454, 'CHD-501', 'Cancelled', '2026-10-15', '2026-10-20', {
    move: [M('s9', 10, 'B-03-01')],
  }),
  O('Build', 55210, 'PHX-124', 'In Process', '2026-10-31', '2026-11-14'),
  O('Return', 61007, 'SCO-601', 'In Process', '2026-11-01', '2026-11-08'),
  O('Move', 12457, 'TUC-901', 'In Process', '2026-11-01', '2026-11-05', {
    move: [M('s18', 12, 'PHX-102'), M('s13', null, 'B-02-01'), M('s12', 4, null)],
  }),
  O('Adjustment', 20872, 'LV-210', 'In Process', '2026-11-02', undefined, {
    adjust: [A('REC-325', -1)],
  }),
];
