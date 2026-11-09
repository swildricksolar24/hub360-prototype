import { CANADA, MEXICO, type Warehouse } from './warehouseData';

/**
 * The time zones a warehouse can be in (Warehouse Details › Time Zone), named the way Figma writes them,
 * e.g. "Mountain Time (Arizona, no DST)".
 */
export const TIME_ZONES = [
  'Newfoundland Time',
  'Atlantic Time',
  'Eastern Time',
  'Eastern Time (Quintana Roo, no DST)',
  'Central Time',
  'Central Time (Mexico, no DST)',
  'Central Time (Saskatchewan, no DST)',
  'Mountain Time',
  'Mountain Time (Arizona, no DST)',
  'Mountain Time (Sonora, no DST)',
  'Mountain Time (Yukon, no DST)',
  'Mexican Pacific Time (no DST)',
  'Pacific Time',
  'Alaska Time',
  'Hawaii Time (no DST)',
];

// The zone most of each state or province is in, by its address code (warehouseData's STATE_CODES and friends)
const US: Record<string, string> = {
  ...Object.fromEntries('CT DE FL GA IN KY ME MD MA MI NH NJ NY NC OH PA RI SC VT VA WV'.split(' ').map(c => [c, 'Eastern Time'])),
  ...Object.fromEntries('AL AR IL IA KS LA MN MS MO NE ND OK SD TN TX WI'.split(' ').map(c => [c, 'Central Time'])),
  ...Object.fromEntries('CO ID MT NM UT WY'.split(' ').map(c => [c, 'Mountain Time'])),
  ...Object.fromEntries('CA NV OR WA'.split(' ').map(c => [c, 'Pacific Time'])),
  AZ: 'Mountain Time (Arizona, no DST)',
  AK: 'Alaska Time',
  HI: 'Hawaii Time (no DST)',
};
const CA: Record<string, string> = {
  BC: 'Pacific Time',
  AB: 'Mountain Time',
  NT: 'Mountain Time',
  YT: 'Mountain Time (Yukon, no DST)',
  SK: 'Central Time (Saskatchewan, no DST)',
  MB: 'Central Time',
  ON: 'Eastern Time',
  QC: 'Eastern Time',
  NU: 'Eastern Time',
  NB: 'Atlantic Time',
  NS: 'Atlantic Time',
  PE: 'Atlantic Time',
  NL: 'Newfoundland Time',
};
const MX: Record<string, string> = {
  BC: 'Pacific Time',
  BCS: 'Mexican Pacific Time (no DST)',
  SIN: 'Mexican Pacific Time (no DST)',
  NAY: 'Mexican Pacific Time (no DST)',
  SON: 'Mountain Time (Sonora, no DST)',
  QROO: 'Eastern Time (Quintana Roo, no DST)',
};

/** The time zone a warehouse's address is in, from its country and state code. */
export function defaultTimeZone(w: Pick<Warehouse, 'country' | 'state'>) {
  if (w.country === MEXICO) return MX[w.state] ?? 'Central Time (Mexico, no DST)';
  if (w.country === CANADA) return CA[w.state] ?? 'Eastern Time';
  return US[w.state] ?? 'Eastern Time';
}

/** The warehouse's chosen time zone, or the one its address is in. */
export const timeZoneOf = (w: Pick<Warehouse, 'country' | 'state' | 'timeZone'>) => w.timeZone || defaultTimeZone(w);
