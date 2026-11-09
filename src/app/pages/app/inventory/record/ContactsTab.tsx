import { useState } from 'react';
import { Button } from '../../../../../components/Button/Button';
import { DataHeader, type DataColumn, type DataSort } from '../../../../../components/DataHeader/DataHeader';
import { DataRow } from '../../../../../components/DataRow/DataRow';
import { Icon } from '../../../../../components/Icon/Icon';
import { SearchInput } from '../../../../../components/SearchBar/SearchBar';
import { Tag } from '../../../../../components/Tag/Tag';
import { INTERNAL_COMPANY, type Contact } from '../warehouseRecordData';
import { setContacts, useContacts } from '../warehouseStore';
import { ContactFormModal, RemoveContactModal, SearchContactsModal, type ContactFields } from './ContactModals';
import { RowMenu } from './RowMenu';
import { StatusPill } from './tableKit';
import styles from '../record.module.css';
import table from '../table.module.css';

const COLUMNS: DataColumn[] = [
  // Figma: just the 20px star, 16px from the checkbox (the button's 4px padding on each side makes 28)
  { key: 'primary', label: 'Primary contact', width: 28, labelHidden: true, sortable: false },
  { key: 'name', label: 'Name', width: 140, filterable: true },
  { key: 'company', label: 'Company', width: 'fill', filterable: true },
  { key: 'phone', label: 'Phone', width: 130, filterable: true },
  // Email keeps a fixed width so addresses don't wrap mid-word
  { key: 'email', label: 'Email', width: 210, filterable: true },
  { key: 'role', label: 'Primary Role', width: 150, filterable: true },
  { key: 'additionalRoles', label: 'Additional Roles', width: 'fill', filterable: true, sortable: true },
  // Figma: the status pill sits right before the ••• button
  { key: 'status', label: 'Status', width: 110, align: 'end', labelHidden: true, sortable: false },
];

type Who = 'all' | 'internal' | 'external';
const isInternal = (c: Pick<Contact, 'company'>) => c.company === INTERNAL_COMPANY;
/** "Acme Solar (Internal)": the company's own people are marked internal (Figma 848:20960). */
const companyText = (c: Contact) => (c.company ? (isInternal(c) ? `${c.company} (Internal)` : c.company) : '—');

/**
 * Warehouse record › Contacts (Figma 848:20960): All / Internal / External, search, and the people who work with the
 * warehouse. The ★ marks the primary contact; a name opens Edit Contact, and Add Contact searches the CRM first.
 */
export function ContactsTab({ code, warehouseName, onNotice }: { code: string; warehouseName: string; onNotice: (text: string) => void }) {
  const contacts = useContacts(code);
  const [who, setWho] = useState<Who>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<DataSort | undefined>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [editing, setEditing] = useState<Contact | 'new' | null>(null);
  const [removing, setRemoving] = useState<Contact | null>(null);

  const q = query.trim().toLowerCase();
  const text = (c: Contact, key: string) => (key === 'additionalRoles' ? c.additionalRoles.join(', ') : key === 'company' ? companyText(c) : String(c[key as keyof Contact] ?? ''));
  let rows = contacts.filter(
    c => (who === 'all' || (who === 'internal') === isInternal(c)) && (!q || `${c.name} ${c.company} ${c.role} ${c.email} ${c.additionalRoles.join(' ')}`.toLowerCase().includes(q)),
  );
  if (sort) rows = [...rows].sort((a, b) => text(a, sort.key).localeCompare(text(b, sort.key)) * (sort.direction === 'ascending' ? 1 : -1));
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
    onNotice(list.length === 1 ? `${list[0]!.name} added to ${warehouseName}’s contacts.` : `${list.length} contacts added to ${warehouseName}.`);
  }
  function makePrimary(c: Contact) {
    update(list => list.map(x => ({ ...x, primary: x.id === c.id })));
    onNotice(`${c.name} is now the primary contact.`);
  }

  return (
    <div className={styles.tab}>
      <section className={styles.card} aria-label="Contacts">
        <div className={styles.contactToolbar} role="toolbar" aria-label="Contacts">
          <div className={styles.chipRow} role="group" aria-label="Show">
            {(
              [
                ['all', `All (${contacts.length})`],
                ['internal', `Internal (${internal})`],
                ['external', `External (${contacts.length - internal})`],
              ] as const
            ).map(([value, label]) => (
              <Tag key={value} size="small" selected={who === value} onClick={() => setWho(value)}>
                {label}
              </Tag>
            ))}
          </div>
          <SearchInput
            className={styles.toolbarSearch}
            aria-label="Search contacts"
            placeholder="Search contacts by name, company, role or email"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <Button size="small" variant="brand" onClick={() => setSearching(true)}>
            Add Contact
          </Button>
        </div>
        <div className={table.tableScroll}>
          <div role="table" aria-label="Warehouse contacts" className={`${table.table} ${table.moreVisible}`}>
            <DataHeader
              className={table.head}
              corners="none"
              columns={COLUMNS}
              leading="checkbox"
              sort={sort}
              onSortChange={key =>
                setSort(s => (s?.key === key ? { key, direction: s.direction === 'ascending' ? 'descending' : 'ascending' } : { key, direction: 'ascending' }))
              }
              allSelected={rows.length > 0 && rows.every(c => selected.has(c.id))}
              onSelectAllChange={on => setSelected(on ? new Set(rows.map(c => c.id)) : new Set())}
            />
            {rows.length === 0 && (
              <p className={`text-medium-regular ${styles.emptyRow}`}>
                {contacts.length ? 'No contacts match. Clear the search or choose All.' : 'No contacts yet. Use Add Contact to add the people who work here.'}
              </p>
            )}
            {rows.map((c, i) => (
              <div key={c.id} className={table.rowWrap} data-stripe={i % 2 === 0 || undefined} data-inactive={!c.active || undefined}>
                <DataRow
                  className={table.row}
                  columns={COLUMNS}
                  leading="checkbox"
                  cells={{
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
                          <Tag key={r} size="tiny">
                            {r}
                          </Tag>
                        ))}
                      </span>
                    ) : (
                      '—'
                    ),
                    status: (
                      <StatusPill active={c.active} />
                    ),
                  }}
                  selected={selected.has(c.id)}
                  onSelectedChange={on =>
                    setSelected(s => {
                      const next = new Set(s);
                      if (on) next.add(c.id);
                      else next.delete(c.id);
                      return next;
                    })
                  }
                  selectLabel={`Select ${c.name}`}
                  moreLabel={`More actions for ${c.name}`}
                  onMore={() => setMenuFor(m => (m === c.id ? null : c.id))}
                />
                {menuFor === c.id && (
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
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <SearchContactsModal
        open={searching}
        existingNames={contacts.map(c => c.name)}
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
            onNotice(`${removing.name} removed from ${warehouseName}’s contacts.`);
          }
          setRemoving(null);
        }}
      />
    </div>
  );
}
