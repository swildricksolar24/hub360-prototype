import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextInput } from '../../../../components/TextInput/TextInput';
import { Toggle } from '../../../../components/Toggle/Toggle';
import { AppModal } from '../../../components/AppModal';
import { formatDate } from './orders/orderData';
import { useOrders } from './orders/orderStore';
import type { Warehouse } from './warehouseData';
import { addStatusEvent, getCarriers, getLocations, getStatusLog, recordPath, setLocations, setWarehouses } from './warehouseStore';
import styles from './warehouseStatus.module.css';

/** The choices on the Activate confirmation (Figma "Activation" options). */
export type ActivateOptions = { notifyContacts: boolean; unfreezeLocations: boolean; suggestedOrders: boolean };

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const count = (n: number) => n.toLocaleString('en-US');
const plural = (n: number, one: string, many = `${one}s`) => `${count(n)} ${n === 1 ? one : many}`;
const sum = (list: Warehouse[], value: (w: Warehouse) => number) => list.reduce((total, w) => total + value(w), 0);

/**
 * Applies a confirmed Activate / Deactivate: flips the status, logs who did it, when and the note, and unfreezes the
 * locations when asked. Returns the confirmation for the page's toast ("Phoenix WH activated. Contacts notified.").
 */
export function applyWarehouseStatus(changed: Warehouse[], active: boolean, note: string, options: ActivateOptions, by: string) {
  const codes = new Set(changed.map(w => w.code));
  setWarehouses(list => list.map(w => (codes.has(w.code) ? { ...w, active } : w)));
  const now = new Date();
  const date = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
  for (const w of changed) {
    addStatusEvent(w.code, { active, by, date, note: note || undefined });
    if (active && options.unfreezeLocations) setLocations(w.code, list => list.map(l => (l.frozen ? { ...l, frozen: false } : l)));
  }
  const what = changed.length === 1 ? changed[0].name : `${changed.length} warehouses`;
  return `${what} ${active ? 'activated' : 'deactivated'}.${active && options.notifyContacts ? ' Contacts notified.' : ''}`;
}

/**
 * The confirmations behind a Warehouses row's Activate / Deactivate (and the toolbar Actions for checked rows), from
 * the Figma "Activation" (843:60109) and "Deactivate Warehouse — Improved" (843:60078) frames in Inventory Management.
 * - Deactivate names the warehouse, lists what it still holds (stock, open orders by type) with a link to those
 *   orders, takes an optional note, and confirms with a red Deactivate. Deactivating is always allowed.
 * - Activate lists what comes back (stock, frozen locations, carrier accounts) and when and why it was deactivated,
 *   offers to notify contacts, unfreeze locations and use it in Suggested Orders, takes a note, then Activate.
 * With several warehouses the same dialog speaks of "3 warehouses" and totals what they hold.
 */
export function WarehouseStatusModal({
  open,
  warehouses,
  active,
  onRecord = false,
  onClose,
  onConfirm,
}: {
  /** Opened from the warehouse's own record page: hides "View Warehouse Details". */
  onRecord?: boolean;
  open: boolean;
  /** The warehouses being changed (one from a row, or the checked rows). */
  warehouses: Warehouse[];
  /** true = Activate, false = Deactivate. */
  active: boolean;
  onClose: () => void;
  onConfirm: (note: string, options: ActivateOptions) => void;
}) {
  const navigate = useNavigate();
  const orders = useOrders();
  const [note, setNote] = useState('');
  const [options, setOptions] = useState<ActivateOptions>({ notifyContacts: true, unfreezeLocations: false, suggestedOrders: true });

  useEffect(() => {
    if (!open) return;
    setNote('');
    setOptions({ notifyContacts: true, unfreezeLocations: false, suggestedOrders: true });
  }, [open, active]);

  const one = warehouses.length === 1 ? warehouses[0] : null;
  const subject = one ? `${one.name} (${one.code})` : plural(warehouses.length, 'warehouse');
  const codes = new Set(warehouses.map(w => w.code));
  const value = sum(warehouses, w => w.value);

  // Open orders: those still In Process, counted by type ("3 Transfers, 6 Sales")
  const openOrders = orders.filter(o => codes.has(o.warehouse) && o.status === 'In Process');
  const byType = [...new Set(openOrders.map(o => o.type))].map(type => plural(openOrders.filter(o => o.type === type).length, type));

  // Activation: frozen locations and carrier accounts, and the last time each was deactivated
  const frozen = sum(warehouses, w => getLocations(w.code).filter(l => l.frozen).length);
  const carriers = warehouses.flatMap(w => getCarriers(w.code));
  const inactiveCarriers = carriers.filter(c => !c.active).length;
  const lastOff = one ? [...getStatusLog(one.code)].reverse().find(e => !e.active) : undefined;

  const close = (then?: () => void) => {
    onClose();
    then?.();
  };

  if (!active) {
    const holds = value > 0 || openOrders.length > 0;
    return (
      <AppModal
        open={open}
        onClose={onClose}
        title={`Deactivate ${subject}?`}
        description={
          one
            ? 'Deactivated warehouses can’t receive new orders or stock. You can reactivate it at any time.'
            : 'Deactivated warehouses can’t receive new orders or stock. You can reactivate them at any time.'
        }
        startAction={
          one && openOrders.length > 0
            ? { label: 'View Open Orders', icon: 'orders', onClick: () => close(() => navigate(`/app/inventory/orders?q=${encodeURIComponent(one.code)}`)) }
            : undefined
        }
        primaryAction={{ label: 'Deactivate', danger: true, onClick: () => onConfirm(note.trim(), options) }}
      >
        <div className={styles.body}>
          {holds && (
            <div className={styles.impact} data-tone="warning">
              <p className="text-medium-bold">{one ? 'This warehouse still has:' : 'These warehouses still have:'}</p>
              {value > 0 && (
                <p className="text-medium-regular">
                  • {money(value)} of stock across {plural(sum(warehouses, w => w.filled), 'filled location')}
                </p>
              )}
              {openOrders.length > 0 && (
                <p className="text-medium-regular">
                  • {plural(openOrders.length, 'open order')} ({byType.join(', ')})
                </p>
              )}
              <p className={`text-tiny-regular ${styles.footnote}`}>
                Move the stock and finish or reassign open orders before deactivating, or deactivate anyway and handle them later.
              </p>
            </div>
          )}
          <TextInput
            label="Note (optional)"
            placeholder={one ? 'Why is this warehouse being deactivated?' : 'Why are these warehouses being deactivated?'}
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>
      </AppModal>
    );
  }

  const footnote = [
    lastOff && `Deactivated ${formatDate(lastOff.date.slice(0, 10))} by ${lastOff.by}${lastOff.note ? ` · “${lastOff.note}”` : ''}.`,
    inactiveCarriers > 0 && `Review carrier accounts before shipping: ${count(inactiveCarriers)} of ${count(carriers.length)} ${inactiveCarriers === 1 ? 'is' : 'are'} inactive.`,
  ]
    .filter(Boolean)
    .join(' ');
  const set = (key: keyof ActivateOptions) => (on: boolean) => setOptions(o => ({ ...o, [key]: on }));

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={`Activate ${subject}?`}
      description={`Active warehouses can receive orders and stock again. Locations, contacts and carrier accounts come back as they were.`}
      startAction={one && !onRecord ? { label: 'View Warehouse Details', icon: 'warehouse', onClick: () => close(() => navigate(recordPath(one))) } : undefined}
      primaryAction={{ label: 'Activate', onClick: () => onConfirm(note.trim(), options) }}
    >
      <div className={styles.body}>
        <div className={styles.impact} data-tone="brand">
          <p className="text-medium-bold">When {one ? 'it’s' : 'they’re'} active again:</p>
          {value > 0 && (
            <p className="text-medium-regular">
              • {money(value)} of stock across {plural(sum(warehouses, w => w.locations), 'location')} becomes available to orders
            </p>
          )}
          {frozen > 0 && (
            <p className="text-medium-regular">
              • {plural(frozen, 'frozen location')}{' '}
              {options.unfreezeLocations
                ? `${frozen === 1 ? 'is' : 'are'} unfrozen now`
                : frozen === 1
                  ? 'stays frozen until you unfreeze it'
                  : 'stay frozen until you unfreeze them'}
            </p>
          )}
          {carriers.length > 0 && (
            <p className="text-medium-regular">
              • {plural(carriers.length, 'carrier account')} {carriers.length === 1 ? 'returns' : 'return'}
              {inactiveCarriers > 0 && ` (${count(inactiveCarriers)} ${inactiveCarriers === 1 ? 'is' : 'are'} inactive and won’t be offered)`}
            </p>
          )}
          {footnote && <p className={`text-tiny-regular ${styles.footnote}`}>{footnote}</p>}
        </div>
        <div className={styles.options}>
          <Toggle
            label={`Notify warehouse contacts that ${one ? 'it’s' : 'they’re'} active`}
            checked={options.notifyContacts}
            onChange={e => set('notifyContacts')(e.target.checked)}
          />
          <Toggle label="Unfreeze all locations now" checked={options.unfreezeLocations} onChange={e => set('unfreezeLocations')(e.target.checked)} />
          <Toggle
            label={`Make ${one ? 'it' : 'them'} available in Suggested Orders and transfers right away`}
            checked={options.suggestedOrders}
            onChange={e => set('suggestedOrders')(e.target.checked)}
          />
        </div>
        <TextInput
          label="Note (optional)"
          placeholder={one ? 'Why is this warehouse being activated?' : 'Why are these warehouses being activated?'}
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </div>
    </AppModal>
  );
}
