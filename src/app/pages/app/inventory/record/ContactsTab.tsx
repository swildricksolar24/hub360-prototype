import { useState } from 'react';
import { Button } from '../../../../../components/Button/Button';
import { DataTable, type DataColumn } from '../../../../../components/DataTable/DataTable';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { Icon } from '../../../../../components/Icon/Icon';
import { SearchInput } from '../../../../../components/SearchBar/SearchBar';
import { Tag } from '../../../../../components/Tag/Tag';
import { HelperToggle, PrototypeHelper } from '../../../../shell/PrototypeHelper';
import { useHelperFlag } from '../../../../shell/helperFlags';
import { INTERNAL_COMPANY, type Contact } from '../warehouseRecordData';
import { setContacts, useContacts } from '../warehouseStore';
import { ContactFormModal, RemoveContactModal, SearchContactsModal, type ContactFields } from './ContactModals';
import { RowMenu } from './RowMenu';
import { Pager, StatusPill, useTableControls } from './tableKit';
import styles from '../record.module.css';
import table from '../table.module.css';

// Volt "Data Table" (Base 3299:1399), the same table as Carrier Accounts. When the card is too narrow, columns shrink
// to their minWidth (wrapping to 2 lines), then hide by priority: Additional Roles, then Phone, then Company.
const COLUMNS: DataColumn[] = [
  // Figma: just the 20px star, 16px from the checkbox (the button's 4px padding on each side makes 28)
  { key: 'primary', label: 'Primary contact', width: 28, labelHidden: true, sortable: false },
  { key: 'name', label: 'Name', width: 140, minWidth: 110 },
  { key: 'company', label: 'Company', width: 'fill', minWidth: 120, priority: 1 },
  { key: 'phone', label: 'Phone', width: 130, priority: 2 },
  { key: 'email', label: 'Email', width: 210, minWidth: 160 },
  { key: 'role', label: 'Primary Role', width: 150, minWidth: 110 },
  { key: 'additionalRoles', label: 'Additional Roles', width: 'fill', minWidth: 120, priority: 3 },
  // Figma: the status pill sits right before the ••• button
  { key: 'status', label: 'Status', width: 110, align: 'end', labelHidden: true, sortable: false },
];

type Who = 'all' | 'internal' | 'external';
const isInternal = (c: Pick<Contact, 'company'>) => c.company === INTERNAL_COMPANY;
/** "Acme Solar (Internal)": the company's own people are marked internal (Figma 848:20960). */
const companyText = (c: Contact) => (c.company ? (isInternal(c) ? `${c.company} (Internal)` : c.company) : '—');
const text = (c: Contact, key: string) => (key === 'additionalRoles' ? c.additionalRoles.join(', ') : key === 'company' ? companyText(c) : String(c[key as keyof Contact] ?? ''));

/**
 * Warehouse record › Contacts (Figma 848:20960): All / Internal / External, search, and the people who work with the
 * warehouse on the Volt Data Table, 10 to a page. The card reaches the bottom of the page. The ★ marks the primary
 * contact; a name opens Edit Contact, and Add Contact searches the CRM first.
 */
export function ContactsTab({ code, warehouseName, onNotice }: { code: string; warehouseName: string; onNotice: (text: string) => void }) {
  const stored = useContacts(code);
  const empty = useHelperFlag('contacts.empty');
  const noPrimary = useHelperFlag('contacts.noPrimary');
  // Helper switches: no contacts, or none marked primary (the view only; the store keeps its rows). The star, the
  // pinned-first sort and Make Primary all read these rows, so they follow.
  const contacts = empty ? [] : noPrimary ? stored.map(c => ({ ...c, primary: false })) : stored;
  const [who, setWho] = useState<Who>('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [editing, setEditing] = useState<Contact | 'new' | null>(null);
  const [removing, setRemoving] = useState<Contact | null>(null);

  const t = useTableControls(contacts, {
    search: c => `${c.name} ${c.company} ${c.role} ${c.email} ${c.additionalRoles.join(' ')}`,
    sortValue: text,
    filter: c => who === 'all' || (who === 'internal') === isInternal(c),
    // The primary contact is always the first row, whatever the sort
    pinFirst: c => c.primary,
  });
  const internal = contacts.filter(isInternal).length;

  const update = (next: (list: Contact[]) => Contact[]) => setContacts(code, next);
  function add(list: ContactFields[], primary = false) {
    update(all => {
      const added = list.map((f, i) => ({ ...f, id: `p${Date.now()}-${i}`, primary: false }));
      // The first contact on an empty warehouse becomes the primary one; so does a new one marked primary
      const next = [...all.map(x => (primary ? { ...x, primary: false } : x)), ...added];
      if (primary || all.length === 0) next[all.length]!.primary = true;
      return next;
    });
    // A new primary lands at the top of page 1
    if (primary) t.setPage(1);
    onNotice(list.length === 1 ? `${list[0]!.name} added to ${warehouseName}’s contacts.` : `${list.length} contacts added to ${warehouseName}.`);
  }
  function makePrimary(c: Contact) {
    update(list => list.map(x => ({ ...x, primary: x.id === c.id })));
    t.setPage(1);
    onNotice(`${c.name} is now the primary contact.`);
  }

  return (
    <div className={`${styles.tab} ${styles.fillTab}`}>
      <PrototypeHelper title="Contacts">
        <HelperToggle flag="contacts.empty" label="No contacts" />
        <HelperToggle flag="contacts.noPrimary" label="No primary contact" />
      </PrototypeHelper>
      <section className={styles.card} aria-label="Contacts">
        <div className={styles.contactToolbar} role="toolbar" aria-label="Contacts">
          {/* The View ▾ filter the other record tables use (tableKit's TableToolbar) */}
          <Dropdown
            variant="small"
            label="View"
            hideLabel
            options={[
              { value: 'all', label: `All (${contacts.length})` },
              { value: 'internal', label: `Internal (${internal})` },
              { value: 'external', label: `External (${contacts.length - internal})` },
            ]}
            value={who}
            onChange={v => {
              setWho(v as Who);
              t.setPage(1);
            }}
            renderValue={sel => `View: ${sel[0]?.label ?? 'All'}`}
          />
          <SearchInput
            className={styles.toolbarSearch}
            aria-label="Search contacts"
            placeholder="Search contacts by name, company, role or email"
            value={t.query}
            onChange={e => t.setQuery(e.target.value)}
          />
          {/* Same as Add Carrier: Button Small Brand with the plus icon */}
          <Button size="small" variant="brand" icon="plus" onClick={() => setSearching(true)}>
            Add Contact
          </Button>
        </div>
        <DataTable
          aria-label="Warehouse contacts"
          className={styles.statusStart}
          columns={COLUMNS}
          rows={t.pageRows}
          rowLabel={c => c.name}
          sort={t.headerProps.sort}
          onSortChange={t.headerProps.onSortChange}
          selected={selected}
          onSelectedChange={setSelected}
          inactive={c => !c.active}
          actionsVisible
          empty={contacts.length ? 'No contacts match. Clear the search or choose All.' : 'No contacts yet. Use Add Contact to add the people who work here.'}
          onMore={c => setMenuFor(m => (m === c.id ? null : c.id))}
          renderAfterRow={c =>
            menuFor === c.id && (
              <RowMenu
                label={c.name}
                onClose={() => setMenuFor(null)}
                items={[
                  { label: 'Edit', onSelect: () => setEditing(c) },
                  { label: 'Make Primary', disabled: c.primary, onSelect: () => makePrimary(c) },
                  {
                    label: c.active ? 'Deactivate' : 'Activate',
                    onSelect: () => {
                      update(list => list.map(x => (x.id === c.id ? { ...x, active: !c.active } : x)));
                      onNotice(`${c.name} ${c.active ? 'deactivated' : 'activated'}.`);
                    },
                  },
                  { label: 'Remove from Warehouse', onSelect: () => setRemoving(c) },
                ]}
              />
            )
          }
          cells={c => ({
            primary: (
              <button
                type="button"
                className={styles.star}
                aria-pressed={c.primary}
                aria-label={c.primary ? `${c.name} is the primary contact` : `Make ${c.name} the primary contact`}
                title={c.primary ? 'Primary contact' : 'Make primary contact'}
                onClick={() => !c.primary && makePrimary(c)}
              >
                <Icon name={c.primary ? 'rating' : 'rating-hollow'} size={20} color="currentColor" />
              </button>
            ),
            name: (
              <button type="button" className={styles.cellLink} onClick={() => setEditing(c)}>
                {c.name}
              </button>
            ),
            company: companyText(c),
            phone: c.phone || '—',
            email: c.email || '—',
            role: c.role || '—',
            additionalRoles: c.additionalRoles.length ? (
              <span className={table.tags}>
                {c.additionalRoles.map(r => (
                  <Tag key={r} size="tiny" selected>
                    {r}
                  </Tag>
                ))}
              </span>
            ) : (
              '—'
            ),
            status: <StatusPill active={c.active} />,
          })}
        />
        {/* Pinned to the bottom of the card */}
        <div className={styles.cardFoot}>
          <Pager table={t} label="Contact pages" />
        </div>
      </section>

      <SearchContactsModal
        open={searching}
        existingNames={stored.map(c => c.name)}
        onClose={() => setSearching(false)}
        onAdd={list => {
          add(list);
          setSearching(false);
        }}
        onAddNew={() => {
          setSearching(false);
          setEditing('new');
        }}
      />
      <ContactFormModal
        open={editing !== null}
        contact={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onBack={() => {
          setEditing(null);
          setSearching(true);
        }}
        onSave={(fields, primary) => {
          if (editing === 'new') add([fields], primary);
          else if (editing) {
            update(list => list.map(x => (x.id === editing.id ? { ...x, ...fields, primary: primary || x.primary } : primary ? { ...x, primary: false } : x)));
            if (primary) t.setPage(1);
            onNotice(`${fields.name} updated.`);
          }
          setEditing(null);
        }}
        onRemove={() => {
          if (editing && editing !== 'new') setRemoving(editing);
          setEditing(null);
        }}
      />
      <RemoveContactModal
        contact={removing}
        others={contacts.filter(c => c.id !== removing?.id && c.active)}
        warehouseName={warehouseName}
        onClose={() => setRemoving(null)}
        onConfirm={newPrimary => {
          if (removing) {
            update(list => list.filter(x => x.id !== removing.id).map(x => (newPrimary ? { ...x, primary: x.id === newPrimary } : x)));
            setSelected(s => s.filter(id => id !== removing.id));
            onNotice(`${removing.name} removed from ${warehouseName}’s contacts.`);
          }
          setRemoving(null);
        }}
      />
    </div>
  );
}
