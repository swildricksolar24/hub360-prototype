import { useEffect, useState, type ReactNode } from 'react';
import { Avatar } from '../../../../../components/Avatar/Avatar';
import { Button } from '../../../../../components/Button/Button';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { Message } from '../../../../../components/Message/Message';
import { SearchInput } from '../../../../../components/SearchBar/SearchBar';
import { TextInput } from '../../../../../components/TextInput/TextInput';
import { Toggle } from '../../../../../components/Toggle/Toggle';
import { AppModal } from '../../../../components/AppModal';
import { COMPANIES, CONTACT_ROLES, CRM_PEOPLE, initialsOf, type Contact } from '../warehouseRecordData';
import styles from '../record.module.css';

type ContactFields = Omit<Contact, 'id' | 'primary'>;

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
 * Figma "Modal- Add Contact" Default / Search (537:57691, 537:57757): search the people in the CRM and pick one, or
 * go on to Add New Contact. People already on this warehouse are left out.
 */
export function SearchContactsModal({
  open,
  existingNames,
  onClose,
  onPick,
  onAddNew,
}: {
  open: boolean;
  existingNames: string[];
  onClose: () => void;
  onPick: (contact: ContactFields) => void;
  onAddNew: () => void;
}) {
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (open) setQuery('');
  }, [open]);
  const q = query.trim().toLowerCase();
  const results = q
    ? CRM_PEOPLE.filter(p => !existingNames.includes(p.name) && `${p.name} ${p.company} ${p.role}`.toLowerCase().includes(q))
    : [];

  return (
    <AppModal open={open} onClose={onClose} title="Search Contacts" primaryAction={{ label: 'Add New Contact', onClick: onAddNew }}>
      <SearchInput aria-label="Search contacts" placeholder="Search by name, company or role" value={query} onChange={e => setQuery(e.target.value)} autoFocus />
      {q && results.length === 0 && <p className={`text-medium-regular ${styles.noResults}`}>No contacts match “{query}”. Use Add New Contact to add them.</p>}
      {results.length > 0 && (
        <ul className={styles.results} aria-label="Contacts">
          {results.map(p => (
            <li key={p.name}>
              <button type="button" className={styles.result} onClick={() => onPick({ ...p, active: true })}>
                <Avatar size="small" initials={initialsOf(p.name)} />
                <span className={styles.resultText}>
                  <span className={styles.resultName}>{p.name}</span>
                  <span className={styles.resultSub}>{p.company}</span>
                </span>
                <span className={styles.resultSide}>
                  Primary Role
                  <br />
                  <strong>{p.role}</strong>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </AppModal>
  );
}

const EMPTY: ContactFields = { name: '', company: '', phone: '', email: '', role: '', additionalRoles: [], active: true };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Figma "Modal- Add Contact - Create New Contact" (537:57704) and "Modal- Edit Contact" (537:57724). Editing adds an
 * Active toggle, View Profile (the CRM, not in this prototype) and a red Remove Contact.
 */
export function ContactFormModal({
  open,
  contact,
  onClose,
  onSave,
  onRemove,
}: {
  open: boolean;
  /** The contact being edited; null adds a new one. */
  contact: Contact | null;
  onClose: () => void;
  onSave: (contact: ContactFields) => void;
  onRemove?: () => void;
}) {
  const [form, setForm] = useState<ContactFields>(EMPTY);
  const [tried, setTried] = useState(false);
  const [profileNote, setProfileNote] = useState(false);
  useEffect(() => {
    if (!open) return;
    setTried(false);
    setProfileNote(false);
    setForm(contact ? { ...contact } : EMPTY);
  }, [open, contact]);

  const set = <K extends keyof ContactFields>(key: K) => (value: ContactFields[K]) => setForm(f => ({ ...f, [key]: value }));
  const errors = {
    name: !form.name.trim() ? 'Enter the contact’s name' : undefined,
    email: form.email.trim() && !EMAIL.test(form.email.trim()) ? 'Enter an email address like name@company.com' : undefined,
  };

  function save() {
    setTried(true);
    if (errors.name || errors.email) return;
    onSave({
      ...form,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      // The primary role isn't repeated as an additional one
      additionalRoles: form.additionalRoles.filter(r => r !== form.role),
    });
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={contact ? 'Edit Contact' : 'Add Contact'}
      description={requiredNote}
      startAction={contact && onRemove ? { label: 'Remove Contact', danger: true, onClick: onRemove } : undefined}
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
        {contact && (
          <div className={styles.modalToggle}>
            <Toggle contained label="Active" checked={form.active} onChange={e => set('active')(e.target.checked)} />
            <Button size="small" variant="brand" type="button" onClick={() => setProfileNote(true)}>
              View Profile
            </Button>
          </div>
        )}
        {profileNote && (
          <Message
            type="info"
            title="The CRM isn’t part of this prototype yet"
            body={`${contact?.name ?? 'This contact'}’s full profile will open in the CRM once it’s built.`}
            onClose={() => setProfileNote(false)}
          />
        )}
        <div className={styles.wideNarrow}>
          <TextInput
            label={required('Contact Name')}
            value={form.name}
            onChange={e => set('name')(e.target.value)}
            error={tried ? errors.name : undefined}
            autoComplete="off"
            required
          />
          <Dropdown label="Company Name" placeholder="Select" options={options(COMPANIES)} value={form.company || null} onChange={v => set('company')(v as string)} />
        </div>
        <div className={styles.halves}>
          <TextInput label="Contact Phone #" type="tel" value={form.phone} onChange={e => set('phone')(e.target.value)} autoComplete="off" />
          <TextInput
            label="Contact Email Address"
            type="email"
            value={form.email}
            onChange={e => set('email')(e.target.value)}
            error={tried ? errors.email : undefined}
            autoComplete="off"
          />
        </div>
        <div className={styles.halves}>
          <Dropdown label="Primary Role" placeholder="Select" options={options(CONTACT_ROLES)} value={form.role || null} onChange={v => set('role')(v as string)} />
          <Dropdown
            label="Additional Roles"
            placeholder="Select"
            multiple
            options={options(CONTACT_ROLES.filter(r => r !== form.role))}
            value={form.additionalRoles}
            onChange={v => set('additionalRoles')(v as string[])}
          />
        </div>
        <button type="submit" hidden />
      </form>
    </AppModal>
  );
}

/** Asks before a contact is removed from the warehouse (Figma draws no confirmation). */
export function RemoveContactModal({ contact, onClose, onConfirm }: { contact: Contact | null; onClose: () => void; onConfirm: () => void }) {
  return (
    <AppModal
      open={contact !== null}
      onClose={onClose}
      title="Remove contact?"
      description={contact && `${contact.name} will be removed from this warehouse’s contacts. Their profile stays in the CRM.`}
      primaryAction={{ label: 'Remove Contact', danger: true, onClick: onConfirm }}
    />
  );
}
