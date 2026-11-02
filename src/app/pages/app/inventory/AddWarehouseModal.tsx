import { useEffect, useState, type ReactNode } from 'react';
import { Dropdown } from '../../../../components/Dropdown/Dropdown';
import { TextInput } from '../../../../components/TextInput/TextInput';
import { AppModal } from '../../../components/AppModal';
import { AddressFields, addressDraftOf, addressErrors, addressFromDraft, withCountry, type AddressDraft } from './AddressFields';
import { FindAddress } from './FindAddress';
import { COUNTRIES, type Warehouse } from './warehouseData';
import styles from './modals.module.css';

type Form = { code: string; name: string } & AddressDraft;

const empty = (): Form => ({ code: '', name: '', ...addressDraftOf(null, COUNTRIES[0]) });

/** A required field's label: the text and a red asterisk (as on Sign Up). */
const required = (text: string): ReactNode => (
  <>
    {text} <span className={styles.requiredMark}>*</span>
  </>
);

/**
 * Figma "Add Warehouse" (732:51736, Find address from 826:57825): Warehouse ID, Country and Warehouse Name (required),
 * Find address, the address, then Cancel / Create. The address fields follow the chosen country (AddressFields): choosing Mexico switches to calle, números,
 * colonia, código postal, municipio and estado. The same form edits an existing warehouse from the row menu (title
 * "Edit Warehouse", Save).
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
  const [form, setForm] = useState<Form>(empty);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTried(false);
    setForm(warehouse ? { code: warehouse.code, name: warehouse.name, ...addressDraftOf(warehouse) } : empty());
  }, [open, warehouse]);

  const set = (key: 'code' | 'name') => (value: string) => setForm(f => ({ ...f, [key]: value }));
  const code = form.code.trim().toUpperCase();
  const duplicate = code !== '' && code !== warehouse?.code && existingCodes.includes(code);
  const errors = {
    code: !code ? 'Enter a warehouse ID' : duplicate ? 'That warehouse ID is already in use' : undefined,
    name: !form.name.trim() ? 'Enter a warehouse name' : undefined,
  };
  const address = addressErrors(form);

  function save() {
    setTried(true);
    if (errors.code || errors.name || Object.keys(address).length) return;
    onSave({
      id: warehouse?.id ?? code,
      code,
      name: form.name.trim(),
      ...addressFromDraft(form),
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
            onChange={v => setForm(f => ({ ...f, ...withCountry(f, v as string) }))}
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
        {/* Figma 826:57894: picking a found address fills the fields below */}
        <FindAddress draft={form} onPick={a => setForm(f => ({ ...f, ...a }))} />
        <AddressFields draft={form} onChange={d => setForm(f => ({ ...f, ...d }))} errors={tried ? address : undefined} />
        {/* Enter submits the form */}
        <button type="submit" hidden />
      </form>
    </AppModal>
  );
}
