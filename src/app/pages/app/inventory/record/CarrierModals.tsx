import { useEffect, useState, type ReactNode } from 'react';
import { Checkbox } from '../../../../../components/Checkbox/Checkbox';
import { Tag } from '../../../../../components/Tag/Tag';
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

/** "Account •••• 4687": the last four characters of an account #. */
const masked = (account: string) => `Account •••• ${account.replace(/\W/g, '').slice(-4)}`;

/**
 * Figma "Add Carrier Account — Improved" (848:17307): the company's carrier accounts, searchable, with a checkbox each.
 * Accounts already on this warehouse can't be picked again. "Add New Carrier Account" opens the form for one the
 * company doesn't have yet.
 */
export function SearchCarrierModal({
  open,
  existing,
  onClose,
  onAdd,
  onAddNew,
}: {
  open: boolean;
  /** The warehouse's carrier accounts. */
  existing: Carrier[];
  onClose: () => void;
  onAdd: (carriers: Omit<Carrier, 'id'>[]) => void;
  onAddNew: () => void;
}) {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setPicked(new Set());
  }, [open]);
  const q = query.trim().toLowerCase();
  const results = KNOWN_CARRIER_ACCOUNTS.filter(a => !q || `${a.name} ${a.nickname} ${a.account}`.toLowerCase().includes(q));
  const onWarehouse = (account: string) => existing.some(c => c.account === account);
  const toggle = (account: string, on: boolean) =>
    setPicked(p => {
      const next = new Set(p);
      if (on) next.add(account);
      else next.delete(account);
      return next;
    });

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Add Carrier Account"
      description="Pick an account your company already has, or add a new one."
      startAction={{ label: 'Add New Carrier Account', icon: 'plus', onClick: onAddNew }}
      primaryAction={{
        label: 'Add to Warehouse',
        disabled: picked.size === 0,
        onClick: () => onAdd(KNOWN_CARRIER_ACCOUNTS.filter(a => picked.has(a.account)).map(a => ({ ...a, services: [...a.services], active: true }))),
      }}
    >
      <SearchInput aria-label="Search carrier accounts" placeholder="Search by carrier, nickname or account #" value={query} onChange={e => setQuery(e.target.value)} autoFocus />
      {results.length === 0 ? (
        <p className={`text-medium-regular ${styles.noResults}`}>No carrier accounts match “{query}”. Use Add New Carrier Account to add it.</p>
      ) : (
        <ul className={styles.pickList} aria-label="Carrier accounts">
          {results.map(a => {
            const already = onWarehouse(a.account);
            return (
              <li key={a.account} className={styles.pickRow} data-picked={picked.has(a.account) || undefined} data-disabled={already || undefined}>
                <Checkbox
                  size="small"
                  label={
                    <span className={styles.pickText}>
                      <span className="text-medium-bold">
                        {a.name} · {a.nickname}
                      </span>
                      <span className="text-tiny-regular">{masked(a.account)}</span>
                    </span>
                  }
                  checked={picked.has(a.account)}
                  disabled={already}
                  onChange={e => toggle(a.account, e.target.checked)}
                />
                {already && <span className={`text-tiny-regular ${styles.pickNote}`}>Already on this warehouse</span>}
              </li>
            );
          })}
        </ul>
      )}
    </AppModal>
  );
}

type Form = { name: string; account: string; nickname: string; billing: string; services: string[]; active: boolean };
const EMPTY: Form = { name: '', account: '', nickname: '', billing: '', services: [], active: true };

/**
 * Figma "Edit Carrier Account — Improved" (848:20546), also used to add a new account: Carrier, Account Nickname,
 * Account #, Billing Type and the Service Types chips. Editing adds the Active toggle and a red Remove from Warehouse. Copying (a row's ••• › Copy) opens the Add form filled from another account:
 * same carrier, billing and services, the nickname marked "(copy)", and an empty Account # to fill in.
 */
export function CarrierFormModal({
  open,
  carrier,
  copyOf,
  onClose,
  onSave,
  onRemove,
}: {
  open: boolean;
  /** The carrier being edited; null adds a new one. */
  carrier: Carrier | null;
  /** Adding only: the account to start from (••• › Copy). */
  copyOf?: Carrier | null;
  onClose: () => void;
  onSave: (carrier: Omit<Carrier, 'id'>) => void;
  onRemove?: () => void;
}) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (!open) return;
    setTried(false);
    setForm(
      carrier
        ? { ...carrier }
        : copyOf
          ? { ...EMPTY, name: copyOf.name, nickname: copyOf.nickname && `${copyOf.nickname} (copy)`, billing: copyOf.billing, services: [...copyOf.services] }
          : EMPTY,
    );
  }, [open, carrier, copyOf]);

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
      title={carrier ? 'Edit Carrier Account' : copyOf ? 'Copy Carrier Account' : 'New Carrier Account'}
      description={
        carrier ? (
          <span className="text-small-regular">
            Carrier accounts are shared across warehouses. Turning off Active disables this account everywhere it’s used. To stop using it here only, use
            Remove from Warehouse.
          </span>
        ) : (
          requiredNote
        )
      }
      // Figma: Active sits in the header, beside the close button
      headerActions={carrier && <Toggle contained label="Active" checked={form.active} onChange={e => set('active')(e.target.checked)} />}
      startAction={carrier && onRemove ? { label: 'Remove from Warehouse', danger: true, onClick: onRemove } : undefined}
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
        <div className={styles.halves}>
          <Dropdown
            label="Carrier *"
            placeholder="Select"
            options={options(CARRIER_NAMES)}
            value={form.name || null}
            onChange={v => set('name')(v as string)}
            error={tried ? errors.name : undefined}
            required
          />
          <TextInput label="Account Nickname" value={form.nickname} onChange={e => set('nickname')(e.target.value)} />
          <TextInput
            label={required('Account #')}
            value={form.account}
            onChange={e => set('account')(e.target.value)}
            error={tried ? errors.account : undefined}
            required
          />
          <Dropdown
            label="Billing Type *"
            placeholder="Select"
            options={options(BILLING_TYPES)}
            value={form.billing || null}
            onChange={v => set('billing')(v as string)}
            error={tried ? errors.billing : undefined}
            required
          />
        </div>
        <fieldset className={styles.chipField}>
          <legend className="text-medium-regular">Service Types * (select all that apply)</legend>
          <div className={styles.chipRow}>
            {SERVICE_TYPES.map(t => (
              <Tag
                key={t}
                size="small"
                selected={form.services.includes(t)}
                onClick={() => set('services')(form.services.includes(t) ? form.services.filter(x => x !== t) : [...form.services, t])}
              >
                {t}
              </Tag>
            ))}
          </div>
          {tried && errors.services && (
            <p className={`text-small-regular ${styles.fieldError}`} role="alert">
              {errors.services}
            </p>
          )}
        </fieldset>
        <button type="submit" hidden />
      </form>
    </AppModal>
  );
}

/** Figma "Remove Carrier Account — Improved" (848:20626), in the app's one modal layout. */
export function RemoveCarrierModal({
  carrier,
  warehouseName,
  onClose,
  onConfirm,
}: {
  carrier: Carrier | null;
  warehouseName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AppModal
      open={carrier !== null}
      onClose={onClose}
      title={carrier ? `Remove ${carrier.nickname || `${carrier.name} ${carrier.account}`} from ${warehouseName}?` : ''}
      description="The account stays available for other warehouses. Shipments already booked with it aren’t affected."
      primaryAction={{ label: 'Remove', danger: true, onClick: onConfirm }}
    />
  );
}
