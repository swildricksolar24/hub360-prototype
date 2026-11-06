import type { ReactNode } from 'react';
import { Dropdown } from '../../../../components/Dropdown/Dropdown';
import { TextInput } from '../../../../components/TextInput/TextInput';
import { CANADA, MEXICO, USA, stateCodesFor, type Warehouse } from './warehouseData';
import styles from './addressFields.module.css';

/** A warehouse address while it's being edited. `state` holds the state's name; it becomes its code on save. */
export type AddressDraft = {
  country: string;
  address1: string;
  address2: string;
  exteriorNumber: string;
  interiorNumber: string;
  colonia: string;
  city: string;
  state: string;
  zip: string;
};
export type AddressErrors = Partial<Record<keyof AddressDraft, string>>;

const stateNameOf = (country: string, code: string) => Object.entries(stateCodesFor(country)).find(([, c]) => c === code)?.[0] ?? '';

/** The editable address of a warehouse (or an empty one). */
export function addressDraftOf(w: Warehouse | null, country = 'United States of America'): AddressDraft {
  const c = w?.country ?? country;
  return {
    country: c,
    address1: w?.address1 ?? '',
    address2: w?.address2 ?? '',
    exteriorNumber: w?.exteriorNumber ?? '',
    interiorNumber: w?.interiorNumber ?? '',
    colonia: w?.colonia ?? '',
    city: w?.city ?? '',
    state: w ? stateNameOf(c, w.state) : '',
    zip: w?.zip ?? '',
  };
}

/** Switching country keeps the street, city and postal code, and clears a state that isn't in the new country. */
export function withCountry(d: AddressDraft, country: string): AddressDraft {
  return { ...d, country, state: d.state in stateCodesFor(country) ? d.state : '' };
}

/** A Canadian postal code: letter-digit-letter, space, digit-letter-digit (Canada Post never uses D F I O Q U, or W / Z first). */
const CA_POSTAL = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] \d[ABCEGHJ-NPRSTV-Z]\d$/;

/** Types a Canadian postal code the way Canada Post writes it: uppercase, with the space after the third character. */
export const formatCanadianPostal = (value: string) => {
  const raw = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  return raw.length > 3 ? `${raw.slice(0, 3)} ${raw.slice(3)}` : raw;
};

/**
 * Each country's required address parts:
 * - Mexico (as Correos de México expects them): street, número exterior, colonia, a five-digit código postal, municipio
 *   and estado.
 * - Canada (as Canada Post expects them): street address, city, province or territory, and a postal code like A1A 1A1.
 * - United States: Address 1, city, state, and a ZIP code (12345 or ZIP+4, 12345-6789). Address 2 stays optional.
 * - Other countries keep the address optional.
 */
export function addressErrors(d: AddressDraft): AddressErrors {
  const e: AddressErrors = {};
  if (d.country === USA) {
    if (!d.address1.trim()) e.address1 = 'Enter the street address';
    if (!d.city.trim()) e.city = 'Enter the city';
    if (!d.state) e.state = 'Choose the state';
    if (!/^\d{5}(-\d{4})?$/.test(d.zip.trim())) e.zip = 'Enter a 5-digit ZIP code';
  } else if (d.country === MEXICO) {
    if (!d.address1.trim()) e.address1 = 'Enter the street';
    if (!d.exteriorNumber.trim()) e.exteriorNumber = 'Enter the exterior #';
    if (!d.colonia.trim()) e.colonia = 'Enter the colonia';
    if (!/^\d{5}$/.test(d.zip.trim())) e.zip = 'Enter the 5-digit código postal';
    if (!d.city.trim()) e.city = 'Enter the municipality';
    if (!d.state) e.state = 'Choose the state';
  } else if (d.country === CANADA) {
    if (!d.address1.trim()) e.address1 = 'Enter the street address';
    if (!d.city.trim()) e.city = 'Enter the city';
    if (!d.state) e.state = 'Choose the province or territory';
    if (!CA_POSTAL.test(d.zip.trim())) e.zip = 'Enter a postal code like A1A 1A1';
  }
  return e;
}

/** The address fields as stored on a warehouse. */
export function addressFromDraft(d: AddressDraft): Pick<Warehouse, 'country' | 'address1' | 'address2' | 'exteriorNumber' | 'interiorNumber' | 'colonia' | 'city' | 'state' | 'zip'> {
  const mexico = d.country === MEXICO;
  return {
    country: d.country,
    address1: d.address1.trim(),
    address2: mexico ? undefined : d.address2.trim() || undefined,
    exteriorNumber: mexico ? d.exteriorNumber.trim() || undefined : undefined,
    interiorNumber: mexico ? d.interiorNumber.trim() || undefined : undefined,
    colonia: mexico ? d.colonia.trim() || undefined : undefined,
    city: d.city.trim(),
    state: stateCodesFor(d.country)[d.state] ?? '',
    zip: d.zip.trim(),
  };
}

const required = (text: string): ReactNode => (
  <>
    {text} <span className={styles.requiredMark}>*</span>
  </>
);

/**
 * Browser autofill (Chrome's saved addresses) can't fill the State dropdown, a custom control, so this hidden native
 * select takes the state from autofill (`address-level1`) and sets the dropdown. It stays out of the tab order and away
 * from screen readers; the dropdown remains the field people use.
 */
function StateAutofill({ country, state, onChange }: { country: string; state: string; onChange: (state: string) => void }) {
  const codes = stateCodesFor(country);
  return (
    <select
      className={styles.autofillOnly}
      autoComplete="address-level1"
      tabIndex={-1}
      aria-hidden
      value={codes[state] ?? ''}
      onChange={e => {
        const name = Object.entries(codes).find(([, code]) => code === e.target.value)?.[0];
        if (name) onChange(name);
      }}
    >
      <option value="" />
      {Object.entries(codes).map(([name, code]) => (
        <option key={code} value={code}>
          {name}
        </option>
      ))}
    </select>
  );
}

/**
 * A warehouse's address fields, laid out the way the selected country writes addresses. Each field carries its HTML
 * autofill type, so picking a saved address in the browser fills the street, unit, city, state and postal code. The country field itself
 * stays with the form, since each form places it differently.
 * - United States: Address 1, Address 2, then City · State · Zip Code.
 * - Canada: Street Address, Unit / Suite, then City · Province / Territory (the 13) · Postal Code (A1A 1A1).
 * - Mexico: Street · Exterior # · Interior #, then Colonia · C.P., then Municipality · State (the 32 states).
 */
export function AddressFields({
  draft,
  onChange,
  errors = {},
}: {
  draft: AddressDraft;
  onChange: (draft: AddressDraft) => void;
  /** Shown under each field (pass them once the user has tried to save). */
  errors?: AddressErrors;
}) {
  const set = (key: keyof AddressDraft) => (value: string) => onChange({ ...draft, [key]: value });
  const stateOptions = Object.keys(stateCodesFor(draft.country)).map(s => ({ value: s, label: s }));
  const stateAutofill = <StateAutofill country={draft.country} state={draft.state} onChange={set('state')} />;

  if (draft.country === MEXICO) {
    return (
      <>
        <div className={styles.street}>
          <TextInput label={required('Street (Calle)')} autoComplete="address-line1" value={draft.address1} onChange={e => set('address1')(e.target.value)} error={errors.address1} required />
          <TextInput label={required('Exterior # (Núm. ext.)')} value={draft.exteriorNumber} onChange={e => set('exteriorNumber')(e.target.value)} error={errors.exteriorNumber} required />
          <TextInput label="Interior # (Núm. int.)" value={draft.interiorNumber} onChange={e => set('interiorNumber')(e.target.value)} />
        </div>
        <div className={styles.wideNarrow}>
          <TextInput label={required('Neighborhood (Colonia)')} autoComplete="address-level3" value={draft.colonia} onChange={e => set('colonia')(e.target.value)} error={errors.colonia} required />
          <TextInput
            label={required('Postal Code (C.P.)')}
            autoComplete="postal-code"
            inputMode="numeric"
            maxLength={5}
            value={draft.zip}
            onChange={e => set('zip')(e.target.value.replace(/\D/g, ''))}
            error={errors.zip}
            required
          />
        </div>
        <div className={styles.halves}>
          <TextInput label={required('Municipality (Municipio / Alcaldía)')} autoComplete="address-level2" value={draft.city} onChange={e => set('city')(e.target.value)} error={errors.city} required />
          <Dropdown label="State (Estado) *" placeholder="Select" options={stateOptions} value={draft.state || null} onChange={v => set('state')(v as string)} error={errors.state} required />
        </div>
        {stateAutofill}
      </>
    );
  }

  if (draft.country === CANADA) {
    return (
      <>
        <div className={styles.halves}>
          <TextInput label={required('Street Address')} autoComplete="address-line1" value={draft.address1} onChange={e => set('address1')(e.target.value)} error={errors.address1} required />
          <TextInput label="Unit / Suite" autoComplete="address-line2" value={draft.address2} onChange={e => set('address2')(e.target.value)} />
        </div>
        <div className={styles.thirds}>
          <TextInput label={required('City')} autoComplete="address-level2" value={draft.city} onChange={e => set('city')(e.target.value)} error={errors.city} required />
          <Dropdown label="Province / Territory *" placeholder="Select" options={stateOptions} value={draft.state || null} onChange={v => set('state')(v as string)} error={errors.state} required />
          <TextInput
            label={required('Postal Code')}
            autoComplete="postal-code"
            autoCapitalize="characters"
            maxLength={7}
            value={draft.zip}
            onChange={e => set('zip')(formatCanadianPostal(e.target.value))}
            error={errors.zip}
            required
          />
        </div>
        {stateAutofill}
      </>
    );
  }

  // United States: Address 1, City, State and Zip Code are required (Address 2, the suite or unit, stays optional)
  return (
    <>
      <div className={styles.halves}>
        <TextInput label={required('Address 1')} autoComplete="address-line1" value={draft.address1} onChange={e => set('address1')(e.target.value)} error={errors.address1} required />
        <TextInput label="Address 2" autoComplete="address-line2" value={draft.address2} onChange={e => set('address2')(e.target.value)} />
      </div>
      <div className={styles.thirds}>
        <TextInput label={required('City')} autoComplete="address-level2" value={draft.city} onChange={e => set('city')(e.target.value)} error={errors.city} required />
        <Dropdown label="State *" placeholder="Select" options={stateOptions} value={draft.state || null} onChange={v => set('state')(v as string)} error={errors.state} required />
        <TextInput
          label={required('Zip Code')}
          autoComplete="postal-code"
          inputMode="numeric"
          maxLength={10}
          value={draft.zip}
          onChange={e => set('zip')(e.target.value.replace(/[^\d-]/g, ''))}
          error={errors.zip}
          required
        />
      </div>
      {stateAutofill}
    </>
  );
}
