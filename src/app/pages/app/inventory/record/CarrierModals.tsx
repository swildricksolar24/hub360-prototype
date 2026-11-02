import { useEffect, useState, type ReactNode } from 'react';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { SearchInput } from '../../../../../components/SearchBar/SearchBar';
import { TextInput } from '../../../../../components/TextInput/TextInput';
import { Toggle } from '../../../../../components/Toggle/Toggle';
import { AppModal } from '../../../../components/AppModal';
import { BILLING_TYPES, CARRIER_NAMES, KNOWN_CARRIER_ACCOUNTS, SERVICE_TYPES, type Carrier } from '../warehouseRecordData';
import styles from '../record.module.css';

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
const options = (list: string[]) => list.map(v => ({ value: v, label: v }));

/**
 * Figma "Modal- Add Key Carrier" Default / Search (384:33406, 384:33429): search the carrier accounts on file and
 * pick one, or go on to Add New Carrier.
 */
export function SearchCarrierModal({
  open,
  onClose,
  onPick,
  onAddNew,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (carrier: Omit<Carrier, 'id'>) => void;
  onAddNew: () => void;
}) {
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (open) setQuery('');
  }, [open]);
  const q = query.trim().toLowerCase();
  const results = q ? KNOWN_CARRIER_ACCOUNTS.filter(a => `${a.name} ${a.region} ${a.account}`.toLowerCase().includes(q)) : [];

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Search Carrier Account"
      primaryAction={{ label: 'Add New Carrier', onClick: onAddNew }}
    >
      <SearchInput aria-label="Search carrier accounts" placeholder="Search by carrier, region or account #" value={query} onChange={e => setQuery(e.target.value)} autoFocus />
      {q && results.length === 0 && <p className={`text-medium-regular ${styles.noResults}`}>No carrier accounts match “{query}”.</p>}
      {results.length > 0 && (
        <ul className={styles.results} aria-label="Carrier accounts">
          {results.map(a => (
            <li key={a.account}>
              <button
                type="button"
                className={styles.result}
                onClick={() => onPick({ name: a.name, account: a.account, nickname: a.region, billing: 'Prepaid', services: ['Ground'], active: true })}
              >
                <span className={styles.resultText}>
                  <span className={styles.resultName}>{a.name}</span>
                  <span className={styles.resultSub}>{a.region}</span>
                </span>
                <span className={styles.resultSide}>
                  Account #
                  <br />
                  <strong>{a.account}</strong>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </AppModal>
  );
}

type Form = { name: string; account: string; nickname: string; billing: string; services: string[]; active: boolean };
const EMPTY: Form = { name: '', account: '', nickname: '', billing: '', services: [], active: true };

/**
 * Figma "Modal- Add Key Carrier - Create New Carrier" (384:33589) and "Modal- Edit Carrier" (525:30327). Editing adds
 * an Active toggle and a red Remove Carrier.
 */
export function CarrierFormModal({
  open,
  carrier,
  onClose,
  onSave,
  onRemove,
}: {
  open: boolean;
  /** The carrier being edited; null adds a new one. */
  carrier: Carrier | null;
  onClose: () => void;
  onSave: (carrier: Omit<Carrier, 'id'>) => void;
  onRemove?: () => void;
}) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (!open) return;
    setTried(false);
    setForm(carrier ? { ...carrier } : EMPTY);
  }, [open, carrier]);

  const set = <K extends keyof Form>(key: K) => (value: Form[K]) => setForm(f => ({ ...f, [key]: value }));
  const errors = {
    name: !form.name ? 'Choose a carrier' : undefined,
    account: !form.account.trim() ? 'Enter the account #' : undefined,
    billing: !form.billing ? 'Choose a billing type' : undefined,
    services: form.services.length === 0 ? 'Choose at least one service type' : undefined,
  };

  function save() {
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    onSave({ ...form, account: form.account.trim(), nickname: form.nickname.trim() });
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={carrier ? 'Edit Carrier' : 'Add Carrier Account'}
      description={requiredNote}
      startAction={carrier && onRemove ? { label: 'Remove Carrier', danger: true, onClick: onRemove } : undefined}
      primaryAction={{ label: 'Save', onClick: save }}
    >
      <form
        className={styles.form}
        noValidate
        onSubmit={e => {
          e.preventDefault();
          save();
        }}
      >
        {carrier && (
          <div className={styles.modalToggle}>
            <Toggle contained label="Active" checked={form.active} onChange={e => set('active')(e.target.checked)} />
          </div>
        )}
        <div className={styles.wideNarrow}>
          <Dropdown
            label="Carrier Name *"
            placeholder="Select"
            options={options(CARRIER_NAMES)}
            value={form.name || null}
            onChange={v => set('name')(v as string)}
            error={tried ? errors.name : undefined}
            required
          />
          <TextInput
            label={required('Account #')}
            value={form.account}
            onChange={e => set('account')(e.target.value)}
            error={tried ? errors.account : undefined}
            required
          />
        </div>
        <TextInput label="Account Nickname" value={form.nickname} onChange={e => set('nickname')(e.target.value)} />
        <div className={styles.wideNarrow}>
          <Dropdown
            label="Billing Type *"
            placeholder="Select"
            options={options(BILLING_TYPES)}
            value={form.billing || null}
            onChange={v => set('billing')(v as string)}
            error={tried ? errors.billing : undefined}
            required
          />
          <Dropdown
            label="Service Type *"
            placeholder="Select"
            multiple
            options={options(SERVICE_TYPES)}
            value={form.services}
            onChange={v => set('services')(v as string[])}
            error={tried ? errors.services : undefined}
            required
          />
        </div>
        <button type="submit" hidden />
      </form>
    </AppModal>
  );
}

/** Asks before a carrier account is removed (Figma draws no confirmation; it follows the app's delete pattern). */
export function RemoveCarrierModal({ carrier, onClose, onConfirm }: { carrier: Carrier | null; onClose: () => void; onConfirm: () => void }) {
  return (
    <AppModal
      open={carrier !== null}
      onClose={onClose}
      title="Remove carrier account?"
      description={carrier && `${carrier.name} account ${carrier.account} (${carrier.nickname || 'no nickname'}) will be removed from this warehouse.`}
      primaryAction={{ label: 'Remove Carrier', danger: true, onClick: onConfirm }}
    />
  );
}
