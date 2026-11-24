import { useSyncExternalStore } from 'react';
import { SAMPLE_ITEMS, type Item, type ItemType } from './itemData';
import { getOrders, setOrders } from '../orders/orderStore';
import type { Order } from '../orders/orderData';

/**
 * The open (In Process) orders with a line for one of these items. Order lines name items by number: an Adjustment line
 * by `itemNo`. (Move lines point at the orders' own stock records, so a merge leaves them alone.)
 */
export const openOrdersUsing = (ids: string[], list: Order[]) =>
  list.filter(o => o.status === 'In Process' && o.adjustLines.some(l => ids.includes(l.itemNo)));

/**
 * The in-memory items store shared by the Items list and the Part / Assembly / Kit record pages (see ITEMS.md), so
 * both edit the same data. Like the rest of the prototype, a reload resets it.
 */
let items: Item[] = SAMPLE_ITEMS;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useItems = () => useSyncExternalStore(subscribe, () => items);
export const getItems = () => items;
export function setItems(next: Item[] | ((current: Item[]) => Item[])) {
  items = typeof next === 'function' ? next(items) : next;
  listeners.forEach(l => l());
}

/** One item by its system # (the route id). */
export const findItem = (id: string) => items.find(i => i.id === id);

/**
 * The Items record for a warehouse's item (warehouse record › History, Stock, Items; Location Details), if there is one.
 * The warehouse sample data and the Items sample data number their items differently, so they're matched by name; an
 * item with no record in Items has none (its links show as text).
 */
export const itemRecordFor = (name: string | undefined, list: Item[] = items) =>
  name ? list.find(i => i.name.trim().toLowerCase() === name.trim().toLowerCase()) : undefined;

/** Changes one item. */
export const updateItem = (id: string, change: (item: Item) => Item) => setItems(list => list.map(i => (i.id === id ? change(i) : i)));

export const LIST_PATH = '/app/inventory/items';

/** An item's record page (ItemRecordPage), optionally on one of its tabs. */
export const itemPath = (id: string, tab?: string) =>
  `${LIST_PATH}/${encodeURIComponent(id)}${tab && tab !== 'details' ? `?tab=${tab}` : ''}`;

/** "Part #", "Assembly #" or "Kit #". */
export const numberLabel = (type: ItemType) => `${type} #`;

/** Unit cost: a part's own cost, or the sum of an assembly's or kit's build (Net Cost = Quantity × Unit Cost). */
export function unitCostOf(item: Item, list: Item[] = items, seen = new Set<string>()): number {
  if (!item.build.length) return item.unitCost;
  if (seen.has(item.id)) return 0;
  seen.add(item.id);
  return item.build.reduce((sum, line) => {
    const child = list.find(i => i.id === line.itemId);
    return sum + (child ? unitCostOf(child, list, new Set(seen)) * line.quantity : 0);
  }, 0);
}

/** The assemblies and kits whose build uses an item. */
export const usedIn = (id: string, list: Item[] = items) => list.filter(i => i.build.some(b => b.itemId === id));

/**
 * Merging Items: every source item's stock, suppliers, notes, files, history and its place in other builds move to
 * the target; the sources are deactivated (ITEMS.md §1).
 */
export function mergeItems(sourceIds: string[], targetId: string) {
  const fromIds = sourceIds.filter(id => id !== targetId);
  // Open orders that use a merged item now use the kept one
  setOrders(list =>
    list.map(o =>
      openOrdersUsing(fromIds, [o]).length ? { ...o, adjustLines: o.adjustLines.map(l => (fromIds.includes(l.itemNo) ? { ...l, itemNo: targetId } : l)) } : o,
    ),
  );
  setItems(list => {
    const sources = list.filter(i => sourceIds.includes(i.id) && i.id !== targetId);
    return list.map(item => {
      if (item.id === targetId) {
        const stock = [...item.stock];
        for (const src of sources) {
          for (const row of src.stock) {
            const same = stock.findIndex(s => s.warehouse === row.warehouse && s.location === row.location);
            if (same >= 0) {
              const s = stock[same];
              stock[same] = { ...s, onHand: s.onHand + row.onHand, allocated: s.allocated + row.allocated, committed: s.committed + row.committed, frozen: s.frozen + row.frozen };
            } else stock.push({ ...row, id: `${row.id}-m` });
          }
        }
        return {
          ...item,
          // The merged items' numbers (and any they already carried) find this item from now on
          aliases: [...new Set([...(item.aliases ?? []), ...sources.flatMap(s => [s.id, ...(s.aliases ?? [])])])],
          stock,
          suppliers: [...item.suppliers, ...sources.flatMap(s => s.suppliers.map(x => ({ ...x, primary: false })))],
          notes: [...item.notes, ...sources.flatMap(s => s.notes)],
          files: [...item.files, ...sources.flatMap(s => s.files)],
          history: [...item.history, ...sources.flatMap(s => s.history)],
        };
      }
      if (sources.some(s => s.id === item.id)) return { ...item, active: false, stock: [] };
      return { ...item, build: replaceInBuild(item.build, sourceIds, targetId) };
    });
  });
}

function replaceInBuild(build: Item['build'], fromIds: string[], toId: string) {
  if (!build.some(b => fromIds.includes(b.itemId))) return build;
  const next: Item['build'] = [];
  for (const line of build) {
    const id = fromIds.includes(line.itemId) ? toId : line.itemId;
    const same = next.find(l => l.itemId === id);
    if (same) same.quantity += line.quantity;
    else next.push({ ...line, itemId: id });
  }
  return next;
}

/**
 * Deleting Items: removes the items, and takes them out of every build that uses them. Where an item has an active
 * replacement, the replacement is substituted (ITEMS.md §1).
 */
export function deleteItems(ids: string[]) {
  setItems(list => {
    const substitute = (id: string) => {
      const item = list.find(i => i.id === id);
      return item?.replacements.find(r => !ids.includes(r) && list.find(i => i.id === r)?.active);
    };
    return list
      .filter(i => !ids.includes(i.id))
      .map(item => {
        if (!item.build.some(b => ids.includes(b.itemId))) return { ...item, replacements: item.replacements.filter(r => !ids.includes(r)) };
        let build = item.build;
        for (const id of ids) {
          const sub = substitute(id);
          build = sub ? replaceInBuild(build, [id], sub) : build.filter(b => b.itemId !== id);
        }
        return { ...item, build, replacements: item.replacements.filter(r => !ids.includes(r)) };
      });
  });
}

/**
 * What an item has been used for (Figma "Delete Items (Improved)" 681:14500): its past and open orders (its History's
 * orders, plus open orders in the Orders store), the units on hand and the builds that include it. An item with no
 * history, no stock records, no builds and no open orders was never used, so it can be deleted; any other item is
 * deactivated instead, so its history is kept.
 */
export type ItemUsage = { neverUsed: boolean; pastOrders: number; openOrders: number; onHand: number; builds: Item[] };
export function itemUsage(item: Item, list: Item[] = items, orderList: Order[] = getOrders()): ItemUsage {
  const ordersIn = (open: boolean) => new Set(item.history.filter(h => h.order && (h.order.status !== 'Complete') === open).map(h => h.order!.number)).size;
  const openOrders = ordersIn(true) + openOrdersUsing([item.id], orderList).length;
  const builds = usedIn(item.id, list);
  const onHand = item.stock.reduce((t, s) => t + s.onHand, 0);
  return {
    neverUsed: item.history.length === 0 && item.stock.length === 0 && builds.length === 0 && openOrders === 0,
    pastOrders: ordersIn(false),
    openOrders,
    onHand,
    builds,
  };
}

/**
 * Delete Items (Improved): deletes the never-used items and deactivates the rest. With a replacement, the deactivated
 * items are swapped for it in the builds that include them and in open orders' Adjustment lines. Returns what happened.
 */
export function deleteOrDeactivate(ids: string[], replacementId?: string): { deleted: Item[]; deactivated: Item[] } {
  const chosen = items.filter(i => ids.includes(i.id));
  const deleted = chosen.filter(i => itemUsage(i).neverUsed);
  const deactivated = chosen.filter(i => !deleted.includes(i));
  const off = deactivated.map(i => i.id);
  if (deleted.length) deleteItems(deleted.map(i => i.id));
  if (off.length) {
    setItems(list =>
      list.map(item => {
        if (off.includes(item.id)) return { ...item, active: false };
        if (replacementId && item.build.some(b => off.includes(b.itemId))) return { ...item, build: replaceInBuild(item.build, off, replacementId) };
        return item;
      }),
    );
    if (replacementId)
      setOrders(list =>
        list.map(o =>
          openOrdersUsing(off, [o]).length ? { ...o, adjustLines: o.adjustLines.map(l => (off.includes(l.itemNo) ? { ...l, itemNo: replacementId } : l)) } : o,
        ),
      );
  }
  return { deleted, deactivated };
}

/** Deactivating an item that builds use (Deactivating Part - Active Assemblies or Kits Error). */
export function deactivateItem(id: string, how: 'replace' | 'deactivate' | 'remove' | 'none', replacementId?: string) {
  setItems(list => {
    const users = usedIn(id, list).map(i => i.id);
    return list.map(item => {
      if (item.id === id) return { ...item, active: false };
      if (!users.includes(item.id)) return item;
      if (how === 'replace' && replacementId) return { ...item, build: replaceInBuild(item.build, [id], replacementId) };
      if (how === 'deactivate') return { ...item, active: false };
      if (how === 'remove') return { ...item, build: item.build.filter(b => b.itemId !== id) };
      return item;
    });
  });
}

/** Whether an item's build uses another item, directly or inside one of its assemblies. */
export function buildContains(item: Item, id: string, list: Item[] = items, seen = new Set<string>()): boolean {
  if (seen.has(item.id)) return false;
  seen.add(item.id);
  return item.build.some(line => {
    if (line.itemId === id) return true;
    const child = list.find(i => i.id === line.itemId);
    return !!child && buildContains(child, id, list, seen);
  });
}

/**
 * What a build can add (ITEMS.md "How the pieces relate"): active parts and assemblies that aren't on it yet. An
 * assembly or kit can't include itself, or an assembly that already uses it.
 */
export const buildCandidates = (targetId: string | null, lines: Item['build'], list: Item[] = items) =>
  list.filter(
    i =>
      i.active &&
      (i.type === 'Part' || i.type === 'Assembly') &&
      i.id !== targetId &&
      !lines.some(l => l.itemId === i.id) &&
      !(targetId && buildContains(i, targetId, list)),
  );
