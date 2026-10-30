/** Sample data and field definitions for Inventory › Warehouses (see WAREHOUSES.md). In memory, like the rest of the prototype. */

export type Warehouse = {
  id: string;
  code: string;
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  value: number;
  locations: number;
  filled: number;
  active: boolean;
};

export const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const count = (n: number) => n.toLocaleString('en-US');

/** A field a table column (or an uploaded spreadsheet column) can show. `align` follows the Figma table. */
export type WarehouseField = {
  key: string;
  label: string;
  width: number | 'fill';
  align?: 'start' | 'end';
  /** Text shown in the table. */
  show: (w: Warehouse) => string;
  /** Value used for sorting and searching. */
  sortValue: (w: Warehouse) => string | number;
};

export const FIELDS: WarehouseField[] = [
  { key: 'code', label: 'Code', width: 120, show: w => w.code, sortValue: w => w.code },
  { key: 'name', label: 'Name', width: 160, show: w => w.name, sortValue: w => w.name },
  {
    key: 'address',
    label: 'Address',
    width: 'fill',
    // Only the parts that are filled in, e.g. "11565 W Summertime, Phoenix, AZ 85085"
    show: w => [w.address1, w.address2, w.city, `${w.state} ${w.zip}`.trim()].filter(Boolean).join(', '),
    sortValue: w => `${w.address1} ${w.city}`,
  },
  { key: 'city', label: 'City', width: 140, show: w => w.city, sortValue: w => w.city },
  { key: 'state', label: 'State', width: 100, show: w => w.state, sortValue: w => w.state },
  { key: 'zip', label: 'Zip Code', width: 110, show: w => w.zip, sortValue: w => w.zip },
  { key: 'country', label: 'Country', width: 180, show: w => w.country, sortValue: w => w.country },
  { key: 'value', label: 'Inventory Value', width: 185, show: w => money(w.value), sortValue: w => w.value },
  { key: 'locations', label: 'Locations', width: 140, show: w => count(w.locations), sortValue: w => w.locations },
  { key: 'filled', label: 'Filled Locations', width: 185, show: w => count(w.filled), sortValue: w => w.filled },
  { key: 'empty', label: 'Empty', width: 130, show: w => count(w.locations - w.filled), sortValue: w => w.locations - w.filled },
];

export const fieldByKey = (key: string) => FIELDS.find(f => f.key === key);

/** The Figma table's columns, in order: the "All" view. */
export const DEFAULT_COLUMNS = ['code', 'name', 'address', 'value', 'locations', 'filled', 'empty'];

/** A saved column layout from Edit Columns. */
export type SavedView = { name: string; columns: string[]; frozen: string[]; modified: string };

export const SAMPLE_VIEWS: SavedView[] = [
  { name: 'WH Pref 261006', columns: ['code', 'name', 'city', 'state', 'value', 'empty'], frozen: ['code', 'name'], modified: 'May 18, 2026' },
];

const W = (
  code: string,
  name: string,
  address1: string,
  city: string,
  state: string,
  zip: string,
  value: number,
  locations: number,
  filled: number,
  active = true,
): Warehouse => ({ id: code, code, name, address1, city, state, zip, country: 'United States of America', value, locations, filled, active });

export const SAMPLE_WAREHOUSES: Warehouse[] = [
  W('PHX-124', 'Phoenix WH', '11565 W Summertime', 'Phoenix', 'AZ', '85085', 1250569.32, 542, 478),
  W('PHX-125', 'Tucson WH', '92235 N Longmore', 'Gilbert', 'AZ', '85209', 988015.02, 252, 208, false),
  W('PHX-126', 'Phoenix North', '2045 W Deer Valley Rd', 'Phoenix', 'AZ', '85027', 2104330.5, 860, 812),
  W('MES-201', 'Mesa Central', '1450 S Alma School Rd', 'Mesa', 'AZ', '85210', 1678204.18, 640, 571),
  W('MES-202', 'Mesa East', '9310 E Baseline Rd', 'Mesa', 'AZ', '85209', 734912.4, 310, 244),
  W('TEM-301', 'Tempe Hub', '1700 W University Dr', 'Tempe', 'AZ', '85281', 1932770.65, 720, 698),
  W('TEM-302', 'Tempe South', '8825 S Kyrene Rd', 'Tempe', 'AZ', '85284', 455180.0, 188, 96, false),
  W('GIL-401', 'Gilbert Yard', '3150 E Williams Field Rd', 'Gilbert', 'AZ', '85295', 866402.77, 402, 359),
  W('CHD-501', 'Chandler WH', '2600 S Arizona Ave', 'Chandler', 'AZ', '85286', 1341908.93, 515, 488),
  W('SCO-601', 'Scottsdale Depot', '7500 E Butherus Dr', 'Scottsdale', 'AZ', '85260', 592340.1, 230, 171),
  W('GLN-701', 'Glendale WH', '5850 W Bell Rd', 'Glendale', 'AZ', '85308', 1102256.44, 480, 433),
  W('PEO-801', 'Peoria Annex', '8400 W Thunderbird Rd', 'Peoria', 'AZ', '85381', 318790.0, 140, 62, false),
  W('TUC-901', 'Tucson Main', '4100 S Palo Verde Rd', 'Tucson', 'AZ', '85714', 1588412.2, 610, 590),
  W('TUC-902', 'Tucson East', '7020 E Golf Links Rd', 'Tucson', 'AZ', '85730', 702113.58, 296, 230),
  W('FLG-110', 'Flagstaff WH', '2800 E Huntington Dr', 'Flagstaff', 'AZ', '86004', 411009.9, 175, 141),
  W('YUM-120', 'Yuma Depot', '2550 E 32nd St', 'Yuma', 'AZ', '85365', 275640.0, 120, 77),
  W('PRE-130', 'Prescott WH', '1100 Commerce Dr', 'Prescott', 'AZ', '86305', 198220.45, 96, 52, false),
  W('LV-210', 'Las Vegas WH', '6255 S Sandhill Rd', 'Las Vegas', 'NV', '89120', 1450776.0, 580, 541),
  W('LV-211', 'Henderson Yard', '871 Coronado Center Dr', 'Henderson', 'NV', '89052', 663902.31, 270, 198),
  W('ABQ-310', 'Albuquerque WH', '3401 Pan American Fwy NE', 'Albuquerque', 'NM', '87107', 877451.6, 360, 301),
  W('SLC-410', 'Salt Lake WH', '4220 W 2100 S', 'Salt Lake City', 'UT', '84120', 1209875.05, 498, 455),
  W('DEN-510', 'Denver WH', '5300 Peoria St', 'Denver', 'CO', '80239', 1788320.0, 700, 662),
  W('SD-610', 'San Diego WH', '9330 Kearny Mesa Rd', 'San Diego', 'CA', '92126', 2240115.7, 910, 870),
  W('RIV-620', 'Riverside WH', '2100 Iowa Ave', 'Riverside', 'CA', '92507', 941205.12, 380, 312, false),
];

/** Headers in the downloadable template (public/templates/warehouses-template.csv). */
export const TEMPLATE_HEADERS = ['Code', 'Name', 'Address 1', 'Address 2', 'City', 'State', 'Zip Code', 'Country', 'Inventory Value', 'Locations', 'Filled Locations'];

/** Fields an uploaded column can map to (Map Columns), matching the template's headers. */
export const IMPORT_FIELDS = [
  'Code',
  'Name',
  'Address 1',
  'Address 2',
  'City',
  'State',
  'Zip Code',
  'Country',
  'Inventory Value',
  'Locations',
  'Filled Locations',
];

export const COUNTRIES = ['United States of America', 'Canada', 'Mexico'];
export const STATES = ['Arizona', 'California', 'Colorado', 'Nevada', 'New Mexico', 'Texas', 'Utah'];
export const STATE_CODES: Record<string, string> = {
  Arizona: 'AZ',
  California: 'CA',
  Colorado: 'CO',
  Nevada: 'NV',
  'New Mexico': 'NM',
  Texas: 'TX',
  Utah: 'UT',
};
