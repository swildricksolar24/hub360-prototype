import { useEffect, useState, type ReactNode } from 'react';
import { Avatar } from '../../../../../components/Avatar/Avatar';
import { Button } from '../../../../../components/Button/Button';
import { Checkbox } from '../../../../../components/Checkbox/Checkbox';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { FilterChipDropdown } from '../../../../../components/FilterChipDropdown/FilterChipDropdown';
import { Message } from '../../../../../components/Message/Message';
import { SearchInput } from '../../../../../components/SearchBar/SearchBar';
import { TextInput } from '../../../../../components/TextInput/TextInput';
import { Toggle } from '../../../../../components/Toggle/Toggle';
import { AppModal } from '../../../../components/AppModal';
import { COMPANIES, CONTACT_ROLES, CRM_PEOPLE, initialsOf, type Contact } from '../warehouseRecordData';
import styles from '../record.module.css';
import { useProfilePhoto } from '../../../../auth/useProfilePhoto';

export type ContactFields = Omit<Contact, 'id' | 'primary'>;

const required = (text: string): ReactNode => (
  <>
    {text} <span className={styles.requiredMark}>*</span>
  </>
);
const options = (list: string[]) => list.map(v => ({ value: v, label: v }));
const firstName = (name: string) => name.split(' ')[0] ?? name;

/**
 * Figma "Modal- Add Contact - Search" (848:21038): search the CRM, check the people to add, or create a new contact.
 * People already on this warehouse show "Already on this warehouse" and can't be picked.
 */
export function SearchContactsModal({
  open,
  existingNames,
  onClose,
  onAdd,
  onAddNew,
}: {
  open: boolean;
  existingNames: string[];
  onClose: () => void;
  onAdd: (contacts: ContactFields[]) => void;
  onAddNew: () => void;
}) {
  // Every person shows the current profile photo (initials when there is none)
  const photo = useProfilePhoto();
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setPicked(new Set());
  }, [open]);
  const q = query.trim().toLowerCase();
  const results = CRM_PEOPLE.filter(p => !q || `${p.name} ${p.company} ${p.role} ${p.email}`.toLowerCase().includes(q));
  const toggle = (name: string, on: boolean) =>
    setPicked(p => {
      const next = new Set(p);
      if (on) next.add(name);
      else next.delete(name);
      return next;
    });

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Add Contact"
      description="Search the CRM for an existing contact, or create a new one."
      startAction={{ label: 'Create New Contact', icon: 'plus', onClick: onAddNew }}
      primaryAction={{
        label: 'Add to Warehouse',
        disabled: picked.size === 0,
        onClick: () => onAdd(CRM_PEOPLE.filter(p => picked.has(p.name)).map(p => ({ ...p, additionalRoles: [...p.additionalRoles], active: true }))),
      }}
    >
      <SearchInput aria-label="Search the CRM" placeholder="Search by name, company, role or email" value={query} onChange={e => setQuery(e.target.value)} autoFocus />
      {q && (
        <p className={`text-tiny-regular ${styles.pickCount}`} role="status">
          {results.length === 1 ? '1 contact' : `${results.length} contacts`} in the CRM match “{query}”
        </p>
      )}
      {results.length === 0 ? (
        <p className={`text-medium-regular ${styles.noResults}`}>Nobody in the CRM matches “{query}”. Use Create New Contact to add them.</p>
      ) : (
        <ul className={styles.pickList} aria-label="CRM contacts">
          {results.map(p => {
            const already = existingNames.includes(p.name);
            return (
              <li key={p.name} className={styles.pickRow} data-picked={picked.has(p.name) || undefined} data-disabled={already || undefined}>
                <Checkbox
                  size="small"
                  label={
                    <span className={styles.pickPerson}>
                      <Avatar size="small" src={photo} initials={initialsOf(p.name)} label={p.name} />
                      <span className={styles.pickText}>
                        <span className="text-medium-bold">{p.name}</span>
                        <span className="text-tiny-regular">
                          {p.company} · {p.role} · {p.email}
                        </span>
                      </span>
                    </span>
                  }
                  checked={picked.has(p.name)}
                  disabled={already}
                  onChange={e => toggle(p.name, e.target.checked)}
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

type Form = { first: string; last: string; company: string; phone: string; email: string; role: string; additionalRoles: string[]; active: boolean; primary: boolean };
const EMPTY: Form = { first: '', last: '', company: '', phone: '', email: '', role: '', additionalRoles: [], active: true, primary: false };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Figma "Modal- Add Contact - Create New Contact" (848:20988) and "Modal- Edit Contact" (848:21010): Make Primary
 * Contact, First / Last Name, Company, Primary Role, Phone, Email and Additional Roles. Editing adds the Active toggle,
 * View in CRM and a red Remove from Warehouse; creating has Back to Search.
 */
export function ContactFormModal({
  open,
  contact,
  onClose,
  onSave,
  onRemove,
  onBack,
}: {
  open: boolean;
  /** The contact being edited; null creates a new one. */
  contact: Contact | null;
  onClose: () => void;
  /** `primary`: make them the warehouse's primary contact. */
  onSave: (contact: ContactFields, primary: boolean) => void;
  onRemove?: () => void;
  /** Creating: back to the CRM search. */
  onBack?: () => void;
}) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [tried, setTried] = useState(false);
  const [crmNote, setCrmNote] = useState(false);
  useEffect(() => {
    if (!open) return;
    setTried(false);
    setCrmNote(false);
    if (!contact) return setForm(EMPTY);
    const [first = '', ...rest] = contact.name.split(' ');
    setForm({ ...contact, first, last: rest.join(' ') });
  }, [open, contact]);

  const set = <K extends keyof Form>(key: K) => (value: Form[K]) => setForm(f => ({ ...f, [key]: value }));
  const errors = {
    first: !form.first.trim() ? 'Enter a first name' : undefined,
    last: !form.last.trim() ? 'Enter a last name' : undefined,
    role: !form.role ? 'Choose a primary role' : undefined,
    email: form.email.trim() && !EMAIL.test(form.email.trim()) ? 'Enter an email address like name@company.com' : undefined,
  };

  function save() {
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    onSave(
      {
        name: `${form.first.trim()} ${form.last.trim()}`,
        company: form.company,
        phone: form.phone.trim(),
        email: form.email.trim(),
        role: form.role,
        // The primary role isn't repeated as an additional one
        additionalRoles: form.additionalRoles.filter(r => r !== form.role),
        active: form.active,
      },
      form.primary,
    );
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={contact ? 'Edit Contact' : 'Create New Contact'}
      description={
        <span className="text-small-regular">
          {contact
            ? 'Turning off Active deactivates this contact everywhere, including the CRM and all warehouses. To stop using it here only, use Remove from Warehouse.'
            : '* Required. This contact will also be created in the CRM.'}
        </span>
      }
      // Figma: Active and View in CRM sit in the header, beside the close button
      headerActions={
        contact && (
          <>
            <Toggle contained label="Active" checked={form.active} onChange={e => set('active')(e.target.checked)} />
            <Button size="small" variant="brand" icon="link-add" type="button" onClick={() => setCrmNote(true)}>
              View in CRM
            </Button>
          </>
        )
      }
      startAction={
        contact && onRemove ? { label: 'Remove from Warehouse', danger: true, onClick: onRemove } : !contact && onBack ? { label: 'Back to Search', onClick: onBack } : undefined
      }
      primaryAction={{ label: contact ? 'Save' : 'Create & Add', onClick: save }}
    >
      <form
        className={styles.form}
        noValidate
        onSubmit={e => {
          e.preventDefault();
          save();
        }}
      >
        {crmNote && (
          <Message
            type="info"
            title="The CRM isn’t part of this prototype yet"
            body={`${contact?.name ?? 'This contact'}’s record will open in the CRM once it’s built.`}
            onClose={() => setCrmNote(false)}
          />
        )}
        <Checkbox
          size="small"
          label="Make Primary Contact for Warehouse"
          checked={form.primary}
          // The primary contact can't be unset here; pick another one instead
          disabled={!!contact?.primary}
          onChange={e => set('primary')(e.target.checked)}
        />
        <div className={styles.halves}>
          <TextInput label={required('First Name')} value={form.first} onChange={e => set('first')(e.target.value)} error={tried ? errors.first : undefined} autoComplete="off" required />
          <TextInput label={required('Last Name')} value={form.last} onChange={e => set('last')(e.target.value)} error={tried ? errors.last : undefined} autoComplete="off" required />
          <Dropdown label="Company" placeholder="Select" options={options(COMPANIES)} value={form.company || null} onChange={v => set('company')(v as string)} />
          <Dropdown
            label="Primary Role *"
            placeholder="Select"
            options={options(CONTACT_ROLES)}
            value={form.role || null}
            onChange={v => set('role')(v as string)}
            error={tried ? errors.role : undefined}
            required
          />
          <TextInput label="Phone" type="tel" value={form.phone} onChange={e => set('phone')(e.target.value)} autoComplete="off" />
          <TextInput label="Email" type="email" value={form.email} onChange={e => set('email')(e.target.value)} error={tried ? errors.email : undefined} autoComplete="off" />
        </div>
        {/* Volt "Drop Down - Filter Chip": the chosen roles show as removable chips under the field, with no panel around them */}
        <FilterChipDropdown
          chipsAppearance="none"
          label="Additional Roles"
          placeholder="Select"
          options={options(CONTACT_ROLES.filter(r => r !== form.role))}
          value={form.additionalRoles.filter(r => r !== form.role)}
          onChange={v => set('additionalRoles')(v)}
        />
        <button type="submit" hidden />
      </form>
    </AppModal>
  );
}

/**
 * Figma "Modal- Remove Contact" (857:22542), in the app's one modal layout. Removing the primary contact offers to
 * pick a new one (or leave it empty).
 */
export function RemoveContactModal({
  contact,
  others,
  warehouseName,
  onClose,
  onConfirm,
}: {
  contact: Contact | null;
  /** The warehouse's other active contacts, for New Primary Contact. */
  others: Contact[];
  warehouseName: string;
  onClose: () => void;
  /** `newPrimary`: the contact id to make primary, if one was picked. */
  onConfirm: (newPrimary: string | null) => void;
}) {
  const [next, setNext] = useState<string | null>(null);
  useEffect(() => setNext(null), [contact]);
  const first = contact ? firstName(contact.name) : '';
  return (
    <AppModal
      open={contact !== null}
      onClose={onClose}
      title={contact ? `Remove ${contact.name} from ${warehouseName}?` : ''}
      description={
        contact &&
        `${first} stays in the CRM and on any other warehouses.${contact.primary ? ` ${first} is the Primary contact here; you can pick a new one or leave it empty.` : ''}`
      }
      primaryAction={{ label: 'Remove', danger: true, onClick: () => onConfirm(next) }}
    >
      {contact?.primary && others.length > 0 && (
        <Dropdown label="New Primary Contact" placeholder="Select" options={others.map(c => ({ value: c.id, label: c.name }))} value={next} onChange={v => setNext(v as string)} />
      )}
    </AppModal>
  );
}
