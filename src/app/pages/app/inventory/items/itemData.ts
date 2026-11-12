/**
 * Types and sample data for Inventory › Items (see ITEMS.md): parts, assemblies and kits, with their stock,
 * builds, warranties, suppliers, notes, files and history. In memory, like the rest of the prototype.
 */

export type ItemType = 'Part' | 'Assembly' | 'Kit';
export const ITEM_TYPES: ItemType[] = ['Part', 'Assembly', 'Kit'];

/** The prefix of an item's system #. */
export const TYPE_PREFIX: Record<ItemType, string> = { Part: 'PA', Assembly: 'AS', Kit: 'KT' };
/** The record header's icon for each type. */
export const TYPE_ICON: Record<ItemType, string> = { Part: 'part', Assembly: 'settings', Kit: 'archive' };
/** The Add Part / Add Assembly / Add Kit subtitles (ITEMS.md §1; Figma copies the Assembly text for kits). */
export const TYPE_DESCRIPTION: Record<ItemType, string> = {
  Part: 'An individual item that can be used on its own or as a component of an assembly or kit.',
  Assembly: 'A combination of two or more parts that are put together to create a single item.',
  Kit: 'A group of parts and assemblies sold or shipped together as one item.',
};

export type PackageKey = 'pack' | 'case' | 'carton' | 'bulk' | 'pallet';
export const PACKAGES: { key: PackageKey; label: string }[] = [
  { key: 'pack', label: 'Pack' },
  { key: 'case', label: 'Case' },
  { key: 'carton', label: 'Carton' },
  { key: 'bulk', label: 'Bulk' },
  { key: 'pallet', label: 'Pallet' },
];

export type StockRow = {
  id: string;
  /** Warehouse code, e.g. PHX-124 (warehouseData.ts). */
  warehouse: string;
  location: string;
  onHand: number;
  allocated: number;
  committed: number;
  frozen: number;
};
export const available = (s: StockRow) => Math.max(0, s.onHand - s.allocated - s.committed - s.frozen);

/** One line of an assembly's or kit's build. */
export type BuildLine = { itemId: string; quantity: number };

export type WarrantyKind = 'standard' | 'extended';
export type WarrantyPrice = { id: string; type: string; value: number | null; unitCost: number | null };
export type Warranty = {
  id: string;
  kind: WarrantyKind;
  category: string;
  term: number;
  termUnit: string;
  /** A link or an uploaded file's name. */
  document: string;
  documentKind: 'link' | 'file';
  offeredByInstaller?: boolean;
  prices?: WarrantyPrice[];
};

export type PackageCost = { quantity: number | null; cost: number | null; leadTime: number | null };
export type PriceBreak = { id: string; upTo: number | null; value: number | null };
export type ItemSupplier = {
  id: string;
  supplier: string;
  primary: boolean;
  partNumber: string;
  partName: string;
  packages: Record<PackageKey, PackageCost>;
  breakMode: 'percent' | 'price';
  /** Price breaks for each package size. */
  priceBreaks: Record<PackageKey, PriceBreak[]>;
  updated: string;
};

export type NoteType = 'Admin' | 'Warehouse' | 'General';
export const NOTE_TYPES: NoteType[] = ['Admin', 'Warehouse', 'General'];
export type Note = {
  id: string;
  author: string;
  updated: string;
  text: string;
  pinMe: boolean;
  pinAll: boolean;
  popup: boolean;
  types: NoteType[];
};

export type ComplianceStatus = 'Compliant' | 'Warning required' | 'Not applicable' | 'Not reviewed';
export const COMPLIANCE_STATUSES: ComplianceStatus[] = ['Compliant', 'Warning required', 'Not applicable', 'Not reviewed'];
export type GeneralSpec = { id: string; label: string; value: string };
/** One unit of measure: e.g. Pallet contains 30 Each. Weight keeps its unit as typed ("1,480 lbs"). */
export type ItemUnit = { id: string; unit: string; contains: number | null; uom: string; barcode: string; weight: string };

export type FileType = 'Folder' | 'pdf' | 'png' | 'mov' | 'jpg' | 'doc' | 'xls' | 'ppt' | 'url';
export const FILE_ICON: Record<FileType, string> = {
  Folder: 'folder',
  pdf: 'document',
  png: 'photo',
  jpg: 'photo',
  mov: 'video-file',
  doc: 'document',
  xls: 'table',
  ppt: 'reports',
  url: 'link-add',
};
export const isImage = (t: FileType) => t === 'png' || t === 'jpg';
export type ItemFile = {
  id: string;
  name: string;
  type: FileType;
  /** The folder it sits in; null is Home. */
  folder: string | null;
  modified: string;
  modifiedBy: string;
  active: boolean;
  description: string;
  url?: string;
};

export type HistoryAction = 'Stock Order' | 'Pick Order' | 'Build Order' | 'Adjustment';
export type OrderLine = { itemId: string; requested: number; picked: number };
export type Order = {
  number: string;
  createdBy: string;
  createdOn: string;
  dueOn: string;
  warehouse: string;
  status: string;
  lines: OrderLine[];
  /** Build orders: the assembly or kit being built. */
  build?: { itemId: string; required: number; picked: number };
  modified: string;
};
export type HistoryEntry = {
  id: string;
  warehouse: string;
  action: HistoryAction;
  /** Text before the order link, e.g. "Received 120 units on". */
  performed: string;
  createdBy: string;
  date: string;
  order?: Order;
};

export type Item = {
  /** The system #, also the route id (e.g. PA-0002-AJ89-98HB). */
  id: string;
  type: ItemType;
  customNumber: string;
  name: string;
  category: string;
  subcategory: string;
  active: boolean;
  description: string;
  manufacturer: string;
  model: string;
  lotControl: boolean;
  /** Lots record an expiry date and picks take the earliest first (FEFO); needs lot control. */
  trackExpiry: boolean;
  serialized: boolean;
  nonInventory: boolean;
  discontinued: boolean;
  /** Each standard in COMPLIANCE and its status (Details › Compliance). */
  compliance: Record<string, ComplianceStatus>;
  countryOfOrigin: string;
  /** Specs added to this item only (Details › Specifications › Add Spec). */
  generalSpecs: GeneralSpec[];
  /** The base unit first (contains 1 of itself), then its conversions (Details › Units & Packaging). */
  units: ItemUnit[];
  buyUnit: string;
  sellUnit: string;
  countUnit: string;
  images: string[];
  profileImage?: string;
  specSheet: string;
  unitType: string;
  weight: number | null;
  weightUnit: string;
  length: number | null;
  width: number | null;
  height: number | null;
  dimensionUnit: string;
  categorySpecs: Record<string, string>;
  packages: Record<PackageKey, { quantity: number | null; unit: string }>;
  minQuantity: number | null;
  safetyStock: number | null;
  reorderPoint: number | null;
  leadTime: number | null;
  autoCalculate: boolean;
  lastPurchase: { supplier: string; date: string; quantity: number | null; unitType: string; cost: number | null };
  unitCost: number;
  stock: StockRow[];
  build: BuildLine[];
  warranties: Warranty[];
  replacements: string[];
  /** Why each replacement is offered (shown to the person picking a substitute), by replacement item id. */
  replacementReasons: Record<string, string>;
  suppliers: ItemSupplier[];
  notes: Note[];
  files: ItemFile[];
  history: HistoryEntry[];
  modified: string;
};

/* ---------- Options ---------- */

export const CATEGORIES: Record<string, string[]> = {
  'Solar Panels': ['Monocrystalline', 'Polycrystalline', 'Bifacial'],
  Fasteners: ['Bolts', 'Nuts', 'Washers', 'Screws'],
  Racking: ['Rails', 'Clamps', 'Mounts', 'Roof Mounts'],
  Electrical: ['Wire', 'Connectors', 'Harnesses', 'Combiner Boxes'],
  Inverters: ['Microinverters', 'String Inverters'],
  Batteries: ['Lithium-Ion'],
  Hardware: ['Suspension', 'Brackets'],
  'Install Kits': ['Residential', 'Commercial', 'Storage'],
  'Service Kits': ['Maintenance', 'Suspension'],
};

/** A category spec: a text field, or a choice when it has options. */
export type SpecField = { key: string; label: string; options?: string[]; required?: boolean };
/**
 * Category specs (ITEMS.md §2; Figma Part Details 918:40291, "SOLAR PANEL SPECS (from category)"), row by row. In the
 * product they come from Inventory Settings › Categories. A category without one shows only the general specs.
 */
export const SPEC_TEMPLATES: Record<string, SpecField[][]> = {
  'Solar Panels': [
    [
      { key: 'powerOutput', label: 'Power output', required: true },
      { key: 'efficiency', label: 'Panel efficiency' },
      { key: 'cellType', label: 'Cell type', options: ['HJT N-type mono', 'TOPCon N-type mono', 'Mono PERC', 'Polycrystalline'] },
      { key: 'frame', label: 'Frame' },
      { key: 'backsheet', label: 'Backsheet', options: ['Black', 'White', 'Transparent'] },
    ],
    [
      { key: 'yearOne', label: 'Power after year 1' },
      { key: 'degradation', label: 'Annual degradation' },
      { key: 'lastYearPower', label: 'Power after year 25' },
      { key: 'productionFactor', label: 'Production factor' },
    ],
    [
      { key: 'maxVoltage', label: 'Max system voltage' },
      { key: 'maxReverse', label: 'Max reverse current' },
    ],
  ],
};
export const COUNTRIES = ['United States', 'Canada', 'Mexico', 'China', 'Germany', 'Japan', 'Malaysia', 'Singapore', 'South Korea', 'Vietnam'];
/** Units a row of Units & Packaging can be. */
export const UNIT_NAMES = ['Each', 'Pair', 'Foot', 'Kit', 'Pack', 'Box', 'Bag', 'Case', 'Carton', 'Crate', 'Bulk', 'Pallet', 'Container (40 ft)'];
/** Weight and dimension units, stored as before and shown short (Figma "47.4 lbs", "… in"). */
export const WEIGHT_LABEL: Record<string, string> = { LB: 'lbs', KG: 'kg', G: 'g', OZ: 'oz' };
export const DIMENSION_LABEL: Record<string, string> = { Inches: 'in', Feet: 'ft', Millimeters: 'mm' };
/** Why a replacement item is offered; the second names this item's maker (Figma "When REC is out of stock"). */
export const replacementReasons = (item: Pick<Item, 'manufacturer'>) => [
  'Preferred substitute',
  `When ${item.manufacturer || 'this item'} is out of stock`,
  'Customer approval needed',
  'Last resort',
];
/** A 12-digit UPC-style barcode for a unit left blank (Units & Packaging: "Leave a barcode blank to generate one"). */
export const newBarcode = () => `6915${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`;

export const MANUFACTURERS = ['REC', 'Enphase', 'SolarEdge', 'Tesla', 'IronRidge', 'Unirac', 'Fastenal', 'Southwire', 'Stäubli', 'Bilstein', 'Hub 360'];
export const SUPPLIERS = ['CED Greentech', 'Soligent', 'Wesco', 'Fastenal', 'Graybar', 'BayWa r.e.', 'Krannich Solar'];
/** The compliance standards, in Figma's order (Details › Compliance). */
export const COMPLIANCE = ['RoHS', 'REACH', 'Conflict Mineral Free', 'Mercury Free', 'Prop 65', 'DFARS', 'VPAR'];
export const allCompliance = (status: ComplianceStatus): Record<string, ComplianceStatus> => Object.fromEntries(COMPLIANCE.map(c => [c, status]));
export const COMPLIANCE_INFO: Record<string, string> = {
  RoHS: 'Restriction of Hazardous Substances: free of lead, mercury, cadmium and other restricted materials.',
  'Conflict Mineral Free': 'Contains no tin, tantalum, tungsten or gold from conflict regions.',
  REACH: 'Meets the EU regulation on the registration and safe use of chemicals.',
  DFARS: 'Meets the US Defense Federal Acquisition Regulation for specialty metals.',
  'Prop 65': 'Labeled as required by California Proposition 65.',
  'Mercury Free': 'Contains no mercury.',
  VPAR: 'Listed on the Vendor Product Approval Register.',
};
export const UNIT_TYPES = ['Each (EA)', 'Pair (PR)', 'Foot (FT)', 'Box (BX)', 'Kit (KT)'];
/** The unit without its abbreviation, as the Items list shows it: "Each (EA)" → "Each". */
export const unitLabel = (unitType: string) => unitType.replace(/\s*\(.*\)$/, '');
export const WEIGHT_UNITS = ['LB', 'KG', 'G', 'OZ'];
export const DIMENSION_UNITS = ['Inches', 'Feet', 'Millimeters'];
export const PACKAGE_UNITS = ['Box', 'Bag', 'Case', 'Carton', 'Crate', 'Pallet'];
export const WARRANTY_CATEGORIES = ['Manufacturer', 'Product', 'Performance', 'Workmanship', 'Labor'];
export const TERM_UNITS = ['Months', 'Years'];
export const WARRANTY_PRICE_TYPES = ['kW', 'Panel', 'System'];
export const PEOPLE = ['Kendal Ozzel', 'Orson Krennic', 'TK-421', 'Arihnda Pryce', 'Lorth Needa', 'Rae Sloane'];
export const WAREHOUSE_CODES = ['PHX-124', 'PHX-126', 'MES-201', 'TEM-301', 'GIL-401', 'CHD-501', 'TUC-901'];

// A trooper code ("TK-421") shows its letters ("TK"); a name its first two initials
export const initialsOf = (name: string) =>
  /^[A-Z]{2,}-\d+$/.test(name.trim())
    ? name.trim().slice(0, 2)
    : name
        .split(/\s+/)
        .map(w => w[0] ?? '')
        .join('')
        .slice(0, 2)
        .toUpperCase();

export const money = (n: number | null | undefined) =>
  n == null ? '—' : n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export const today = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/* ---------- Sample data ---------- */

// A seeded random, so the sample numbers are the same on every load
let seed = 20261102;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = <T,>(list: T[]) => list[Math.floor(rnd() * list.length)];
const int = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
const DATES = ['Apr 2, 2026', 'Apr 21, 2026', 'May 4, 2026', 'May 18, 2026', 'Jun 9, 2026', 'Jul 14, 2026', 'Aug 3, 2026', 'Sep 22, 2026', 'Oct 12, 2026', 'Oct 29, 2026'];

function sampleStock(id: string): StockRow[] {
  const codes = [...WAREHOUSE_CODES].sort(() => rnd() - 0.5).slice(0, int(2, 4));
  return codes.map((warehouse, i) => {
    const onHand = int(20, 600);
    const allocated = int(0, Math.floor(onHand / 4));
    const committed = int(0, Math.floor(onHand / 5));
    const frozen = rnd() < 0.25 ? int(1, 12) : 0;
    const location = `${warehouse.split('-')[0]}-${String.fromCharCode(65 + int(0, 5))}${int(1, 9)}-${String(int(1, 40)).padStart(2, '0')}`;
    return { id: `${id}-s${i}`, warehouse, location, onHand, allocated, committed, frozen };
  });
}

function sampleSuppliers(id: string, name: string, cost: number): ItemSupplier[] {
  const names = [...SUPPLIERS].sort(() => rnd() - 0.5).slice(0, 2);
  return names.map((supplier, i) => ({
    id: `${id}-sup${i}`,
    supplier,
    primary: i === 0,
    partNumber: `${supplier.slice(0, 3).toUpperCase()}-${int(10000, 99999)}`,
    partName: name,
    packages: {
      pack: { quantity: 10, cost: +(cost * 10 * (i ? 1.04 : 1)).toFixed(2), leadTime: int(2, 7) },
      case: { quantity: 50, cost: +(cost * 48).toFixed(2), leadTime: int(5, 10) },
      carton: { quantity: 200, cost: +(cost * 185).toFixed(2), leadTime: int(7, 14) },
      bulk: { quantity: null, cost: null, leadTime: null },
      pallet: { quantity: 1000, cost: +(cost * 880).toFixed(2), leadTime: int(14, 30) },
    },
    breakMode: 'percent',
    priceBreaks: {
      pack: [
        { id: `${id}-pb${i}a`, upTo: 644, value: 20 },
        { id: `${id}-pb${i}b`, upTo: 852, value: 25 },
      ],
      case: [{ id: `${id}-pb${i}c`, upTo: 120, value: 10 }],
      carton: [],
      bulk: [],
      pallet: [],
    },
    updated: 'May 18, 2026',
  }));
}

function sampleNotes(id: string, name: string): Note[] {
  return [
    {
      id: `${id}-n1`,
      author: 'Kendal Ozzel',
      updated: 'Oct 12, 2026',
      text: `Check the date code on every ${name} before it ships; the spring lot had a recall on a few batches.`,
      pinMe: true,
      pinAll: true,
      popup: false,
      types: ['Warehouse'],
    },
    {
      id: `${id}-n2`,
      author: 'Orson Krennic',
      updated: 'Sep 22, 2026',
      text: 'Primary supplier raised its case price by 4% from October. Review the reorder point before the next order.',
      pinMe: false,
      pinAll: false,
      popup: false,
      types: ['Admin', 'General'],
    },
  ];
}

function sampleFiles(id: string, name: string): ItemFile[] {
  const folder = `${id}-f0`;
  const f = (n: number, fileName: string, type: FileType, parent: string | null, description: string, url?: string): ItemFile => ({
    id: `${id}-f${n}`,
    name: fileName,
    type,
    folder: parent,
    modified: DATES[(n * 3) % DATES.length],
    modifiedBy: PEOPLE[n % PEOPLE.length],
    active: n !== 6,
    description,
    url,
  });
  return [
    f(0, 'Spec Sheets', 'Folder', null, 'Data sheets and certifications.'),
    f(1, `${name} Data Sheet`, 'pdf', folder, 'The manufacturer’s current data sheet.'),
    f(2, 'UL Certificate', 'pdf', folder, 'UL listing certificate.'),
    f(3, 'Front View', 'png', null, `Product photo of the ${name}.`),
    f(4, 'Installed On Site', 'jpg', null, 'Photo from a finished install.'),
    f(5, 'Install Walkthrough', 'mov', null, 'A two-minute install video for the crews.'),
    f(6, 'Handling Instructions', 'doc', null, 'Storage and handling rules for the warehouse.'),
    f(7, 'Cost Breakdown', 'xls', null, 'Landed cost by supplier.'),
    f(8, 'Product Training', 'ppt', null, 'Slides from the sales team training.'),
    f(9, 'Manufacturer Product Page', 'url', null, 'The product page on the manufacturer’s site.', 'https://www.example.com/products'),
  ];
}

const ORDER_STATUS = ['Complete', 'In Process', 'Open'];

function sampleHistory(item: { id: string; type: ItemType; stock: StockRow[]; build: BuildLine[] }): HistoryEntry[] {
  const entries: HistoryEntry[] = [];
  item.stock.forEach((s, i) => {
    const qty = int(12, 160);
    entries.push({
      id: `${item.id}-h${i}a`,
      warehouse: s.warehouse,
      action: 'Stock Order',
      performed: `Received ${qty} units into ${s.location} on`,
      createdBy: PEOPLE[(i + 1) % PEOPLE.length],
      date: DATES[(i * 2 + 1) % DATES.length],
      order: {
        number: `SO-${int(10000, 19999)}`,
        createdBy: PEOPLE[(i + 1) % PEOPLE.length],
        createdOn: DATES[(i * 2) % DATES.length],
        dueOn: DATES[(i * 2 + 1) % DATES.length],
        warehouse: s.warehouse,
        status: ORDER_STATUS[i % 3],
        lines: [{ itemId: item.id, requested: qty, picked: qty - (i % 2 ? 2 : 0) }],
        modified: DATES[(i * 2 + 1) % DATES.length],
      },
    });
    const pickQty = int(2, 24);
    entries.push({
      id: `${item.id}-h${i}b`,
      warehouse: s.warehouse,
      action: 'Pick Order',
      performed: `Picked ${pickQty} units from ${s.location} for`,
      createdBy: PEOPLE[(i + 3) % PEOPLE.length],
      date: DATES[(i * 2 + 4) % DATES.length],
      order: {
        number: `PO-${int(20000, 29999)}`,
        createdBy: PEOPLE[(i + 3) % PEOPLE.length],
        createdOn: DATES[(i * 2 + 3) % DATES.length],
        dueOn: DATES[(i * 2 + 4) % DATES.length],
        warehouse: s.warehouse,
        status: ORDER_STATUS[(i + 1) % 3],
        lines: [{ itemId: item.id, requested: pickQty, picked: pickQty - (i % 3 === 1 ? 1 : 0) }],
        modified: DATES[(i * 2 + 4) % DATES.length],
      },
    });
  });
  if (item.build.length && item.stock[0]) {
    const s = item.stock[0];
    const required = int(2, 10);
    entries.push({
      id: `${item.id}-hb`,
      warehouse: s.warehouse,
      action: 'Build Order',
      performed: `Built ${required} units at ${s.location} on`,
      createdBy: 'Lorth Needa',
      date: 'Oct 29, 2026',
      order: {
        number: `BO-${int(30000, 39999)}`,
        createdBy: 'Lorth Needa',
        createdOn: 'Oct 20, 2026',
        dueOn: 'Oct 29, 2026',
        warehouse: s.warehouse,
        status: 'In Process',
        build: { itemId: item.id, required, picked: required - 1 },
        lines: item.build.map(b => ({ itemId: b.itemId, requested: b.quantity * required, picked: b.quantity * (required - 1) })),
        modified: 'Oct 29, 2026',
      },
    });
  }
  if (item.stock[1]) {
    entries.push({
      id: `${item.id}-hadj`,
      warehouse: item.stock[1].warehouse,
      action: 'Adjustment',
      performed: `Counted and adjusted on hand by −2 at ${item.stock[1].location}`,
      createdBy: 'Arihnda Pryce',
      date: 'Sep 22, 2026',
    });
  }
  return entries;
}

type Seed = {
  id: string;
  type: ItemType;
  name: string;
  category: string;
  subcategory: string;
  manufacturer: string;
  model?: string;
  cost: number;
  description: string;
  build?: [string, number][];
  active?: boolean;
  customNumber?: string;
};

const SEEDS: Seed[] = [
  { id: 'PA-0002-AJ89-98HB', type: 'Part', name: 'REC 325 Solar Panel', category: 'Solar Panels', subcategory: 'Monocrystalline', manufacturer: 'REC', model: 'REC325TP2SM72', cost: 168.5, customNumber: '000-134', description: '325 W monocrystalline panel with half-cut cells and a black anodized frame, for residential roofs.' },
  { id: 'PA-0004-5896-4521', type: 'Part', name: 'Hex Bolt', category: 'Fasteners', subcategory: 'Bolts', manufacturer: 'Fastenal', model: 'HB-516-18', cost: 1.24, description: '5/16"-18 × 1" stainless steel hex bolt for rail and foot attachments.' },
  { id: 'PA-7012-6589-2568', type: 'Part', name: 'Flat Bolt', category: 'Fasteners', subcategory: 'Bolts', manufacturer: 'Fastenal', model: 'FB-516-18', cost: 1.12, description: '5/16"-18 × 1" flat head bolt, used where a hex head would block a clamp.' },
  { id: 'PA-0031-LN44-7720', type: 'Part', name: 'Lug Nut', category: 'Fasteners', subcategory: 'Nuts', manufacturer: 'Fastenal', model: 'LN-12-15', cost: 0.86, description: 'Lug nut with an optional set screw, for grounding lugs on rails.' },
  { id: 'PA-0032-HN18-3304', type: 'Part', name: 'Hex Nut', category: 'Fasteners', subcategory: 'Nuts', manufacturer: 'Fastenal', model: 'HN-516-18', cost: 0.98, description: '5/16"-18 stainless steel hex nut.' },
  { id: 'PA-0040-WS10-1188', type: 'Part', name: 'Flat Washer', category: 'Fasteners', subcategory: 'Washers', manufacturer: 'Fastenal', model: 'FW-516', cost: 0.18, description: '5/16" stainless steel flat washer.' },
  { id: 'PA-0105-RL68-2201', type: 'Part', name: 'Aluminum Rail 168"', category: 'Racking', subcategory: 'Rails', manufacturer: 'IronRidge', model: 'XR10-168A', cost: 64.0, description: '168" XR10 mounting rail, clear anodized.' },
  { id: 'PA-0106-MC35-0912', type: 'Part', name: 'Mid Clamp', category: 'Racking', subcategory: 'Clamps', manufacturer: 'IronRidge', model: 'UFO-CL-01', cost: 2.4, description: 'Universal mid clamp for 30–40 mm panel frames.' },
  { id: 'PA-0107-EC35-0913', type: 'Part', name: 'End Clamp', category: 'Racking', subcategory: 'Clamps', manufacturer: 'IronRidge', model: 'UFO-END-01', cost: 2.65, description: 'End clamp with a stopper sleeve for the last panel in a row.' },
  { id: 'PA-0108-LF22-4410', type: 'Part', name: 'L-Foot Flashing', category: 'Racking', subcategory: 'Mounts', manufacturer: 'IronRidge', model: 'FF2-02-B1', cost: 9.75, description: 'Flashing with an L-foot for composition shingle roofs.' },
  { id: 'PA-0210-PV10-5521', type: 'Part', name: '10 AWG PV Wire (500 ft)', category: 'Electrical', subcategory: 'Wire', manufacturer: 'Southwire', model: 'PV10-BK-500', cost: 212.0, description: '500 ft spool of 10 AWG copper PV wire, black, rated 2000 V.' },
  { id: 'PA-0211-MC4P-0040', type: 'Part', name: 'MC4 Connector Pair', category: 'Electrical', subcategory: 'Connectors', manufacturer: 'Stäubli', model: 'MC4-EVO2', cost: 4.1, description: 'Male and female MC4 connectors for 4–6 mm² PV wire.' },
  { id: 'PA-0300-IQ8P-7781', type: 'Part', name: 'Enphase IQ8+ Microinverter', category: 'Inverters', subcategory: 'Microinverters', manufacturer: 'Enphase', model: 'IQ8PLUS-72-2-US', cost: 172.0, description: 'Grid-forming microinverter for 235–440 W panels.' },
  { id: 'PA-0301-SE76-1102', type: 'Part', name: 'SolarEdge SE7600H Inverter', category: 'Inverters', subcategory: 'String Inverters', manufacturer: 'SolarEdge', model: 'SE7600H-US', cost: 1488.0, description: '7.6 kW single-phase HD-Wave string inverter.' },
  { id: 'PA-0400-PW03-8812', type: 'Part', name: 'Powerwall 3 Battery', category: 'Batteries', subcategory: 'Lithium-Ion', manufacturer: 'Tesla', model: '1707000-XX-Y', cost: 8350.0, description: '13.5 kWh home battery with a built-in solar inverter.' },
  { id: 'PA-0120-SHK2-7710', type: 'Part', name: 'Shock Absorber', category: 'Hardware', subcategory: 'Suspension', manufacturer: 'Bilstein', model: 'B6-4600', cost: 46.0, description: 'Gas shock absorber for the service truck fleet.' },
  { id: 'PA-0121-SPR4-7711', type: 'Part', name: 'Coil Spring', category: 'Hardware', subcategory: 'Suspension', manufacturer: 'Bilstein', model: 'CS-2210', cost: 22.5, description: 'Front coil spring paired with the B6 shock.' },
  { id: 'PA-0033-RF60-0044', type: 'Part', name: 'REC 400 Alpha Pure Panel', category: 'Solar Panels', subcategory: 'Monocrystalline', manufacturer: 'REC', model: 'REC400AA', cost: 214.0, active: false, description: '400 W heterojunction panel, replaced by the newer Alpha Pure-R line.' },
  { id: 'AS-0101-SB12-4471', type: 'Assembly', name: 'Shock Build', category: 'Hardware', subcategory: 'Suspension', manufacturer: 'Hub 360', cost: 0, description: 'A shock absorber and coil spring, bolted and ready to fit.', build: [['PA-0120-SHK2-7710', 1], ['PA-0121-SPR4-7711', 1], ['PA-0004-5896-4521', 2], ['PA-0032-HN18-3304', 2]] },
  { id: 'AS-0102-RM40-2290', type: 'Assembly', name: 'Roof Mount Assembly', category: 'Racking', subcategory: 'Roof Mounts', manufacturer: 'Hub 360', cost: 0, description: 'An L-foot flashing with its bolt, washers and nut, pre-assembled for the crews.', build: [['PA-0108-LF22-4410', 1], ['PA-0004-5896-4521', 1], ['PA-0040-WS10-1188', 2], ['PA-0032-HN18-3304', 1]] },
  { id: 'AS-0103-RS16-3381', type: 'Assembly', name: 'Rail Section Assembly', category: 'Racking', subcategory: 'Rails', manufacturer: 'Hub 360', cost: 0, description: 'One 168" rail with the clamps for four panels.', build: [['PA-0105-RL68-2201', 1], ['PA-0106-MC35-0912', 3], ['PA-0107-EC35-0913', 2]] },
  { id: 'AS-0104-WH05-1120', type: 'Assembly', name: 'PV Wire Harness', category: 'Electrical', subcategory: 'Harnesses', manufacturer: 'Hub 360', cost: 0, description: 'A home-run harness cut from PV wire with MC4 ends.', build: [['PA-0210-PV10-5521', 1], ['PA-0211-MC4P-0040', 4]] },
  { id: 'AS-0105-CB20-0091', type: 'Assembly', name: 'Combiner Box Assembly', category: 'Electrical', subcategory: 'Combiner Boxes', manufacturer: 'Hub 360', cost: 0, active: false, description: 'A pre-wired combiner with grounding lugs and its harness.', build: [['PA-0211-MC4P-0040', 4], ['PA-0031-LN44-7720', 6], ['AS-0104-WH05-1120', 1]] },
  { id: 'KT-0201-IK01-5500', type: 'Kit', name: 'Install Kit', category: 'Install Kits', subcategory: 'Residential', manufacturer: 'Hub 360', cost: 0, description: 'Everything a crew needs to mount and wire a standard 10-panel roof.', build: [['AS-0102-RM40-2290', 12], ['AS-0103-RS16-3381', 4], ['PA-0031-LN44-7720', 8], ['AS-0104-WH05-1120', 1]] },
  { id: 'KT-0202-PK10-5501', type: 'Kit', name: '10-Panel Starter Kit', category: 'Install Kits', subcategory: 'Residential', manufacturer: 'Hub 360', cost: 0, description: 'Ten REC 325 panels with microinverters, rails and wiring.', build: [['PA-0002-AJ89-98HB', 10], ['PA-0300-IQ8P-7781', 10], ['AS-0103-RS16-3381', 4], ['AS-0104-WH05-1120', 2]] },
  { id: 'KT-0203-MK00-5502', type: 'Kit', name: 'Maintenance Kit', category: 'Service Kits', subcategory: 'Maintenance', manufacturer: 'Hub 360', cost: 0, description: 'Spare fasteners and connectors for service calls.', build: [['PA-0004-5896-4521', 10], ['PA-0032-HN18-3304', 10], ['PA-0040-WS10-1188', 20], ['PA-0211-MC4P-0040', 2]] },
  { id: 'KT-0204-BK13-5503', type: 'Kit', name: 'Battery Backup Kit', category: 'Install Kits', subcategory: 'Storage', manufacturer: 'Hub 360', cost: 0, description: 'A Powerwall 3 with its wiring for a whole-home backup install.', build: [['PA-0400-PW03-8812', 1], ['AS-0104-WH05-1120', 1], ['PA-0031-LN44-7720', 4]] },
  { id: 'KT-0205-SK02-5504', type: 'Kit', name: 'Shock Service Kit', category: 'Service Kits', subcategory: 'Suspension', manufacturer: 'Hub 360', cost: 0, active: false, description: 'Two shock builds and lug nuts for a truck suspension service.', build: [['AS-0101-SB12-4471', 2], ['PA-0031-LN44-7720', 8]] },
];

const SOLAR_SPECS: Record<string, string> = {
  powerOutput: '325 W',
  efficiency: '19.4 %',
  cellType: 'Mono PERC',
  frame: 'Black anodized aluminum',
  backsheet: 'Black',
  yearOne: '98.0 %',
  degradation: '0.5 %',
  lastYearPower: '86.0 %',
  productionFactor: '1.35',
  maxVoltage: '1,000 V',
  maxReverse: '20 A',
};

/** The base unit and two packs of it, each with its own barcode (Units & Packaging sample). */
function sampleUnits(base: string, weight: number | null, unit: string, perCase: number, casesPerPallet: number): ItemUnit[] {
  const w = (n: number) => (weight == null ? '' : `${(weight * n).toLocaleString('en-US', { maximumFractionDigits: 1 })} ${unit}`);
  const code = () => `6915${String(int(10000000, 99999999))}`;
  return [
    { id: 'u-base', unit: base, contains: 1, uom: base, barcode: code(), weight: w(1) },
    { id: 'u-case', unit: 'Case', contains: perCase, uom: base, barcode: code(), weight: w(perCase) },
    { id: 'u-pallet', unit: 'Pallet', contains: casesPerPallet, uom: 'Case', barcode: code(), weight: w(perCase * casesPerPallet) },
  ];
}

/** A new, empty item of a type (Add Part / Assembly / Kit). */
export function blankItem(type: ItemType, name: string, customNumber = '', extra: Partial<Item> = {}): Item {
  const rand = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  const id = `${TYPE_PREFIX[type]}-${String(Math.floor(Math.random() * 9000) + 1000)}-${rand()}-${rand()}`;
  return {
    id,
    type,
    customNumber,
    name,
    category: '',
    subcategory: '',
    active: true,
    description: '',
    manufacturer: '',
    model: '',
    lotControl: false,
    trackExpiry: false,
    serialized: false,
    nonInventory: false,
    discontinued: false,
    compliance: allCompliance('Not reviewed'),
    countryOfOrigin: '',
    generalSpecs: [],
    units: [{ id: 'u-base', unit: 'Each', contains: 1, uom: 'Each', barcode: '', weight: '' }],
    buyUnit: '',
    sellUnit: '',
    countUnit: '',
    images: [],
    specSheet: '',
    unitType: 'Each (EA)',
    weight: null,
    weightUnit: 'LB',
    length: null,
    width: null,
    height: null,
    dimensionUnit: 'Inches',
    categorySpecs: {},
    packages: {
      pack: { quantity: null, unit: 'Box' },
      case: { quantity: null, unit: 'Case' },
      carton: { quantity: null, unit: 'Carton' },
      bulk: { quantity: null, unit: 'Crate' },
      pallet: { quantity: null, unit: 'Pallet' },
    },
    minQuantity: null,
    safetyStock: null,
    reorderPoint: null,
    leadTime: null,
    autoCalculate: false,
    lastPurchase: { supplier: '', date: '', quantity: null, unitType: 'Each (EA)', cost: null },
    unitCost: 0,
    stock: [],
    build: [],
    warranties: [],
    replacements: [],
    replacementReasons: {},
    suppliers: [],
    notes: [],
    files: [],
    history: [],
    modified: today(),
    ...extra,
  };
}

function fromSeed(s: Seed, i: number): Item {
  const build = (s.build ?? []).map(([itemId, quantity]) => ({ itemId, quantity }));
  const stock = sampleStock(s.id);
  const base = blankItem(s.type, s.name, s.customNumber ?? `${String(100 + i * 7).padStart(3, '0')}-${String(int(100, 999))}`);
  const solar = s.category === 'Solar Panels';
  // Kits are counted as kits, connectors in pairs, wire and cable by the foot (Figma's Items list: Each, Kit, Pair)
  const unitType =
    s.type === 'Kit' ? 'Kit (KT)' : /connector|pair/i.test(s.name) ? 'Pair (PR)' : /\b(wire|cable)\b/i.test(s.name) ? 'Foot (FT)' : 'Each (EA)';
  const weight = +(s.cost > 100 ? 40 + rnd() * 20 : rnd() * 2).toFixed(2);
  const baseUnit = unitLabel(unitType);
  // Panels ship 30 to a pallet; small parts go 50 to a case
  const units = solar ? sampleUnits(baseUnit, weight, 'lbs', 30, 1).filter(u => u.id !== 'u-case').map(u => (u.id === 'u-pallet' ? { ...u, contains: 30, uom: baseUnit } : u)) : sampleUnits(baseUnit, weight, 'lbs', 50, 40);
  return {
    ...base,
    unitType,
    id: s.id,
    category: s.category,
    subcategory: s.subcategory,
    active: s.active ?? true,
    discontinued: s.active === false && s.type === 'Part',
    description: s.description,
    manufacturer: s.manufacturer,
    model: s.model ?? '',
    lotControl: solar || s.category === 'Batteries',
    trackExpiry: s.category === 'Batteries',
    serialized: solar || s.category === 'Inverters' || s.category === 'Batteries',
    // Figma's sample statuses: compliant on the four material standards, Prop 65 needs a warning
    compliance: solar
      ? { ...allCompliance('Compliant'), 'Prop 65': 'Warning required', DFARS: 'Not applicable', VPAR: 'Not reviewed' }
      : { ...allCompliance('Not reviewed'), RoHS: 'Compliant' },
    countryOfOrigin: solar ? 'Singapore' : 'United States',
    generalSpecs: [],
    units,
    buyUnit: units.length > 2 ? 'Case' : units[units.length - 1].unit,
    sellUnit: 'Pack',
    countUnit: 'Pack',
    images: solar ? ['Front View.png', 'Back View.png', 'Junction Box.png', 'Label.png', 'Frame Corner.png', 'Installed.png'] : [],
    specSheet: s.model ? `${s.model} Spec Sheet.pdf` : '',
    weight,
    length: solar ? 65.6 : +(1 + rnd() * 10).toFixed(1),
    width: solar ? 39.4 : +(1 + rnd() * 4).toFixed(1),
    height: solar ? 1.4 : +(0.5 + rnd() * 2).toFixed(1),
    categorySpecs: solar ? { ...SOLAR_SPECS, powerOutput: s.name.includes('400') ? '400 W' : '325 W' } : {},
    packages: {
      pack: { quantity: 10, unit: 'Box' },
      case: { quantity: 50, unit: 'Case' },
      carton: { quantity: 200, unit: 'Carton' },
      bulk: { quantity: 500, unit: 'Crate' },
      pallet: { quantity: 1000, unit: 'Pallet' },
    },
    minQuantity: int(5, 40),
    safetyStock: int(10, 60),
    reorderPoint: int(40, 120),
    leadTime: int(3, 21),
    autoCalculate: rnd() < 0.5,
    lastPurchase: { supplier: pick(SUPPLIERS), date: pick(DATES), quantity: int(50, 500), unitType, cost: s.cost || null },
    unitCost: s.cost,
    stock,
    build,
    warranties:
      s.type === 'Part'
        ? [
            { id: `${s.id}-w1`, kind: 'standard', category: 'Manufacturer', term: solar ? 120 : 12, termUnit: 'Months', document: 'https://www.example.com/warranty', documentKind: 'link' },
            ...(solar
              ? [
                  { id: `${s.id}-w2`, kind: 'standard' as const, category: 'Performance', term: 300, termUnit: 'Months', document: 'Performance Warranty.pdf', documentKind: 'file' as const },
                  {
                    id: `${s.id}-w3`,
                    kind: 'extended' as const,
                    category: 'Workmanship',
                    term: 25,
                    termUnit: 'Years',
                    document: 'Extended Warranty Terms.pdf',
                    documentKind: 'file' as const,
                    offeredByInstaller: true,
                    prices: [
                      { id: `${s.id}-wp1`, type: 'kW', value: 10, unitCost: 120 },
                      { id: `${s.id}-wp2`, type: 'kW', value: 20, unitCost: 95 },
                    ],
                  },
                ]
              : []),
          ]
        : [],
    replacements: s.id === 'PA-0002-AJ89-98HB' ? ['PA-0033-RF60-0044'] : s.id === 'PA-0004-5896-4521' ? ['PA-7012-6589-2568'] : [],
    suppliers: s.type === 'Part' ? sampleSuppliers(s.id, s.name, s.cost) : [],
    notes: sampleNotes(s.id, s.name),
    files: sampleFiles(s.id, s.name),
    history: sampleHistory({ id: s.id, type: s.type, stock, build }),
    modified: pick(DATES),
  };
}

export const SAMPLE_ITEMS: Item[] = SEEDS.map(fromSeed);
// Figma's Replacement Items samples on the REC 325: Hex Bolt and Flat Bolt
SAMPLE_ITEMS[0].replacements = ['PA-0004-5896-4521', 'PA-7012-6589-2568'];
// Figma's reasons: the first is the preferred substitute, the second is offered when the maker is out of stock
for (const item of SAMPLE_ITEMS) {
  const reasons = replacementReasons(item);
  item.replacementReasons = Object.fromEntries(item.replacements.map((id, n) => [id, reasons[Math.min(n, 1)]]));
}
