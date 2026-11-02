import { MAX_LOCATION_DEPTH, type WarehouseLocation } from '../warehouseRecordData';

/*
 * The location tree (Locations › Structure). Locations are a flat list with a parentId; siblings keep the list's
 * order, so reordering moves items within the array and indenting / outdenting changes parentId.
 */

export type TreeRow = { location: WarehouseLocation; depth: number };

export const childrenOf = (list: WarehouseLocation[], id: string | null) => list.filter(l => l.parentId === id);

/** The rows in display order (depth-first), from `rootId`'s children down. Depth 1 is the top level. */
export function flattenTree(list: WarehouseLocation[], rootId: string | null = null): TreeRow[] {
  const out: TreeRow[] = [];
  const walk = (parent: string | null, depth: number) => {
    for (const l of childrenOf(list, parent)) {
      out.push({ location: l, depth });
      walk(l.id, depth + 1);
    }
  };
  walk(rootId, rootId ? depthOf(list, rootId) + 1 : 1);
  return out;
}

export function depthOf(list: WarehouseLocation[], id: string): number {
  let depth = 0;
  let current = list.find(l => l.id === id);
  while (current) {
    depth += 1;
    current = current.parentId ? list.find(l => l.id === current!.parentId) : undefined;
  }
  return depth;
}

/** Levels from this location down to its deepest sublocation (1 for a location without sublocations). */
export function heightOf(list: WarehouseLocation[], id: string): number {
  return 1 + Math.max(0, ...childrenOf(list, id).map(c => heightOf(list, c.id)));
}

/** Every sublocation below `id`, at any depth. */
export function descendantIds(list: WarehouseLocation[], id: string): string[] {
  return childrenOf(list, id).flatMap(c => [c.id, ...descendantIds(list, c.id)]);
}

/** "Area A › Shelf 1 › Bin 1" */
export function pathOf(list: WarehouseLocation[], id: string): string {
  const names: string[] = [];
  let current = list.find(l => l.id === id);
  while (current) {
    names.unshift(current.name);
    current = current.parentId ? list.find(l => l.id === current!.parentId) : undefined;
  }
  return names.join(' › ');
}

const siblingsOf = (list: WarehouseLocation[], id: string) => {
  const parentId = list.find(l => l.id === id)?.parentId ?? null;
  return childrenOf(list, parentId);
};
const previousSibling = (list: WarehouseLocation[], id: string) => {
  const sibs = siblingsOf(list, id);
  return sibs[sibs.findIndex(s => s.id === id) - 1];
};

/** Indent: the location becomes the last sublocation of the one above it, if the tree stays within 4 levels. */
export function canIndent(list: WarehouseLocation[], id: string) {
  const prev = previousSibling(list, id);
  return !!prev && depthOf(list, prev.id) + heightOf(list, id) <= MAX_LOCATION_DEPTH;
}
export function indent(list: WarehouseLocation[], id: string): WarehouseLocation[] {
  const prev = previousSibling(list, id);
  if (!prev || !canIndent(list, id)) return list;
  const moved = { ...list.find(l => l.id === id)!, parentId: prev.id };
  return [...list.filter(l => l.id !== id), moved];
}

/** Outdent: the location moves up a level, right after its old parent. */
export function outdent(list: WarehouseLocation[], id: string): WarehouseLocation[] {
  const item = list.find(l => l.id === id);
  const parent = item?.parentId ? list.find(l => l.id === item.parentId) : undefined;
  if (!item || !parent) return list;
  const rest = list.filter(l => l.id !== id);
  const at = rest.findIndex(l => l.id === parent.id) + 1;
  return [...rest.slice(0, at), { ...item, parentId: parent.parentId }, ...rest.slice(at)];
}

/** Moves a location to `index` among its siblings (drag and drop, or the handle's ↑ / ↓). */
export function moveAmongSiblings(list: WarehouseLocation[], id: string, index: number): WarehouseLocation[] {
  const item = list.find(l => l.id === id);
  if (!item) return list;
  const rest = list.filter(l => l.id !== id);
  const sibs = childrenOf(rest, item.parentId);
  const clamped = Math.max(0, Math.min(index, sibs.length));
  // Before the sibling now at that place, or after the last one
  const at = clamped < sibs.length ? rest.indexOf(sibs[clamped]!) : rest.indexOf(sibs[sibs.length - 1]!) + 1;
  if (sibs.length === 0) return list;
  const next = [...rest.slice(0, at), item, ...rest.slice(at)];
  return next.every((l, i) => l === list[i]) ? list : next;
}
export const siblingIndex = (list: WarehouseLocation[], id: string) => siblingsOf(list, id).findIndex(s => s.id === id);
export const siblingCount = (list: WarehouseLocation[], id: string) => siblingsOf(list, id).length;

/** The ⓘ text for the three status options (Add Location, Location Details). */
export const STATUS_INFO = {
  frozen: 'Stock here is on hold: it can’t be picked, moved or allocated until the location is unfrozen.',
  nonPickable: 'Stock here counts as on hand but is never chosen for picking, e.g. overflow or quarantine.',
  empty: 'Nothing is stored here right now, so the location is open for put-away.',
};
