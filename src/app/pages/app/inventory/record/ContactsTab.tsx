import { useState } from 'react';
import { Button } from '../../../../../components/Button/Button';
import { DataHeader, type DataColumn, type DataSort } from '../../../../../components/DataHeader/DataHeader';
import { DataRow } from '../../../../../components/DataRow/DataRow';
import { Icon } from '../../../../../components/Icon/Icon';
import { Tag } from '../../../../../components/Tag/Tag';
import type { Contact } from '../warehouseRecordData';
import { setContacts, useContacts } from '../warehouseStore';
import { ContactFormModal, RemoveContactModal, SearchContactsModal } from './ContactModals';
import { RowMenu } from './RowMenu';
import styles from '../record.module.css';
import table from '../table.module.css';

const COLUMNS: DataColumn[] = [
  // Figma: just the 20px star, 16px from the checkbox (the button's 4px padding on each side makes 28)
  { key: 'primary', label: 'Primary contact', width: 28, labelHidden: true, sortable: false },
  { key: 'name', label: 'Name', width: 136 },
  { key: 'phone', label: 'Phone #', width: 120 },
  // Email keeps a fixed width (addresses shouldn't wrap); the tags column takes the rest
  { key: 'email', label: 'Email', width: 170 },
  { key: 'role', label: 'Role', width: 120 },
  { key: 'additionalRoles', label: 'Additional Roles', width: 'fill', sortable: false },
  // Figma: the status pill has no header, and sits right before the ••• button
  { key: 'status', label: 'Status', width: 110, align: 'end', labelHidden: true, sortable: false },
];

/**
 * Warehouse record › Contacts (Figma 537:57135; general note 2): the people who work at the warehouse. The ★ marks the
 * primary contact; a name opens Edit Contact, and Add Contact searches the CRM first.
 */
export function ContactsTab({ code, onNotice }: { code: string; onNotice: (text: string) => void }) {
  const contacts = useContacts(code);
  const [sort, setSort] = useState<DataSort | undefined>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [editing, setEditing] = useState<Contact | 'new' | null>(null);
  const [removing, setRemoving] = useState<Contact | null>(null);

  const rows = sort
    ? [...contacts].sort((a, b) => {
        const k = sort.key as 'name' | 'phone' | 'email' | 'role';
        return a[k].localeCompare(b[k]) * (sort.direction === 'ascending' ? 1 : -1);
      })
    : contacts;

  const update = (next: (list: Contact[]) => Contact[]) => setContacts(code, next);
  function add(fields: Omit<Contact, 'id' | 'primary'>) {
    // The first contact added to an empty list becomes the primary one
    update(list => [...list, { ...fields, id: `p${Date.now()}`, primary: list.length === 0 }]);
    onNotice(`${fields.name} added to this warehouse’s contacts.`);
  }
  function makePrimary(c: Contact) {
    update(list => list.map(x => ({ ...x, primary: x.id === c.id })));
    onNotice(`${c.name} is now the primary contact.`);
  }

  return (
    <div className={styles.tab}>
      <section className={styles.card} aria-label="Contacts">
        {/* Figma: an untitled card with Add Contact on the right */}
        <div className={styles.cardHead} data-align="end">
          <Button size="small" variant="brand" icon="plus" onClick={() => setSearching(true)}>
            Add Contact
          </Button>
        </div>
        <div className={table.tableScroll}>
          <div role="table" aria-label="Warehouse contacts" className={table.table}>
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
            {rows.length === 0 && <p className={`text-medium-regular ${styles.emptyRow}`}>No contacts yet. Use Add Contact to add the people who work here.</p>}
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
                    phone: c.phone || '—',
                    email: c.email || '—',
                    role: c.role || '—',
                    additionalRoles: (
                      <span className={table.tags}>
                        {c.additionalRoles.map(r => (
                          <Tag key={r} variant="tiny" tabIndex={-1}>
                            {r}
                          </Tag>
                        ))}
                      </span>
                    ),
                    status: (
                      <span className={table.status} data-active={c.active || undefined}>
                        {c.active ? 'Active' : 'Inactive'}
                      </span>
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
                      { label: 'Edit', icon: 'edit', onSelect: () => setEditing(c) },
                      ...(c.primary ? [] : [{ label: 'Make Primary', icon: 'star', onSelect: () => makePrimary(c) }]),
                      {
                        label: c.active ? 'Deactivate' : 'Activate',
                        icon: c.active ? 'visibility-off' : 'check',
                        onSelect: () => {
                          update(list => list.map(x => (x.id === c.id ? { ...x, active: !c.active } : x)));
                          onNotice(`${c.name} ${c.active ? 'deactivated' : 'activated'}.`);
                        },
                      },
                      { label: 'Remove', icon: 'delete', onSelect: () => setRemoving(c) },
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
        onPick={c => {
          add(c);
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
        onSave={fields => {
          if (editing === 'new') add(fields);
          else if (editing) {
            update(list => list.map(x => (x.id === editing.id ? { ...x, ...fields } : x)));
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
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) {
            update(list => {
              const rest = list.filter(x => x.id !== removing.id);
              // Removing the primary contact passes the ★ to the next one
              return removing.primary && rest.length > 0 ? rest.map((x, i) => ({ ...x, primary: i === 0 })) : rest;
            });
            onNotice(`${removing.name} removed from this warehouse’s contacts.`);
          }
          setRemoving(null);
        }}
      />
    </div>
  );
}
