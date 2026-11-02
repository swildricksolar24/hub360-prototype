import { useSyncExternalStore } from 'react';
import { ORDER_PREFIX, SAMPLE_ORDERS, todayIso, type Order, type OrderType } from './orderData';

/**
 * In-memory store shared by the Orders list and the order record pages, so both edit the same orders. Like the rest
 * of the prototype, a reload resets it.
 */
let orders: Order[] = SAMPLE_ORDERS;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useOrders = () => useSyncExternalStore(subscribe, () => orders);

export function setOrders(next: Order[] | ((current: Order[]) => Order[])) {
  orders = typeof next === 'function' ? next(orders) : next;
  listeners.forEach(l => l());
}

/** An order by its URL id (e.g. "MO-12456"); `number` is the label to show, e.g. "MO # 12456". */
export const findOrder = (id: string) => orders.find(o => o.id === id);

export function updateOrder(id: string, patch: Partial<Order>) {
  setOrders(list => list.map(o => (o.id === id ? { ...o, ...patch } : o)));
}

/** An order's record page (OrderRecordPage). */
export const orderPath = (o: Pick<Order, 'id'>) => `/app/inventory/orders/${encodeURIComponent(o.id)}`;

/** Starts a new, empty In Process order with the type's next order #, and adds it to the top of the list. */
export function createOrder(type: OrderType, warehouse: string, due?: string): Order {
  const prefix = ORDER_PREFIX[type];
  const used = orders.filter(o => o.type === type).map(o => Number(o.id.slice(prefix.length + 1)));
  const num = Math.max(10000, ...used) + 1;
  const order: Order = {
    id: `${prefix}-${num}`,
    number: `${prefix} # ${num}`,
    type,
    warehouse,
    status: 'In Process',
    created: todayIso(),
    due: due || undefined,
    moveLines: [],
    adjustLines: [],
  };
  setOrders(list => [order, ...list]);
  return order;
}
