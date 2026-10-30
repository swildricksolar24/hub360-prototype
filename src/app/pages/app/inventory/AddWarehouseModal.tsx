import { useEffect, useState, type ReactNode } from 'react';
import { Dropdown } from '../../../../components/Dropdown/Dropdown';
import { TextInput } from '../../../../components/TextInput/TextInput';
import { AppModal } from '../../../components/AppModal';
import { COUNTRIES, STATES, STATE_CODES, type Warehouse } from './warehouseData';
import styles from './modals.module.css';

type Form = { code: string; country: string; name: string; address1: string; address2: string; city: string; state: string; zip: string };

const EMPTY: Form = { code: '', country: COUNTRIES[0], name: '', address1: '', address2: '', city: '', state: '', zip: '' };
const stateName = (code: string) => Object.entries(STATE_CODES).find(([, c]) => c === code)?.[0] ?? '';

/** A required field's label: the text and a red asterisk (as on Sign Up). */
const required = (text: string): ReactNode => (
  <>
    {text} <span className={styles.requiredMark}>*</span>
  </>
);

/**
 * Figma "Add Warehouse" (732:51736): Warehouse ID, Country and Warehouse Name (required), the address, then Cancel /
 * Create. The same form edits an existing warehouse from the row menu (title "Edit Warehouse", Save).
 */
export function AddWarehouseModal({
  open,
  warehouse,
  existingCodes,
  onClose,
  onSave,
}: {
  open: boolean;
  warehouse: Warehouse | null;
  existingCodes: string[];
  onClose: () => void;
  onSave: (w: Warehouse) => void;
}) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTried(false);
    setForm(
      warehouse
        ? {
            code: warehouse.code,
            country: warehouse.country,
            name: warehouse.name,
            address1: warehouse.address1,
            address2: warehouse.address2 ?? '',
            city: warehouse.city,
            state: stateName(warehouse.state),
            zip: warehouse.zip,
          }
        : EMPTY,
    );
  }, [open, warehouse]);

  const set = (key: keyof Form) => (value: string) => setForm(f => ({ ...f, [key]: value }));
  const code = form.code.trim().toUpperCase();
  const duplicate = code !== '' && code !== warehouse?.code && existingCodes.includes(code);
  const errors = {
    code: !code ? 'Enter a warehouse ID' : duplicate ? 'That warehouse ID is already in use' : undefined,
    name: !form.name.trim() ? 'Enter a warehouse name' : undefined,
  };

  function save() {
    setTried(true);
    if (errors.code || errors.name) return;
    onSave({
      id: warehouse?.id ?? code,
      code,
      name: form.name.trim(),
      address1: form.address1.trim(),
      address2: form.address2.trim() || undefined,
      city: form.city.trim(),
      state: STATE_CODES[form.state] ?? '',
      zip: form.zip.trim(),
      country: form.country,
      value: warehouse?.value ?? 0,
      locations: warehouse?.locations ?? 0,
      filled: warehouse?.filled ?? 0,
      active: warehouse?.active ?? true,
    });
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={warehouse ? 'Edit Warehouse' : 'Add Warehouse'}
      description={
        <span className="text-small-regular">
          <span className={styles.requiredMark}>*</span>Indicates required field
        </span>
      }
      primaryAction={{ label: warehouse ? 'Save' : 'Create', onClick: save }}
    >
      <form
        className={styles.form}
        noValidate
        onSubmit={e => {
          e.preventDefault();
          save();
        }}
      >
        <div className={styles.fieldRow}>
          <TextInput
            label={required('Warehouse ID')}
            placeholder="WH-001"
            value={form.code}
            onChange={e => set('code')(e.target.value)}
            error={tried ? errors.code : undefined}
            required
          />
          <Dropdown
            label="Country *"
            options={COUNTRIES.map(c => ({ value: c, label: c }))}
            value={form.country}
            onChange={v => set('country')(v as string)}
            required
          />
        </div>
        <TextInput
          label={required('Warehouse Name')}
          value={form.name}
          onChange={e => set('name')(e.target.value)}
          error={tried ? errors.name : undefined}
          required
        />
        <TextInput label="Address 1" value={form.address1} onChange={e => set('address1')(e.target.value)} />
        <TextInput label="Address 2" value={form.address2} onChange={e => set('address2')(e.target.value)} />
        <div className={styles.fieldRow}>
          <TextInput label="City" value={form.city} onChange={e => set('city')(e.target.value)} />
          <Dropdown
            label="State"
            placeholder="Select"
            options={STATES.map(s => ({ value: s, label: s }))}
            value={form.state || null}
            onChange={v => set('state')(v as string)}
          />
          <TextInput label="Zip Code" inputMode="numeric" value={form.zip} onChange={e => set('zip')(e.target.value)} />
        </div>
        {/* Enter submits the form */}
        <button type="submit" hidden />
      </form>
    </AppModal>
  );
}
