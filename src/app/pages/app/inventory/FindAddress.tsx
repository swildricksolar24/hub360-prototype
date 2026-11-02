import { useId, useState } from 'react';
import { SearchBar, type SearchResult } from '../../../../components/SearchBar/SearchBar';
import type { AddressDraft } from './AddressFields';
import { CANADA, MEXICO, USA, formatAddress, stateCodesFor, type Warehouse } from './warehouseData';
import styles from './addressFields.module.css';

type KnownAddress = Pick<Warehouse, 'address1' | 'address2' | 'exteriorNumber' | 'interiorNumber' | 'colonia' | 'city' | 'state' | 'zip' | 'country'>;

const us = (address1: string, city: string, state: string, zip: string, address2?: string): KnownAddress => ({ address1, address2, city, state, zip, country: USA });
const ca = (address1: string, city: string, state: string, zip: string, address2?: string): KnownAddress => ({ address1, address2, city, state, zip, country: CANADA });
const mx = (address1: string, exteriorNumber: string, colonia: string, zip: string, city: string, state: string, interiorNumber?: string): KnownAddress => ({
  address1,
  exteriorNumber,
  interiorNumber,
  colonia,
  zip,
  city,
  state,
  country: MEXICO,
});

/** The prototype's address lookup: a short list of commercial addresses standing in for an address service. */
const KNOWN_ADDRESSES: KnownAddress[] = [
  us('11565 W Summertime', 'Phoenix', 'AZ', '85085', 'Suite 2'),
  us('2045 W Deer Valley Rd', 'Phoenix', 'AZ', '85027'),
  us('4440 E Broadway Rd', 'Phoenix', 'AZ', '85040'),
  us('1450 S Alma School Rd', 'Mesa', 'AZ', '85210'),
  us('1700 W University Dr', 'Tempe', 'AZ', '85281'),
  us('2600 S Arizona Ave', 'Chandler', 'AZ', '85286'),
  us('3150 E Williams Field Rd', 'Gilbert', 'AZ', '85295'),
  us('4100 S Palo Verde Rd', 'Tucson', 'AZ', '85714'),
  us('2800 E Huntington Dr', 'Flagstaff', 'AZ', '86004'),
  us('6255 S Sandhill Rd', 'Las Vegas', 'NV', '89120'),
  us('3401 Pan American Fwy NE', 'Albuquerque', 'NM', '87107'),
  us('4220 W 2100 S', 'Salt Lake City', 'UT', '84120'),
  us('5300 Peoria St', 'Denver', 'CO', '80239'),
  us('9330 Kearny Mesa Rd', 'San Diego', 'CA', '92126'),
  us('2100 Iowa Ave', 'Riverside', 'CA', '92507', 'Bldg C'),
  us('1201 Commerce St', 'Dallas', 'TX', '75202'),
  ca('100 King St W', 'Toronto', 'ON', 'M5X 1A9', 'Suite 400'),
  ca('2800 Skymark Ave', 'Mississauga', 'ON', 'L4W 5A6'),
  ca('8400 Rue Jarry E', 'Montréal', 'QC', 'H1J 1H8'),
  ca('11604 Bridgeport Rd', 'Richmond', 'BC', 'V6X 1T5'),
  ca('5004 72 Ave SE', 'Calgary', 'AB', 'T2C 4X3'),
  mx('Av. Paseo de la Reforma', '222', 'Juárez', '06600', 'Cuauhtémoc', 'CDMX', '5'),
  mx('Blvd. Agua Caliente', '4558', 'Aviación', '22014', 'Tijuana', 'BC'),
  mx('Av. Constitución', '1500', 'Centro', '64000', 'Monterrey', 'NL'),
  mx('Av. Vallarta', '6503', 'Ciudad Granja', '45010', 'Zapopan', 'JAL'),
  mx('Blvd. Luis Encinas', '305', 'Centro', '83000', 'Hermosillo', 'SON'),
];

const lineOf = (a: KnownAddress) => formatAddress({ ...a, id: '', code: '', name: '', value: 0, locations: 0, filled: 0, active: true });

/**
 * Figma "Add Warehouse › Find address" (826:57894): a search over known addresses in the chosen country. Picking one
 * fills the address fields under it (street, unit, city, state or province, postal code, and Mexico's numbers and
 * colonia), which stay editable.
 */
export function FindAddress({ draft, onPick }: { draft: AddressDraft; onPick: (address: Partial<AddressDraft>) => void }) {
  const id = useId();
  const [query, setQuery] = useState('');
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = words.length
    ? KNOWN_ADDRESSES.filter(a => a.country === draft.country && words.every(w => lineOf(a).toLowerCase().includes(w))).slice(0, 6)
    : [];
  const results: SearchResult[] = matches.map((a, i) => ({
    id: String(i),
    // The street on the first line, the rest of the address (unit, city, state, postal code) under it
    name: [a.address1, a.exteriorNumber].filter(Boolean).join(' '),
    description: lineOf({ ...a, address1: '', exteriorNumber: '' }),
  }));

  function pick(a: KnownAddress) {
    // The draft keeps the state's name; the list stores its code
    const stateName = Object.entries(stateCodesFor(a.country)).find(([, code]) => code === a.state)?.[0] ?? '';
    onPick({
      address1: a.address1,
      address2: a.address2 ?? '',
      exteriorNumber: a.exteriorNumber ?? '',
      interiorNumber: a.interiorNumber ?? '',
      colonia: a.colonia ?? '',
      city: a.city,
      state: stateName,
      zip: a.zip,
    });
    setQuery('');
  }

  return (
    // Enter here picks an address; it never submits the surrounding form
    <div className={styles.find} onKeyDown={e => e.key === 'Enter' && e.preventDefault()}>
      <label htmlFor={id} className={styles.findLabel}>
        Find address
      </label>
      <SearchBar
        id={id}
        aria-label="Find address"
        placeholder="Start typing an address to fill the fields below"
        value={query}
        onChange={setQuery}
        results={results}
        onSelect={r => pick(matches[Number(r.id)])}
        onSubmit={() => matches[0] && pick(matches[0])}
      />
    </div>
  );
}
