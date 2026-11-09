/*
 * Warehouse record › Printers (Figma "Printers" page, 886:64893): the printers, print agents, document defaults and
 * print jobs, with the sample data from the Figma frames. Phoenix WH (PHX-124) starts set up; every other warehouse
 * starts at the empty "first setup" screen.
 */

export type PrinterType = 'Thermal label' | 'Laser' | 'Inkjet';
export const PRINTER_TYPES: PrinterType[] = ['Thermal label', 'Laser', 'Inkjet'];

export type Printer = {
  id: string;
  /** The printer's own name, e.g. "CJ3000". The list and menus show it with its area: "CJ3000 · Shipping Office". */
  name: string;
  area: string;
  type: PrinterType;
  model: string;
  serial: string;
  connection: 'network' | 'usb';
  ip?: string;
  port?: number;
  /** The print agent it prints through (PrintAgent.id). */
  agentId: string;
  /** e.g. ["4 × 6 in", "4 × 8 in"]; empty for paper printers. */
  labelSizes: string[];
  media: string;
  resolution: string;
  speed: string;
  darkness: string;
  topOffset: string;
  leftOffset: string;
  /** Shows in the warehouse's printer lists. */
  active: boolean;
  online: boolean;
  paused: boolean;
  labelsPrinted: number;
  rollPrinted: number;
  lastCalibrated: string;
  firmware: string;
  lastChecked: string;
  /** If this printer is offline: send its jobs to another printer (id), or hold them; and whom to notify. */
  offlineSendTo: string | null;
  offlineNotify: string;
  offlineHold: boolean;
  /** Roles that get it in their print menus. */
  roles: string[];
};

export type PrintAgent = {
  id: string;
  computer: string;
  /** Warehouse code. */
  warehouse: string;
  version: string;
  lastSeen: string;
  status: 'online' | 'offline' | 'update';
};

/** One row of Default Use: which printer prints a document by default, and when. */
export type PrintDefault = {
  id: string;
  document: string;
  printerId: string;
  size: string;
  copies: string;
  trigger: string;
};

export type PrintJobStatus = 'Printed' | 'Failed' | 'Held' | 'Queued' | 'Cancelled';
export type PrintJob = {
  id: string;
  printerId: string;
  time: string;
  document: string;
  record: string;
  sentBy: string;
  copies: number;
  size: string;
  status: PrintJobStatus;
  /** Failed jobs: why. */
  error?: string;
};

/** Warehouse-wide printing settings (Printers › Settings › Printing Defaults). */
export type PrintSettings = {
  labelLanguage: string;
  retry: string;
  history: string;
  notify: string;
  fallback: boolean;
};

/** A printer the agent found on the network or over USB (Add Printer step 2). */
export type FoundPrinter = { id: string; name: string; model: string; ip: string; type: PrinterType };

/* ---------- Options ---------- */

export const AREAS = ['Back Office', 'Warehouse Office', 'Shipping Office', 'Front Office', 'Receiving Dock', 'Packing Station'];
export const LABEL_SIZE_CHOICES = ['2 × 1 in', '3 × 2 in', '4 × 6 in', '4 × 8 in'];
export const MEDIA = ['Direct thermal', 'Thermal transfer', 'Plain paper'];
export const RESOLUTIONS = ['203 dpi', '300 dpi', '600 dpi'];
export const SPEEDS = ['2 in/s', '4 in/s', '6 in/s', '8 in/s'];
export const DARKNESS = ['10', '12', '15', '18 (default 15)', '20', 'Default (15)'];
export const DOCUMENT_SIZES = ['2 × 1', '3 × 2', '4 × 6', '4 × 8', 'Letter'];
export const TRIGGERS = ['Sale is shipped', 'Packing is finished', 'Order is approved', 'Purchase is received', 'Only when printed by hand'];
export const NOTIFY = ['Warehouse manager', 'Warehouse manager · K. Ito', 'Shipping lead', 'Nobody'];
export const PRINT_ROLES = ['Shipping', 'Warehouse Staff', 'Receiving', 'Warehouse Manager'];
export const LABEL_LANGUAGES = ['ZPL (Zebra)', 'EPL', 'PDF'];
export const RETRIES = ['Don’t retry', '3 times, 1 minute apart', '5 times, 1 minute apart'];
export const HISTORY = ['30 days', '90 days', '1 year'];
/** Use as default for (Add Printer step 3): the documents a new printer can take over. */
export const DEFAULT_FOR = ['Receiving labels', 'Location labels', 'Pick/Pack labels', 'Packing slips', 'Item Barcode'];

/** "CJ3000 · Shipping Office" */
export const printerLabel = (p: Pick<Printer, 'name' | 'area'>) => `${p.name} · ${p.area}`;
/** "Network · 10.0.4.30" or "USB via Print Agent" */
export const connectionText = (p: Pick<Printer, 'connection' | 'ip'>) => (p.connection === 'usb' ? 'USB via Print Agent' : `Network · ${p.ip}`);

/* ---------- Samples (Figma 886:64894, 901:24728, 901:25215, 901:26381, 911:5680) ---------- */

const base = {
  media: 'Direct thermal',
  resolution: '203 dpi',
  speed: '6 in/s',
  darkness: '18 (default 15)',
  topOffset: '0 dots',
  leftOffset: '+8 dots',
  active: true,
  online: true,
  paused: false,
  labelsPrinted: 48210,
  rollPrinted: 412,
  lastCalibrated: 'Oct 28, 2026 · K. Ito',
  firmware: 'V92.21.39Z',
  lastChecked: '2 min ago · responded in 38 ms',
  offlineNotify: 'Warehouse manager · K. Ito',
  offlineHold: false,
  roles: ['Shipping', 'Warehouse Staff', 'Warehouse Manager'],
};

export const SAMPLE_PRINTERS: Printer[] = [
  { ...base, id: 'pr1', name: 'HP02156', area: 'Back Office', type: 'Laser', model: 'HP LaserJet M404', serial: 'PHBQK21044', connection: 'network', ip: '10.0.4.21', port: 9100, agentId: 'ag1', labelSizes: [], media: 'Plain paper', resolution: '600 dpi', speed: '—', darkness: '—', firmware: '002.2216A', offlineSendTo: 'pr2' },
  { ...base, id: 'pr2', name: 'HP0034', area: 'Warehouse Office', type: 'Laser', model: 'HP LaserJet M404', serial: 'PHBQK19870', connection: 'network', ip: '10.0.4.22', port: 9100, agentId: 'ag1', labelSizes: [], media: 'Plain paper', resolution: '600 dpi', speed: '—', darkness: '—', firmware: '002.2216A', offlineSendTo: 'pr1' },
  { ...base, id: 'pr3', name: 'CJ3000', area: 'Shipping Office', type: 'Thermal label', model: 'Zebra ZT411', serial: '52J193800417', connection: 'network', ip: '10.0.4.30', port: 9100, agentId: 'ag1', labelSizes: ['4 × 6 in', '4 × 8 in'], offlineSendTo: 'pr4' },
  { ...base, id: 'pr4', name: 'CJ3000', area: 'Front Office', type: 'Thermal label', model: 'Zebra ZT411', serial: '52J193800522', connection: 'usb', agentId: 'ag1', labelSizes: ['4 × 6 in'], offlineSendTo: 'pr3' },
  { ...base, id: 'pr5', name: 'ZD421', area: 'Receiving Dock', type: 'Thermal label', model: 'Zebra ZD421', serial: 'D4J214502233', connection: 'network', ip: '10.0.4.35', port: 9100, agentId: 'ag2', labelSizes: ['2 × 1 in', '3 × 2 in'], online: false, lastChecked: '47 min ago · no response', offlineSendTo: null, offlineHold: true },
];

export const SAMPLE_AGENTS: PrintAgent[] = [
  { id: 'ag1', computer: 'SHIP-PC-01', warehouse: 'PHX-124', version: '2.4.1', lastSeen: 'Just now', status: 'online' },
  { id: 'ag2', computer: 'RCV-PC-02', warehouse: 'PHX-124', version: '2.4.1', lastSeen: 'Just now', status: 'online' },
  { id: 'ag3', computer: 'TUC-OFFICE', warehouse: 'TUC-901', version: '2.3.0', lastSeen: '2 h ago', status: 'offline' },
  { id: 'ag4', computer: 'FLG-DOCK', warehouse: 'FLG-110', version: '2.4.1', lastSeen: '5 min ago', status: 'update' },
];

export const SAMPLE_DEFAULTS: PrintDefault[] = [
  { id: 'd1', document: 'Shipping labels', printerId: 'pr3', size: '4 × 6', copies: '1', trigger: 'Sale is shipped' },
  { id: 'd2', document: 'Pick/Pack carton labels', printerId: 'pr3', size: '4 × 6', copies: '1 per carton', trigger: 'Packing is finished' },
  { id: 'd3', document: 'Packing slips', printerId: 'pr2', size: 'Letter', copies: '1', trigger: 'Packing is finished' },
  { id: 'd4', document: 'Pick tickets', printerId: 'pr1', size: 'Letter', copies: '1', trigger: 'Order is approved' },
  { id: 'd5', document: 'Receiving labels', printerId: 'pr5', size: '3 × 2', copies: '1 per unit', trigger: 'Purchase is received' },
  { id: 'd6', document: 'Location labels', printerId: 'pr5', size: '2 × 1', copies: '1', trigger: 'Only when printed by hand' },
];

export const SAMPLE_JOBS: PrintJob[] = [
  { id: 'j1', printerId: 'pr3', time: '2:16 PM', document: 'Shipping label', record: 'SO-10480', sentBy: 'K. Ito', copies: 2, size: '4 × 6', status: 'Held' },
  { id: 'j2', printerId: 'pr3', time: '2:14 PM', document: 'Packing labels', record: 'SO-10480', sentBy: 'K. Ito', copies: 3, size: '4 × 6', status: 'Failed', error: 'out of labels' },
  { id: 'j3', printerId: 'pr3', time: '1:52 PM', document: 'Carton labels', record: 'TR-10482', sentBy: 'D. Chen', copies: 4, size: '4 × 6', status: 'Printed' },
  { id: 'j4', printerId: 'pr3', time: '11:30 AM', document: 'Location labels', record: 'Aisle 02 · 12 bins', sentBy: 'A. Rivera', copies: 12, size: '2 × 1', status: 'Printed' },
  { id: 'j5', printerId: 'pr3', time: '9:05 AM', document: 'Test page', record: '—', sentBy: 'L. Nguyen', copies: 1, size: '4 × 6', status: 'Printed' },
  { id: 'j6', printerId: 'pr1', time: '1:10 PM', document: 'Pick ticket', record: 'SO-10477', sentBy: 'D. Chen', copies: 1, size: 'Letter', status: 'Printed' },
  { id: 'j7', printerId: 'pr2', time: '12:41 PM', document: 'Packing slip', record: 'SO-10476', sentBy: 'K. Ito', copies: 1, size: 'Letter', status: 'Printed' },
];

export const SAMPLE_PRINT_SETTINGS: PrintSettings = {
  labelLanguage: 'ZPL (Zebra)',
  retry: '3 times, 1 minute apart',
  history: '90 days',
  notify: 'Warehouse manager',
  fallback: true,
};

/** What the agent finds on the network (Figma 891:3882). Those already added to the warehouse can't be added twice. */
export const FOUND_ON_NETWORK: FoundPrinter[] = [
  { id: 'f1', name: 'ZD421-RCV2', model: 'Zebra ZD421', ip: '10.0.4.36', type: 'Thermal label' },
  { id: 'f2', name: 'BRW-QL1110', model: 'Brother QL-1110', ip: '10.0.4.41', type: 'Thermal label' },
  { id: 'f3', name: 'HP02156', model: 'HP LaserJet M404', ip: '10.0.4.21', type: 'Laser' },
  { id: 'f4', name: 'CJ3000', model: 'Zebra ZT411', ip: '10.0.4.30', type: 'Thermal label' },
];
export const FOUND_ON_USB: FoundPrinter[] = [{ id: 'u1', name: 'DYMO-5XL', model: 'DYMO LabelWriter 5XL', ip: 'USB', type: 'Thermal label' }];

/** The pairing code the agent shows (Set Up Print Agent): three letters / digits, a dash, three more. */
export function pairingCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const pick = () => chars[Math.floor(Math.random() * chars.length)];
  return `${pick()}${pick()}${pick()}-${pick()}${pick()}${pick()}`;
}
