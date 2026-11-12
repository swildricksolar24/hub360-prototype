import { useSyncExternalStore } from 'react';
import {
  CATALOG_ITEMS,
  PHX_EXTRA_CONTACTS,
  SAMPLE_CARRIERS,
  SAMPLE_CONTACTS,
  SAMPLE_HISTORY,
  SAMPLE_LABELS,
  SAMPLE_LOCATIONS,
  SAMPLE_PICK_PACK,
  SAMPLE_STOCK,
  sampleItemsFor,
  type Carrier,
  type CatalogItem,
  type Contact,
  type HistoryEntry,
  type PickLabel,
  type PickPackSettings,
  type StockRow,
  type WarehouseItem,
  type WarehouseLocation,
} from './warehouseRecordData';
import { SAMPLE_WAREHOUSES, type Warehouse } from './warehouseData';
import {
  SAMPLE_AGENTS,
  SAMPLE_DEFAULTS,
  SAMPLE_JOBS,
  SAMPLE_PRINTERS,
  SAMPLE_PRINT_SETTINGS,
  type PrintAgent,
  type PrintDefault,
  type PrintJob,
  type PrintSettings,
  type Printer,
} from './printerData';

/**
 * In-memory stores shared by the Warehouses list and the warehouse record pages (see WAREHOUSE_RECORD.md), so both
 * edit the same data. Like the rest of the prototype, a reload resets them.
 */
function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  return {
    get: () => value,
    set(next: T | ((current: T) => T)) {
      value = typeof next === 'function' ? (next as (current: T) => T)(value) : next;
      listeners.forEach(l => l());
    },
    use: () => useSyncExternalStore(subscribe, () => value),
  };
}

const warehouses = createStore<Warehouse[]>(SAMPLE_WAREHOUSES);

export const useWarehouses = warehouses.use;
export const setWarehouses = warehouses.set;
export const findWarehouse = (code: string) => warehouses.get().find(w => w.code === code);

/** A warehouse's record page (WarehouseRecordPage), optionally on one of its tabs. */
export const recordPath = (w: Warehouse, tab?: string) =>
  `/app/inventory/warehouses/${encodeURIComponent(w.code)}${tab && tab !== 'details' ? `?tab=${tab}` : ''}`;

/** A location's Location Details page (LocationDetailsPage). */
export const locationPath = (code: string, locationId: string) =>
  `/app/inventory/warehouses/${encodeURIComponent(code)}/locations/${encodeURIComponent(locationId)}`;

/**
 * Per-warehouse values, keyed by warehouse code. A warehouse without its own value starts from the sample: either
 * the same one for every warehouse, or one made per code (cached, so it stays the same object between renders).
 */
function createRecordStore<T>(sample: T | ((code: string) => T)) {
  const store = createStore<Record<string, T>>({});
  const seeds = new Map<string, T>();
  const seed = (code: string): T => {
    if (typeof sample !== 'function') return sample;
    if (!seeds.has(code)) seeds.set(code, (sample as (code: string) => T)(code));
    return seeds.get(code)!;
  };
  return {
    get: (code: string) => store.get()[code] ?? seed(code),
    use: (code: string) => store.use()[code] ?? seed(code),
    set: (code: string, next: (current: T) => T) => store.set(all => ({ ...all, [code]: next(all[code] ?? seed(code)) })),
  };
}

const carriers = createRecordStore<Carrier[]>(SAMPLE_CARRIERS);

export const useCarriers = carriers.use;
export const setCarriers = carriers.set;
/** A warehouse's carrier accounts, read once (the Activate / Deactivate confirmations). */
export const getCarriers = carriers.get;

// Phoenix WH has enough people for a second page; the other warehouses start with Figma's four
const contacts = createRecordStore<Contact[]>(code => (code === 'PHX-124' ? [...SAMPLE_CONTACTS, ...PHX_EXTRA_CONTACTS] : SAMPLE_CONTACTS));

export const useContacts = contacts.use;
export const setContacts = contacts.set;

/* ---------- Pick / Pack ---------- */

const pickPack = createRecordStore<PickPackSettings>(SAMPLE_PICK_PACK);

export const usePickPack = pickPack.use;
export const setPickPack = pickPack.set;

const labels = createRecordStore<PickLabel[]>(SAMPLE_LABELS);

export const useLabels = labels.use;
export const setLabels = labels.set;

/* ---------- Printers ---------- */

// Phoenix WH starts with Figma's printers; every other warehouse starts at the empty first-setup screen
const SET_UP = 'PHX-124';
const printers = createRecordStore<Printer[]>(code => (code === SET_UP ? SAMPLE_PRINTERS : []));

export const usePrinters = printers.use;
export const setPrinters = printers.set;

const printDefaults = createRecordStore<PrintDefault[]>(code => (code === SET_UP ? SAMPLE_DEFAULTS : []));

export const usePrintDefaults = printDefaults.use;
export const setPrintDefaults = printDefaults.set;

const printJobs = createRecordStore<PrintJob[]>(code => (code === SET_UP ? SAMPLE_JOBS : []));

export const usePrintJobs = printJobs.use;
export const setPrintJobs = printJobs.set;

const printSettings = createRecordStore<PrintSettings>(SAMPLE_PRINT_SETTINGS);

export const usePrintSettings = printSettings.use;
export const setPrintSettings = printSettings.set;

/** Every print agent in the company (Printers › Settings lists them all, with their warehouse). */
const agents = createStore<PrintAgent[]>(SAMPLE_AGENTS);

export const useAgents = agents.use;
export const setAgents = agents.set;

/* ---------- Locations, items, stock, history ---------- */

const locations = createRecordStore<WarehouseLocation[]>(SAMPLE_LOCATIONS);

export const useLocations = locations.use;
export const setLocations = locations.set;
/** A warehouse's locations, read once (the Activate confirmation counts the frozen ones). */
export const getLocations = locations.get;

const items = createRecordStore<WarehouseItem[]>(sampleItemsFor);

export const useWarehouseItems = items.use;
export const setWarehouseItems = items.set;
/** Another warehouse's items, read once (Clone Warehouse). */
export const getWarehouseItems = items.get;

const stock = createRecordStore<StockRow[]>(SAMPLE_STOCK);

export const useStock = stock.use;
export const setStock = stock.set;

const history = createRecordStore<HistoryEntry[]>(SAMPLE_HISTORY);

export const useHistory = history.use;

/**
 * Each warehouse's activations and deactivations, newest last: who, when (local ISO date and time) and the optional
 * note. The Activate confirmation shows the last deactivation ("Deactivated Oct 12, 2026 by L. Needa · “Seasonal
 * closure”").
 */
export type StatusEvent = { active: boolean; by: string; date: string; note?: string };

const statusLog = createRecordStore<StatusEvent[]>([]);

export const getStatusLog = statusLog.get;
export const addStatusEvent = (code: string, event: StatusEvent) => statusLog.set(code, list => [...list, event]);

/** Every item in the company, plus the ones created from a warehouse's Add Part / Assembly / Kit. */
const catalog = createStore<CatalogItem[]>(CATALOG_ITEMS);

export const useCatalog = catalog.use;
export const addCatalogItem = (item: CatalogItem) => catalog.set(list => [...list, item]);
