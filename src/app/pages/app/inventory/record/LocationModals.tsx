import { useEffect, useState, type ReactNode } from 'react';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { TextArea } from '../../../../../components/TextArea/TextArea';
import { TextInput } from '../../../../../components/TextInput/TextInput';
import { AppModal } from '../../../../components/AppModal';
import { LOCATION_TYPES, MAX_LOCATION_DEPTH, type WarehouseLocation } from '../warehouseRecordData';
import { STATUS_INFO, depthOf, descendantIds, pathOf } from './locationTree';
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
