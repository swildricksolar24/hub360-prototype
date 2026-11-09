import { useEffect, useState, type ReactNode } from 'react';
import { Checkbox } from '../../../../../components/Checkbox/Checkbox';
import { Tag } from '../../../../../components/Tag/Tag';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { TextArea } from '../../../../../components/TextArea/TextArea';
import { TextInput } from '../../../../../components/TextInput/TextInput';
import { Toggle } from '../../../../../components/Toggle/Toggle';
import { AppModal } from '../../../../components/AppModal';
import { LOCATION_TYPES, MAX_LOCATION_DEPTH, type WarehouseLocation } from '../warehouseRecordData';
import { STATUS_INFO, codeOf, depthOf, descendantIds, nextCode, pathOf } from './locationTree';
import { CheckboxWithInfo } from './tableKit';
import styles from '../record.module.css';

export type LocationFields = Omit<WarehouseLocation, 'id' | 'active'>;

const required = (text: string): ReactNode => (
  <>
    {text} <span className={styles.requiredMark}>*</span>
  </>
);
const requiredNote = (
  <span className="text-small-regular">
    <span className={styles.requiredMark}>*</span>Indicates required field
  </span>
);
const EMPTY: LocationFields = { name: '', description: '', type: '', frozen: false, nonPickable: false, empty: false, parentId: null };

/** Locations that can take a sublocation (above the 4th level), labeled with their path, e.g. "Area A › Shelf 1". */
export const parentOptions = (locations: WarehouseLocation[]) =>
  locations.filter(l => depthOf(locations, l.id) < MAX_LOCATION_DEPTH).map(l => ({ value: l.id, label: pathOf(locations, l.id) }));

/**
 * Figma "Add Location" (80:10747) and its sublocation version (562:3249): the parent (sublocations only), name, type,
 * description and the three status options. The status checkboxes start unchecked (Figma draws them checked).
 */
export function LocationFormModal({
  open,
  sublocation,
  parentId,
  locations,
  onClose,
  onCreate,
}: {
  open: boolean;
  /** Add Sublocation: asks for the parent location first. */
  sublocation: boolean;
  /** The parent to start from (e.g. the row's ⊕ in Structure). */
  parentId?: string | null;
  locations: WarehouseLocation[];
  onClose: () => void;
  onCreate: (fields: LocationFields) => void;
}) {
  const [form, setForm] = useState<LocationFields>(EMPTY);
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (!open) return;
    setTried(false);
    setForm({ ...EMPTY, parentId: sublocation ? (parentId ?? null) : null });
  }, [open, sublocation, parentId]);

  const set = <K extends keyof LocationFields>(key: K) => (value: LocationFields[K]) => setForm(f => ({ ...f, [key]: value }));
  const word = sublocation ? 'Sublocation' : 'Location';
  const name = form.name.trim().toLowerCase();
  const errors = {
    parentId: sublocation && !form.parentId ? 'Choose the location this one sits in' : undefined,
    name: !name
      ? `Enter a ${word.toLowerCase()} name`
      : locations.some(l => l.parentId === form.parentId && l.name.toLowerCase() === name)
        ? `There’s already a location named “${form.name.trim()}” here`
        : undefined,
  };

  function save() {
    setTried(true);
    if (errors.parentId || errors.name) return;
    onCreate({ ...form, name: form.name.trim(), description: form.description.trim() });
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={`Add ${word}`}
      description={requiredNote}
      primaryAction={{ label: `Create ${word}`, onClick: save }}
    >
      <form
        className={styles.form}
        noValidate
        onSubmit={e => {
          e.preventDefault();
          save();
        }}
      >
        {sublocation && (
          <Dropdown
            label="Location *"
            placeholder="Select"
            options={parentOptions(locations)}
            value={form.parentId}
            onChange={v => set('parentId')(v as string)}
            error={tried ? errors.parentId : undefined}
            required
          />
        )}
        <div className={styles.wideNarrow}>
          <TextInput
            label={required(`${word} Name`)}
            value={form.name}
            onChange={e => set('name')(e.target.value)}
            error={tried ? errors.name : undefined}
            autoComplete="off"
            required
          />
          <Dropdown label="Type" placeholder="Select" options={LOCATION_TYPES.map(t => ({ value: t, label: t }))} value={form.type || null} onChange={v => set('type')(v as string)} />
        </div>
        <TextArea label="Description" value={form.description} onChange={e => set('description')(e.target.value)} />
        <fieldset className={styles.checkGroup}>
          <legend className={styles.subHeading}>Status Options</legend>
          <div className={styles.checkRow}>
            <CheckboxWithInfo label="Frozen" info={STATUS_INFO.frozen} checked={form.frozen} onChange={set('frozen')} />
            <CheckboxWithInfo label="Non-Pickable" info={STATUS_INFO.nonPickable} checked={form.nonPickable} onChange={set('nonPickable')} />
            <CheckboxWithInfo label="Empty" info={STATUS_INFO.empty} checked={form.empty} onChange={set('empty')} />
          </div>
        </fieldset>
        <button type="submit" hidden />
      </form>
    </AppModal>
  );
}

/** Asks before a location is removed; its sublocations and the stock records in them go with it. */
export function RemoveLocationModal({
  location,
  locations,
  stockCount,
  onClose,
  onConfirm,
}: {
  location: WarehouseLocation | null;
  locations: WarehouseLocation[];
  /** Stock records in the location and its sublocations. */
  stockCount: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const subs = location ? descendantIds(locations, location.id).length : 0;
  const also = [subs && `${subs === 1 ? 'its sublocation' : `its ${subs} sublocations`}`, stockCount && `${stockCount === 1 ? '1 stock record' : `${stockCount} stock records`}`]
    .filter(Boolean)
    .join(' and ');
  return (
    <AppModal
      open={location !== null}
      onClose={onClose}
      title="Remove location?"
      description={location && `${location.name} will be removed from this warehouse${also ? `, along with ${also}` : ''}. This action cannot be undone.`}
      primaryAction={{ label: 'Remove Location', danger: true, onClick: onConfirm }}
    />
  );
}

/* ---------- Add Location (Figma 872:53690 one location, 857:28408 range) ---------- */

/**
 * Add Location: the parent (or the top level), type, description, then one location or a numbered range (a name
 * prefix with From and To), a capacity, the Frozen / Non-pickable rules and whether to print barcode labels. The
 * codes come from the parent's code; the preview shows what will be created.
 */
export function AddLocationsModal({
  open,
  parentId,
  locations,
  warehouseName,
  onClose,
  onCreate,
}: {
  open: boolean;
  /** The parent to start from (a row's +); null or undefined starts at the top level. */
  parentId?: string | null;
  locations: WarehouseLocation[];
  warehouseName: string;
  onClose: () => void;
  /** The new locations, in order, and whether to print their barcode labels. */
  onCreate: (fields: LocationFields[], printLabels: boolean) => void;
}) {
  const [parent, setParent] = useState<string>('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [range, setRange] = useState(false);
  const [prefix, setPrefix] = useState('');
  const [from, setFrom] = useState('01');
  const [to, setTo] = useState('10');
  const [capacity, setCapacity] = useState('');
  const [frozen, setFrozen] = useState(false);
  const [nonPickable, setNonPickable] = useState(false);
  const [printLabels, setPrintLabels] = useState(true);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!open) return;
    setParent(parentId ?? '');
    const p = parentId ? locations.find(l => l.id === parentId) : undefined;
    // A bin under a shelf, a shelf under an aisle…: start from the type one level down
    const below: Record<string, string> = { Zone: 'Aisle', Aisle: 'Shelf', Rack: 'Shelf', Shelf: 'Bin', Shelves: 'Bin' };
    const t = p ? (below[p.type] ?? 'Bin') : 'Zone';
    setType(t);
    setPrefix(t);
    setDescription('');
    setRange(false);
    setFrom('01');
    setTo('10');
    setCapacity('');
    setFrozen(false);
    setNonPickable(false);
    setPrintLabels(true);
    setTried(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, parentId]);

  const parentIdValue = parent || null;
  const siblings = locations.filter(l => l.parentId === parentIdValue).length;
  const width = Math.max(from.trim().length, 2);
  const a = Number(from);
  const b = Number(to);
  const rangeError = !range ? undefined : !/^\d+$/.test(from.trim()) || !/^\d+$/.test(to.trim()) ? 'Use whole numbers' : b < a ? 'To must be at or after From' : b - a >= 100 ? 'Up to 100 at a time' : undefined;
  const count = range && !rangeError ? b - a + 1 : 1;
  const names = range && !rangeError ? Array.from({ length: count }, (_, i) => `${prefix.trim()} ${String(a + i).padStart(width, '0')}`) : [prefix.trim()];
  const parentCode = parentIdValue ? codeOf(locations, parentIdValue) : '';
  const codes =
    range && !rangeError
      ? names.map((_, i) => (parentIdValue ? `${parentCode}-${String(a + i).padStart(2, '0')}` : nextCode(locations, null, siblings + 1 + i)))
      : [nextCode(locations, parentIdValue, siblings + 1)];
  const codeText = codes.length > 1 ? `${codes[0]} … ${codes.at(-1)}` : codes[0];
  const errors = { prefix: !prefix.trim() ? (range ? 'Enter a name prefix' : 'Enter a name') : undefined, type: !type ? 'Choose a type' : undefined, range: rangeError };
  const path = parentIdValue ? `${warehouseName} › ${pathOf(locations, parentIdValue)} › ` : `${warehouseName} › `;
  const preview =
    count === 1
      ? `${path}${names[0] || '…'} (${codes[0]})`
      : [...names.slice(0, 3).map((n, i) => `${n} (${codes[i]})`), ...(count > 4 ? ['…'] : []), ...(count > 3 ? [`${names.at(-1)} (${codes.at(-1)})`] : [])].join(', ');

  function create() {
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    onCreate(
      names.map((name, i) => ({
        name,
        code: codes[i],
        type,
        description: description.trim(),
        capacity: capacity.trim() || undefined,
        parentId: parentIdValue,
        frozen,
        nonPickable,
        empty: true,
        used: 0,
      })),
      printLabels,
    );
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      width={900}
      title="Add Location"
      description={<span className="text-small-regular">* Required. Add one location, or a numbered range in one step.</span>}
      primaryAction={{ label: count === 1 ? 'Create Location' : `Create ${count} Locations`, onClick: create }}
    >
      <form
        className={styles.form}
        noValidate
        onSubmit={e => {
          e.preventDefault();
          create();
        }}
      >
        <div className={styles.halves}>
          <Dropdown
            label="Parent location"
            options={[{ value: '', label: `Top level (${warehouseName})` }, ...parentOptions(locations)]}
            value={parent}
            onChange={v => setParent(v as string)}
          />
          <Dropdown label="Type *" placeholder="Select" options={LOCATION_TYPES.map(t => ({ value: t, label: t }))} value={type || null} onChange={v => setType(v as string)} error={tried ? errors.type : undefined} required />
        </div>
        <TextInput label="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} autoComplete="off" />
        <fieldset className={styles.chipField}>
          <legend className="text-medium-regular">How many?</legend>
          <div className={styles.chipRow}>
            <Tag size="small" selected={!range} onClick={() => setRange(false)}>
              One Location
            </Tag>
            <Tag size="small" selected={range} onClick={() => setRange(true)}>
              Range
            </Tag>
          </div>
        </fieldset>
        {range ? (
          <div className={styles.thirds}>
            <TextInput label={required('Name prefix')} value={prefix} onChange={e => setPrefix(e.target.value)} error={tried ? errors.prefix : undefined} autoComplete="off" required />
            <TextInput label={required('From')} value={from} inputMode="numeric" onChange={e => setFrom(e.target.value)} error={tried ? errors.range : undefined} required />
            <TextInput label={required('To')} value={to} inputMode="numeric" onChange={e => setTo(e.target.value)} required />
          </div>
        ) : (
          <TextInput label={required('Name')} value={prefix} onChange={e => setPrefix(e.target.value)} error={tried ? errors.prefix : undefined} autoComplete="off" required />
        )}
        <div className={styles.halves}>
          <TextInput label="Code (generated automatically)" value={codeText ?? ''} readOnly />
          <TextInput label="Capacity (optional)" value={capacity} placeholder="e.g. 1 pallet · 2,500 lb" onChange={e => setCapacity(e.target.value)} autoComplete="off" />
        </div>
        <div className={styles.previewBox} role="status">
          <p className="text-tiny-semi-bold">PREVIEW · {count === 1 ? '1 LOCATION' : `${count} LOCATIONS`}</p>
          <p className="text-medium-regular">{preview}</p>
        </div>
        <div className={styles.rulesBlock} role="group" aria-label="Rules">
          <p className="text-medium-regular">Rules</p>
          <RuleToggle label="Frozen" description="Blocks stock movement, e.g. during a count." on={frozen} onChange={setFrozen} />
          <RuleToggle label="Non-pickable" description="Left out of pick lists, e.g. returns or QC." on={nonPickable} onChange={setNonPickable} />
        </div>
        <Checkbox size="small" label="Print barcode labels after creating" checked={printLabels} onChange={e => setPrintLabels(e.target.checked)} />
        <button type="submit" hidden />
      </form>
    </AppModal>
  );
}

/** A rule with its switch at the right (Frozen, Non-pickable). */
export function RuleToggle({ label, description, on, onChange }: { label: string; description: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <div className={styles.ruleRow}>
      <div>
        <p className="text-small-bold">{label}</p>
        <p className="text-tiny-regular">{description}</p>
      </div>
      <Toggle aria-label={label} checked={on} onChange={e => onChange(e.target.checked)} />
    </div>
  );
}
