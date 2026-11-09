/** Sample data and options for the warehouse record pages (see WAREHOUSE_RECORD.md). In memory, like the rest of the prototype. */

export type Carrier = {
  id: string;
  name: string;
  account: string;
  nickname: string;
  billing: string;
  services: string[];
  active: boolean;
};

export const CARRIER_NAMES = ['UPS', 'FedEx', 'USPS', 'DHL'];
export const BILLING_TYPES = ['Prepaid', 'Collect', 'Third Party'];
/** Figma "Edit Carrier Account — Improved" (848:20546): the Service Types chips, in its order. */
export const SERVICE_TYPES = ['Ground', 'Express', 'LTL', 'International', 'Freight'];

/** Figma "Carrier Accounts" (380:28637) */
export const SAMPLE_CARRIERS: Carrier[] = [
  { id: 'c1', name: 'UPS', account: '132456', nickname: 'UPS - PHX WH01', billing: 'Prepaid', services: ['Ground', 'LTL'], active: true },
  { id: 'c2', name: 'FedEx', account: '465798', nickname: 'FX - PHX WH01', billing: 'Collect', services: ['Ground', 'LTL'], active: false },
];

/**
 * The company's carrier accounts, which Add Carrier Account lists (Figma "Add Carrier Account — Improved", 848:17307:
 * "UPS · UPS South Idaho", "Account •••• 4687"). The first two are Phoenix WH's own sample accounts.
 */
export const KNOWN_CARRIER_ACCOUNTS: Omit<Carrier, 'id' | 'active'>[] = [
  { name: 'UPS', nickname: 'UPS - PHX WH01', account: '132456', billing: 'Prepaid', services: ['Ground', 'LTL'] },
  { name: 'FedEx', nickname: 'FX - PHX WH01', account: '465798', billing: 'Collect', services: ['Ground', 'LTL'] },
  { name: 'UPS', nickname: 'UPS South Idaho', account: '1Z-8840-4687', billing: 'Prepaid', services: ['Ground', 'Express'] },
  { name: 'UPS', nickname: 'UPS Arizona Freight', account: '1Z-3315-0098', billing: 'Third Party', services: ['LTL', 'Freight'] },
  { name: 'FedEx', nickname: 'FedEx Florida', account: '4589-5693-5214-73961', billing: 'Prepaid', services: ['Ground', 'International'] },
  { name: 'USPS', nickname: 'USPS Phoenix Business', account: '9402-1180-55', billing: 'Prepaid', services: ['Ground'] },
  { name: 'DHL', nickname: 'DHL Southwest', account: 'DHL-77120-4', billing: 'Collect', services: ['Express', 'International'] },
];

export type Contact = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  role: string;
  additionalRoles: string[];
  /** The warehouse's primary contact (Figma's filled ★); one per warehouse. */
  primary: boolean;
  active: boolean;
};

/** Contact roles: the archived Figma role list (525:11924) without its duplicate Receiving, plus Accounting and Associate from the sample rows. */
export const CONTACT_ROLES = [
  'Warehouse Manager',
  'Manager',
  'Assistant Manager',
  'Inventory Control',
  'Receiving',
  'Shipping',
  'Dock Coordinator',
  'Freight Coordinator',
  'Carrier Contact',
  'IMS/WMS Admin',
  'IT / Technical Contact',
  'ERP Integration Contact',
  'Purchasing',
  'RMA / Disputes',
  'Safety Officer',
  'Hazmat Coordinator',
  'Security Contact',
  'Fire / Safety',
  'Facility Maintenance',
  'Billing',
  'Accounts Payable',
  'Accounts Receivable',
  'Lead Installer',
  'Installer',
  'Electrician',
  'Service Tech',
  'Accounting',
  'Associate',
  'Supplier Rep',
  'Installer Lead',
  'Other',
];

/** The company's own name: its people are "Internal" contacts (Figma's "Acme Solar (Internal)"). */
export const INTERNAL_COMPANY = 'HUB360';
export const COMPANIES = [INTERNAL_COMPANY, 'Solar Topps', 'Wesco Solar Supply', 'ABC Holding Company', 'Beacon Depot'];

/** Figma "Contacts" (848:20960) */
export const SAMPLE_CONTACTS: Contact[] = [
  { id: 'p1', name: 'Waylon Jones', company: 'HUB360', phone: '(602) 358-9652', email: 'wjones@hb360.com', role: 'Warehouse Manager', additionalRoles: ['Shipping', 'Receiving'], primary: true, active: true },
  { id: 'p3', name: 'Pamela Isley', company: 'HUB360', phone: '(480) 320-2253', email: 'pisley@hb360.com', role: 'Associate', additionalRoles: ['Inventory Control'], primary: false, active: true },
  { id: 'p4', name: 'Dana Ruiz', company: 'Wesco Solar Supply', phone: '(602) 555-0142', email: 'dana.ruiz@example.com', role: 'Supplier Rep', additionalRoles: [], primary: false, active: true },
  { id: 'p2', name: 'Oliver Wan', company: 'HUB360', phone: '(526) 365-5569', email: 'owan@hb360.com', role: 'Accounting', additionalRoles: [], primary: false, active: false },
];

/** People in the CRM that Search Contacts finds (Figma 537:57757: a photo, the name, the company and the primary role). */
export const CRM_PEOPLE: Omit<Contact, 'id' | 'primary' | 'active'>[] = [
  { name: 'Wayne Nelson', company: 'Solar Topps', phone: '(602) 555-0199', email: 'wnelson@solartopps.com', role: 'Installer Lead', additionalRoles: [] },
  { name: 'Waylon Jones', company: 'HUB360', phone: '(602) 358-9652', email: 'wjones@hb360.com', role: 'Warehouse Manager', additionalRoles: ['Shipping', 'Receiving'] },
  { name: 'Jeremy Wonder', company: 'ABC Holding Company', phone: '480-555-0178', email: 'jwonder@abcholding.com', role: 'Purchasing', additionalRoles: ['Billing'] },
  { name: 'Selina Kyle', company: 'Beacon Depot', phone: '623-555-0110', email: 'skyle@beacondepot.com', role: 'Dock Coordinator', additionalRoles: ['Receiving'] },
  { name: 'Harvey Dent', company: 'Solar Topps', phone: '602-555-0192', email: 'hdent@solartopps.com', role: 'Safety Officer', additionalRoles: [] },
  { name: 'Leslie Thompkins', company: 'HUB360', phone: '480-555-0127', email: 'lthompkins@hb360.com', role: 'Inventory Control', additionalRoles: ['Shipping'] },
];

/** Initials for an avatar, e.g. "Waylon Jones" → "WJ". */
export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0]!.toUpperCase())
    .slice(0, 2)
    .join('');

/* ---------- Pick / Pack (Figma 899:3331 view, 84:11914 edit) ---------- */

/** The warehouse's printers, as Pick / Pack and the label defaults name them (Printers tab: "CJ3000 · Shipping Office"). */
export const PRINTERS = [
  'CJ3000 · Shipping Office',
  'CJ3000 · Front Office',
  'HP02156 · Back Office',
  'HP0034 · Warehouse Office',
  'ZD421 · Receiving Dock',
];
/** An order's stages, in order: allocation and commit each pick one; commit must come at or after allocation. */
export const ORDER_STAGES = ['Order is placed', 'Order is approved', 'Picking is started', 'Picking is complete', 'Packing is complete', 'Order is shipped'];
/** The order date fields allocation can count from (set up in settings; the list can grow). */
export const ORDER_DATES = ['Due date', 'Ship date', 'Install date', 'Order date'];
export const PICK_TICKET_FORMATS = ['Grouped by zone', 'One ticket per order', 'Batch pick list', 'Wave pick list'];
export const SORT_BY = ['Walking path (recommended)', 'Location / bin #', 'Item #', 'Quantity, high → low'];
/** Shown as a disabled chip: not available yet. */
export const SORT_LATER = 'AI-optimized (later)';
export const THEN_BY = ['None', 'Item #', 'Location / bin #', 'Quantity, high → low'];
export const ROTATIONS = ['FIFO · oldest first', 'FEFO · earliest expiry first', 'None'];
export const SLIP_FORMATS = ['Standard', 'Itemized', 'Summary by carton'];

/** Picking › Pick rules and Scanning & validation: a title, a line under it, and an on / off each. */
export const PICK_RULES = [
  { key: 'onlyAvailable', label: 'Show only available stock', description: 'Hide locations with no unallocated quantity.' },
  { key: 'partialPick', label: 'Allow partial picks', description: 'Ship what’s available and backorder the rest.' },
  { key: 'overpick', label: 'Allow over-picking', description: 'Let pickers pick more than ordered (e.g. full case).' },
  { key: 'substitutions', label: 'Allow substitutions', description: 'Let pickers swap in an approved replacement item.' },
] as const;
export const SCAN_RULES = [
  { key: 'scanLocation', label: 'Scan location before item', description: 'Confirms the picker is at the right bin.' },
  { key: 'validateLots', label: 'Validate lot numbers', description: 'Required for lot-controlled items.' },
  { key: 'validateSerials', label: 'Validate serial numbers', description: 'Required for serialized items.' },
  { key: 'manualQuantity', label: 'Confirm quantity manually', description: 'Picker types the quantity instead of scanning each unit.' },
] as const;
export type PickRule = (typeof PICK_RULES)[number]['key'] | (typeof SCAN_RULES)[number]['key'];

export type PickPackSettings = {
  allocateWhen: string;
  commitWhen: string;
  /** Start allocating this many days before the order's `startDate` field (empty: no lead time). */
  startDays: number | null;
  startDate: string;
  ticketFormat: string;
  ticketPrinter: string;
  autoPrint: boolean;
  sortBy: string;
  thenBy: string;
  rotation: string;
  rules: Record<PickRule, boolean>;
  slipFormat: string;
  slipPrinter: string;
  showPrices: boolean;
  /** Notifications: pick exceptions (shorts, substitutions) and packing complete. */
  exceptionsEmail: string;
  packedEmail: string;
};

export const SAMPLE_PICK_PACK: PickPackSettings = {
  allocateWhen: 'Order is placed',
  commitWhen: 'Picking is complete',
  startDays: 3,
  startDate: 'Due date',
  ticketFormat: 'Grouped by zone',
  ticketPrinter: 'HP02156 · Back Office',
  autoPrint: true,
  sortBy: 'Walking path (recommended)',
  thenBy: 'Item #',
  rotation: 'FIFO · oldest first',
  rules: {
    onlyAvailable: true,
    partialPick: true,
    overpick: false,
    substitutions: true,
    scanLocation: true,
    validateLots: true,
    validateSerials: true,
    manualQuantity: false,
  },
  slipFormat: 'Standard',
  slipPrinter: 'HP0034 · Warehouse Office',
  showPrices: true,
  exceptionsEmail: 'warehouse-alerts@beacondepot.com',
  packedEmail: 'shipping@beacondepot.com',
};

export const LABEL_SIZES = ['2 × 1 in', '3 × 2 in', '4 × 6 in', '4 × 8 in', 'Custom'] as const;
export type LabelSize = (typeof LABEL_SIZES)[number];

/** The labels a warehouse can print, each with the size its stock usually comes in (choosing one presets the size). */
export const LABEL_PRESETS: Record<string, Exclude<LabelSize, 'Custom'>> = {
  'Pick/Pack Label Carton': '4 × 6 in',
  'Shipping Label': '4 × 6 in',
  'Pallet Label': '4 × 8 in',
  'Bin Label': '2 × 1 in',
  'Return Label': '3 × 2 in',
};
export const LABEL_NAMES = Object.keys(LABEL_PRESETS);

export type PickLabel = {
  id: string;
  name: string;
  printer: string;
  size: LabelSize;
  /** Width × height in inches, for a Custom size. */
  custom?: { width: number; height: number };
  copies: number;
  orientation: 'Portrait' | 'Landscape';
};

/** Width × height in inches of a label size. */
export function labelInches(label: Pick<PickLabel, 'size' | 'custom'>) {
  if (label.size === 'Custom') return label.custom ?? { width: 4, height: 6 };
  const [width, height] = label.size.replace(' in', '').split(' × ').map(Number);
  return { width: width!, height: height! };
}
export const labelSizeText = (label: Pick<PickLabel, 'size' | 'custom'>) => {
  const { width, height } = labelInches(label);
  return `${width} × ${height} in`;
};

/** Figma "Label Defaults" (84:11914). Figma's table says "Pick Pak"; the label is "Pick/Pack Label Carton" everywhere. */
export const SAMPLE_LABELS: PickLabel[] = [
  { id: 'l1', name: 'Pick/Pack Label Carton', printer: 'CJ3000 · Shipping Office', size: '4 × 6 in', copies: 1, orientation: 'Portrait' },
  { id: 'l2', name: 'Shipping Label', printer: 'CJ3000 · Front Office', size: '4 × 6 in', copies: 1, orientation: 'Portrait' },
];

/* ---------- Locations (Figma 80:10030, 562:4260) ---------- */

export const LOCATION_TYPES = ['Zone', 'Aisle', 'Rack', 'Shelf', 'Shelves', 'Bin', 'Pallet'];
/** Structure depth: Figma's badges go from 1 to 4. */
export const MAX_LOCATION_DEPTH = 4;

export type WarehouseLocation = {
  id: string;
  name: string;
  description: string;
  type: string;
  frozen: boolean;
  nonPickable: boolean;
  empty: boolean;
  active: boolean;
  /** The location this one sits in; null at the top level. Siblings keep the list's order. */
  parentId: string | null;
  /** Code (barcode), e.g. "A-01-01-02"; without one it comes from the location's place in the tree (locationTree codeOf). */
  code?: string;
  /** Capacity (optional), as entered: "1 pallet · 2,500 lb". */
  capacity?: string;
  /** Storage slots, and how many are in use (Utilization "152/254 (102)"); defaults by type (locationTree). */
  slots?: number;
  used?: number;
};

const L = (
  id: string,
  name: string,
  type: string,
  parentId: string | null,
  description: string,
  flags: Partial<Pick<WarehouseLocation, 'frozen' | 'nonPickable' | 'empty' | 'active'>> = {},
): WarehouseLocation => ({ id, name, type, parentId, description, frozen: false, nonPickable: false, empty: false, active: true, ...flags });

/** Figma's Zone A / C / H and the Structure sample (1 Area A › 2 Shelf 1 › 3 Bin 1 › 4 Bin 1 - Left), filled out to two pages. */
export const SAMPLE_LOCATIONS: WarehouseLocation[] = [
  L('loc-zone-a', 'Zone A', 'Pallet', null, 'Bulk pallet storage by the north dock'),
  L('loc-ra-01-01', 'RA-01-01', 'Rack', 'loc-zone-a', 'Rack A, bay 1, level 1'),
  L('loc-ra-01-02', 'RA-01-02', 'Rack', 'loc-zone-a', 'Rack A, bay 1, level 2'),
  L('loc-area-a', 'Area A', 'Zone', null, 'Small parts picking area'),
  L('loc-shelf-1', 'Shelf 1', 'Shelves', 'loc-area-a', 'Fasteners and hardware'),
  L('loc-bin-1', 'Bin 1', 'Bin', 'loc-shelf-1', 'Bolts'),
  L('loc-bin-1-left', 'Bin 1 - Left', 'Bin', 'loc-bin-1', 'Hex bolts'),
  L('loc-bin-1-right', 'Bin 1 - Right', 'Bin', 'loc-bin-1', 'Flat bolts'),
  L('loc-bin-2', 'Bin 2', 'Bin', 'loc-shelf-1', 'Nuts and washers'),
  L('loc-shelf-2', 'Shelf 2', 'Shelves', 'loc-area-a', 'Connectors and grounding', { empty: true }),
  L('loc-zone-b', 'Zone B', 'Pallet', null, 'Solar panel pallets'),
  L('loc-zone-c', 'Zone C', 'Bin', null, 'Electrical small parts'),
  L('loc-zone-d', 'Zone D', 'Shelves', null, 'Cycle count hold', { frozen: true, empty: true }),
  L('loc-zone-e', 'Zone E', 'Rack', null, 'Racking rails and long stock'),
  L('loc-zone-f', 'Zone F', 'Pallet', null, 'Overflow pallets', { nonPickable: true, empty: true }),
  L('loc-zone-g', 'Zone G', 'Bin', null, 'Kits staged for install', { empty: true }),
  L('loc-zone-h', 'Zone H', 'Shelves', null, 'Battery storage (fire-rated)'),
  L('loc-tool-room-1', 'Tool Room 1', 'Shelves', null, 'Assemblies and service builds'),
  L('loc-receiving', 'Receiving Dock', 'Zone', null, 'Inbound staging', { nonPickable: true, empty: true }),
  L('loc-returns', 'Returns Cage', 'Zone', null, 'Returned goods awaiting inspection', { nonPickable: true, empty: true, active: false }),
];

/* ---------- Items (Figma 571:24397) ---------- */

export const ITEM_TYPES = ['Part', 'Assembly', 'Kit'] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export type CatalogItem = {
  id: string;
  /** The Item # (general note 3: "#", not "Number"). */
  number: string;
  name: string;
  type: ItemType;
  category: string;
  subCategory: string;
  description: string;
};
export type WarehouseItem = CatalogItem & { active: boolean };

const I = (id: string, number: string, name: string, type: ItemType, category: string, subCategory: string, description: string): CatalogItem => ({
  id,
  number,
  name,
  type,
  category,
  subCategory,
  description,
});

/** Every item in the company (what Search Items finds). Real-looking names in place of Figma's placeholders. */
export const CATALOG_ITEMS: CatalogItem[] = [
  I('it-shock', 'AS4-597-3248', 'Shock Build', 'Assembly', 'Suspension', 'Shocks', 'Rear shock assembly, 2.5 in body'),
  I('it-hex-bolt', '0004-5896-4521', 'Hex Bolt', 'Part', 'Fasteners', 'Bolts', 'Hex bolt, 3/8-16 × 1 in, stainless'),
  I('it-flat-bolt', '7012-6589-2568', 'Flat Bolt', 'Part', 'Fasteners', 'Bolts', 'Flat head bolt, 5/16-18 × 3/4 in'),
  I('it-lug-nut', 'AD23-4529', 'Lug Nut', 'Part', 'Fasteners', 'Nuts', 'Grounding lug nut, 1/4-20'),
  I('it-install-kit', 'KT7-210-0045', 'Install Kit', 'Kit', 'Installation', 'Roof Mount', 'Residential install kit, 10 panels'),
  I('it-rec-325', 'PA-0002-AJ89', 'REC 325 Solar Panel', 'Part', 'Solar Panels', 'Monocrystalline', 'REC 325 W mono panel, black frame'),
  I('it-iq8', 'PA-0107-IQ8M', 'IQ8 Microinverter', 'Part', 'Inverters', 'Microinverters', 'IQ8M microinverter, 330 VA'),
  I('it-rail', 'PA-0311-RR168', 'Racking Rail 168 in', 'Part', 'Racking', 'Rails', 'Aluminum racking rail, 168 in'),
  I('it-mid-clamp', 'PA-0312-MC35', 'Mid Clamp', 'Part', 'Racking', 'Clamps', 'Mid clamp for 35 mm frames'),
  I('it-end-clamp', 'PA-0313-EC35', 'End Clamp', 'Part', 'Racking', 'Clamps', 'End clamp for 35 mm frames'),
  I('it-combiner', 'AS2-118-0730', 'Combiner Box Assembly', 'Assembly', 'Electrical', 'Combiners', '4-circuit combiner box, wired'),
  I('it-roof-kit', 'KT3-044-1200', 'Roof Mount Kit', 'Kit', 'Installation', 'Roof Mount', 'Comp shingle roof mount kit'),
  I('it-mc4', 'PA-0420-MC4', 'MC4 Connector Pair', 'Part', 'Electrical', 'Connectors', 'MC4 male / female connector pair'),
  I('it-ground-lug', 'PA-0425-GL10', 'Grounding Lug', 'Part', 'Electrical', 'Grounding', 'Tin-plated grounding lug, 6–14 AWG'),
  I('it-battery', 'PA-0900-BP135', 'Battery Pack 13.5 kWh', 'Part', 'Storage', 'Batteries', 'Home battery pack, 13.5 kWh'),
  I('it-service-kit', 'KT9-301-0007', 'Service Kit', 'Kit', 'Service', 'Maintenance', 'Annual service visit kit'),
  I('it-jbox', 'AS2-220-0415', 'Junction Box Assembly', 'Assembly', 'Electrical', 'Junction Boxes', 'Rooftop junction box, pre-wired'),
  I('it-emt', 'PA-0510-EMT34', 'EMT Conduit 3/4 in', 'Part', 'Electrical', 'Conduit', 'EMT conduit, 3/4 in × 10 ft'),
  I('it-flashing-kit', 'KT3-050-0300', 'Flashing Kit', 'Kit', 'Installation', 'Flashing', 'Tile roof flashing kit'),
  I('it-rsd', 'AS3-415-0090', 'Rapid Shutdown Assembly', 'Assembly', 'Electrical', 'Safety', 'Rapid shutdown transmitter assembly'),
];

/** One-line descriptions for the Add Part / Assembly / Kit modals (ITEMS.md). */
export const ITEM_TYPE_SUBTITLES: Record<ItemType, string> = {
  Part: 'An individual item that can be used on its own or as a component of an assembly or kit.',
  Assembly: 'A combination of two or more parts that are put together to create a single item.',
  Kit: 'A group of parts and assemblies sold or shipped together as one item.',
};

/* ---------- Stock (Figma 76:11638) ---------- */

export type StockRow = {
  id: string;
  itemId: string;
  locationId: string;
  onHand: number;
  allocated: number;
  committed: number;
  frozen: number;
};

/** Available = On Hand − Allocated − Frozen (never below 0). */
export const availableOf = (s: StockRow) => Math.max(0, s.onHand - s.allocated - s.frozen);

const S = (id: string, itemId: string, locationId: string, onHand: number, allocated: number, committed: number, frozen: number): StockRow => ({
  id,
  itemId,
  locationId,
  onHand,
  allocated,
  committed,
  frozen,
});

/** Figma's first row is AS4-597-3248 · 10 / 10 / 10 / 0 / 0 · Tool Room 1; the rest keep the same arithmetic. */
export const SAMPLE_STOCK: StockRow[] = [
  S('st1', 'it-shock', 'loc-tool-room-1', 10, 10, 10, 0),
  S('st2', 'it-hex-bolt', 'loc-bin-1-left', 1200, 240, 120, 0),
  S('st3', 'it-flat-bolt', 'loc-bin-1-right', 850, 0, 0, 50),
  S('st4', 'it-lug-nut', 'loc-bin-2', 640, 96, 96, 0),
  S('st5', 'it-install-kit', 'loc-tool-room-1', 18, 6, 4, 0),
  S('st6', 'it-rec-325', 'loc-zone-b', 320, 120, 80, 0),
  S('st7', 'it-rec-325', 'loc-ra-01-01', 64, 0, 0, 0),
  S('st8', 'it-iq8', 'loc-zone-c', 410, 150, 150, 10),
  S('st9', 'it-rail', 'loc-zone-e', 260, 60, 20, 0),
  S('st10', 'it-mid-clamp', 'loc-ra-01-02', 900, 300, 200, 0),
  S('st11', 'it-end-clamp', 'loc-ra-01-02', 450, 0, 0, 0),
  S('st12', 'it-combiner', 'loc-tool-room-1', 12, 4, 4, 2),
  S('st13', 'it-roof-kit', 'loc-zone-a', 40, 12, 8, 0),
  S('st14', 'it-mc4', 'loc-zone-c', 1500, 400, 250, 0),
  S('st15', 'it-ground-lug', 'loc-zone-h', 300, 25, 25, 0),
];

/** The items Phoenix WH carries (the Figma sample warehouse); two are inactive. */
const PHX_ITEM_IDS = CATALOG_ITEMS.slice(0, 14).map(i => i.id);
const INACTIVE_ITEM_IDS = ['it-flat-bolt', 'it-end-clamp'];

/**
 * A warehouse's starting items: Phoenix WH (PHX-124) has the full sample; every other warehouse has the stocked
 * items plus its own mix of the rest, so Clone Warehouse has something to copy.
 */
export function sampleItemsFor(code: string): WarehouseItem[] {
  const stocked = new Set(SAMPLE_STOCK.map(s => s.itemId));
  const seed = [...code].reduce((n, ch) => n + ch.charCodeAt(0), 0);
  const ids =
    code === 'PHX-124' ? PHX_ITEM_IDS : CATALOG_ITEMS.filter((item, i) => stocked.has(item.id) || (seed + i) % 3 === 0).map(i => i.id);
  return CATALOG_ITEMS.filter(i => ids.includes(i.id)).map(i => ({ ...i, active: !INACTIVE_ITEM_IDS.includes(i.id) }));
}

/* ---------- History (Figma 571:57601) ---------- */

export const ACTION_TYPES = ['Stock Order', 'Pick Order', 'Build Order', 'Move Order'] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

/** A piece of an Action Performed sentence: plain text, or a link to an order, an item or a location. */
export type HistoryPart = string | { order: string } | { item: string } | { location: string };

export type HistoryEntry = {
  id: string;
  type: ActionType;
  parts: HistoryPart[];
  by: string;
  /** Local date and time, e.g. 2026-06-16T12:37:45. */
  date: string;
};

/** Real sentences in place of Figma's lorem ipsum; the items and locations are the samples above. */
export const SAMPLE_HISTORY: HistoryEntry[] = [
  { id: 'h1', type: 'Move Order', parts: ['Moved 24 × ', { item: 'it-lug-nut' }, ' from ', { location: 'loc-bin-1' }, ' to ', { location: 'loc-bin-2' }, ' on move order ', { order: 'MO-12456' }, '.'], by: 'Roman Sionis', date: '2026-06-16T12:37:45' },
  { id: 'h2', type: 'Pick Order', parts: ['Picked 12 × ', { item: 'it-iq8' }, ' and 12 × ', { item: 'it-mc4' }, ' from ', { location: 'loc-zone-c' }, ' for pick order ', { order: 'PO-10480' }, '.'], by: 'Pamela Isley', date: '2026-06-16T10:12:03' },
  { id: 'h3', type: 'Stock Order', parts: ['Received 320 × ', { item: 'it-rec-325' }, ' into ', { location: 'loc-zone-b' }, ' on stock order ', { order: 'SO-20931' }, '.'], by: 'Waylon Jones', date: '2026-06-15T16:44:19' },
  { id: 'h4', type: 'Build Order', parts: ['Built 4 × ', { item: 'it-combiner' }, ' in ', { location: 'loc-tool-room-1' }, ' on build order ', { order: 'BO-3307' }, ', using 16 × ', { item: 'it-mc4' }, '.'], by: 'Roman Sionis', date: '2026-06-15T13:05:52' },
  { id: 'h5', type: 'Pick Order', parts: ['Picked 2 × ', { item: 'it-install-kit' }, ' from ', { location: 'loc-tool-room-1' }, ' for pick order ', { order: 'PO-10477' }, '.'], by: 'Pamela Isley', date: '2026-06-15T09:31:40' },
  { id: 'h6', type: 'Move Order', parts: ['Moved 64 × ', { item: 'it-rec-325' }, ' from ', { location: 'loc-zone-b' }, ' to ', { location: 'loc-ra-01-01' }, ' on move order ', { order: 'MO-12451' }, '.'], by: 'Waylon Jones', date: '2026-06-14T15:22:08' },
  { id: 'h7', type: 'Stock Order', parts: ['Received 1,200 × ', { item: 'it-hex-bolt' }, ' into ', { location: 'loc-bin-1-left' }, ' on stock order ', { order: 'SO-20927' }, '.'], by: 'Roman Sionis', date: '2026-06-14T11:47:30' },
  { id: 'h8', type: 'Build Order', parts: ['Built 10 × ', { item: 'it-shock' }, ' in ', { location: 'loc-tool-room-1' }, ' on build order ', { order: 'BO-3302' }, '.'], by: 'Roman Sionis', date: '2026-06-13T14:18:55' },
  { id: 'h9', type: 'Move Order', parts: ['Moved 50 × ', { item: 'it-flat-bolt' }, ' from ', { location: 'loc-bin-1-right' }, ' to ', { location: 'loc-zone-d' }, ' for a cycle count on move order ', { order: 'MO-12447' }, '.'], by: 'Pamela Isley', date: '2026-06-13T08:02:16' },
  { id: 'h10', type: 'Pick Order', parts: ['Picked 30 × ', { item: 'it-mid-clamp' }, ' and 10 × ', { item: 'it-end-clamp' }, ' from ', { location: 'loc-ra-01-02' }, ' for pick order ', { order: 'PO-10469' }, '.'], by: 'Waylon Jones', date: '2026-06-12T16:39:44' },
  { id: 'h11', type: 'Stock Order', parts: ['Received 260 × ', { item: 'it-rail' }, ' into ', { location: 'loc-zone-e' }, ' on stock order ', { order: 'SO-20918' }, '.'], by: 'Waylon Jones', date: '2026-06-12T10:25:11' },
  { id: 'h12', type: 'Build Order', parts: ['Built 6 × ', { item: 'it-install-kit' }, ' in ', { location: 'loc-tool-room-1' }, ' on build order ', { order: 'BO-3298' }, '.'], by: 'Pamela Isley', date: '2026-06-11T13:56:37' },
];

/** "Jun 16, 2026" and "12:37:45 PM", the two lines of Date Created. */
export function historyDate(date: string) {
  const d = new Date(date);
  return {
    day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }),
  };
}
