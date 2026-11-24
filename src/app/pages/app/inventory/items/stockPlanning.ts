import { available, hashOf, type Item, type StockRow, type WarehouseLevels } from './itemData';

/**
 * Sample numbers for an item record's Stock tab (ITEMS.md §6): lots, open purchase orders, in-transit and not-shipped
 * quantities, demand history and each warehouse's ordering levels. Purchasing isn't in the prototype, so they come from
 * the item's id (the same on every load) instead of real orders. Only the levels can be edited (item.warehouseLevels).
 */

/** Stock › Ordering's Average Demand tiles: the units used over the last N days. */
export const DEMAND_WINDOWS = [7, 14, 30, 45, 60, 90, 180] as const;
export type DemandWindow = (typeof DEMAND_WINDOWS)[number];

const roundTo = (n: number, step: number) => Math.max(0, Math.round(n / step) * step);

/** A location's lot (lot-controlled items only), e.g. "L-2405". */
export const lotOf = (item: Item, row: StockRow) => (item.lotControl ? `L-${2400 + (hashOf(row.id) % 300)}` : null);

/** The item's warehouses, in the order they first appear in its stock, each with its locations. */
export function warehousesOf(item: Item): { code: string; rows: StockRow[] }[] {
  const codes = [...new Set(item.stock.map(s => s.warehouse))];
  return codes.map(code => ({ code, rows: item.stock.filter(s => s.warehouse === code) }));
}

const onHandIn = (item: Item, code: string) => item.stock.filter(s => s.warehouse === code).reduce((t, s) => t + s.onHand, 0);
export const availableIn = (item: Item, code: string) => item.stock.filter(s => s.warehouse === code).reduce((t, s) => t + available(s), 0);

/** Units on open purchase orders for this warehouse (none for about a third of them). */
export function openPoQty(item: Item, code: string) {
  const h = hashOf(`${item.id}:${code}:po`);
  return h % 3 === 0 ? 0 : roundTo(onHandIn(item, code) * (0.2 + (h % 50) / 100), 6);
}
/** Of the open PO units, those the supplier has shipped (on the way) and those not shipped yet. */
export function inTransit(item: Item, code: string) {
  const po = openPoQty(item, code);
  return roundTo(po * (0.3 + (hashOf(`${item.id}:${code}:ship`) % 40) / 100), 6);
}
export const notShipped = (item: Item, code: string) => openPoQty(item, code) - inTransit(item, code);

/** Units used across all warehouses over the last `days` days. */
export function demandFor(item: Item, days: number) {
  const total = item.stock.reduce((t, s) => t + s.onHand, 0);
  const perDay = Math.max(0.5, total / 45) * (0.6 + (hashOf(item.id) % 80) / 100);
  const jitter = 1 + ((hashOf(`${item.id}:${days}`) % 21) - 10) / 100;
  return Math.round(perDay * days * jitter);
}

/** Each warehouse's share of the demand: its share of the on-hand stock (a new, empty location still counts a little). */
export function projectedRequirement(item: Item, days: number): Record<string, number> {
  const codes = warehousesOf(item).map(w => w.code);
  const weights = codes.map(c => onHandIn(item, c) + 1);
  const sum = weights.reduce((t, w) => t + w, 0);
  const demand = demandFor(item, days);
  const shares = weights.map(w => Math.floor((demand * w) / sum));
  // The rounding remainder goes to the biggest warehouse, so the shares add up to the tile
  if (shares.length) shares[weights.indexOf(Math.max(...weights))] += demand - shares.reduce((t, s) => t + s, 0);
  return Object.fromEntries(codes.map((c, i) => [c, shares[i]]));
}

/** A warehouse's Min / Reorder Pt / Max: the saved ones, else sample levels sized to its stock (steps of 5). */
export function levelsIn(item: Item, code: string): WarehouseLevels {
  const saved = item.warehouseLevels?.[code];
  if (saved) return saved;
  const h = hashOf(`${item.id}:${code}:levels`);
  // About a third of the warehouses start below their reorder point, so both Status pills show
  const left = availableIn(item, code);
  const reorderPoint = Math.max(5, h % 3 === 0 ? Math.ceil((left * 1.25 + 1) / 5) * 5 : roundTo(left * (0.3 + (h % 40) / 100), 5));
  return { min: Math.max(5, roundTo(reorderPoint / 2, 5)), reorderPoint, max: roundTo(reorderPoint * 3, 5) };
}

/** Figma's Status pill: below the reorder point (or nothing available), else in stock. */
export type OrderingStatus = 'In stock' | 'Below reorder pt';
export function orderingStatus(item: Item, code: string): OrderingStatus {
  const left = availableIn(item, code);
  const { reorderPoint } = levelsIn(item, code);
  return left === 0 || (reorderPoint != null && left < reorderPoint) ? 'Below reorder pt' : 'In stock';
}
