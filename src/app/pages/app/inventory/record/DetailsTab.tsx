import { useState, type ReactNode } from 'react';
import { Button } from '../../../../../components/Button/Button';
import { DataHeader, type DataColumn, type DataSort } from '../../../../../components/DataHeader/DataHeader';
import { DataRow } from '../../../../../components/DataRow/DataRow';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { Tag } from '../../../../../components/Tag/Tag';
import { TextInput } from '../../../../../components/TextInput/TextInput';
import { AddressFields, withCountry, type AddressDraft, type AddressErrors } from '../AddressFields';
import { COUNTRIES } from '../warehouseData';
import type { Carrier } from '../warehouseRecordData';
import { setCarriers, useCarriers } from '../warehouseStore';
import { CarrierFormModal, RemoveCarrierModal, SearchCarrierModal } from './CarrierModals';
import { RowMenu } from './RowMenu';
import styles from '../record.module.css';
import table from '../table.module.css';

/** The Warehouse Details card's fields; the record page keeps them so the header's Save can save them. */
export type DetailsDraft = { name: string } & AddressDraft;
export type DetailsErrors = { name?: string } & AddressErrors;

const required = (text: string): ReactNode => (
  <>
    {text} <span className={styles.requiredMark}>*</span>
  </>
);

const CARRIER_COLUMNS: DataColumn[] = [
  { key: 'name', label: 'Name', width: 100 },
  { key: 'account', label: 'Account #', width: 160 },
  { key: 'nickname', label: 'Account Nickname', width: 'fill' },
  { key: 'billing', label: 'Billing Type', width: 130 },
  { key: 'services', label: 'Service Type', width: 150, sortable: false },
  // Figma: the status pill has no header, and sits right before the ••• button
  { key: 'status', label: 'Status', width: 120, align: 'end', labelHidden: true, sortable: false },
];

/**
 * Warehouse record › Details (Figma 380:28637): the Warehouse Details form (saved by the header's Save) and the
 * Carrier Accounts table with its Search / Add / Edit Carrier modals.
 */
export function DetailsTab({
  code,
  draft,
  errors,
  onDraftChange,
  onNotice,
}: {
  code: string;
  draft: DetailsDraft;
  errors: DetailsErrors;
  onDraftChange: (draft: DetailsDraft) => void;
  onNotice: (text: string) => void;
}) {
  const set = (key: keyof DetailsDraft) => (value: string) => onDraftChange({ ...draft, [key]: value });

  return (
    <div className={styles.tab}>
      <section className={styles.card} aria-labelledby="wh-details-title">
        <div className={styles.cardHead}>
          <h2 id="wh-details-title" className={styles.cardTitle}>
            Warehouse Details
          </h2>
        </div>
        <div className={styles.form}>
          <div className={styles.wideNarrow}>
            <TextInput label={required('Warehouse Name')} value={draft.name} onChange={e => set('name')(e.target.value)} error={errors.name} required />
            <Dropdown label="Country *" options={COUNTRIES.map(c => ({ value: c, label: c }))} value={draft.country} onChange={v => onDraftChange({ ...draft, ...withCountry(draft, v as string) })} required />
          </div>
          {/* The address rows follow the country (AddressFields): Mexico uses calle, números, colonia, C.P., municipio, estado */}
          <AddressFields draft={draft} onChange={d => onDraftChange({ ...draft, ...d })} errors={errors} />
        </div>
      </section>

      <CarrierAccounts code={code} onNotice={onNotice} />
    </div>
  );
}

/* ---------- Carrier Accounts ---------- */

function CarrierAccounts({ code, onNotice }: { code: string; onNotice: (text: string) => void }) {
  const carriers = useCarriers(code);
  const [sort, setSort] = useState<DataSort | undefined>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [editing, setEditing] = useState<Carrier | 'new' | null>(null);
  const [removing, setRemoving] = useState<Carrier | null>(null);

  const rows = sort
    ? [...carriers].sort((a, b) => {
        const k = sort.key as 'name' | 'account' | 'nickname' | 'billing';
        return a[k].localeCompare(b[k]) * (sort.direction === 'ascending' ? 1 : -1);
      })
    : carriers;

  const update = (next: (list: Carrier[]) => Carrier[]) => setCarriers(code, next);
  function add(carrier: Omit<Carrier, 'id'>) {
    update(list => [...list, { ...carrier, id: `c${Date.now()}` }]);
    onNotice(`${carrier.name} account ${carrier.account} added.`);
  }

  return (
    <section className={styles.card} aria-labelledby="wh-carriers-title">
      <div className={styles.cardHead}>
        <h2 id="wh-carriers-title" className={styles.cardTitle}>
          Carrier Accounts
        </h2>
        <Button size="small" variant="brand" icon="plus" onClick={() => setSearching(true)}>
          Add Carrier
        </Button>
      </div>
      <div className={table.tableScroll}>
        <div role="table" aria-label="Carrier accounts" className={`${table.table} ${table.moreVisible}`}>
          <DataHeader
            className={table.head}
            corners="none"
            columns={CARRIER_COLUMNS}
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
              No carrier accounts yet. Use Add Carrier to add one.
            </p>
          )}
          {rows.map((c, i) => (
            <div key={c.id} className={table.rowWrap} data-stripe={i % 2 === 0 || undefined} data-inactive={!c.active || undefined}>
              <DataRow
                className={table.row}
                columns={CARRIER_COLUMNS}
                leading="checkbox"
                cells={{
                  name: c.name,
                  account: c.account,
                  nickname: c.nickname,
                  billing: c.billing,
                  services: (
                    <span className={table.tags}>
                      {c.services.map(s => (
                        <Tag key={s} variant="tiny" tabIndex={-1}>
                          {s}
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
                selectLabel={`Select ${c.name} ${c.account}`}
                moreLabel={`More actions for ${c.name} ${c.account}`}
                onMore={() => setMenuFor(m => (m === c.id ? null : c.id))}
              />
              {menuFor === c.id && (
                <RowMenu
                  label={`${c.name} ${c.account}`}
                  onClose={() => setMenuFor(null)}
                  items={[
                    { label: 'Edit', icon: 'edit', onSelect: () => setEditing(c) },
                    {
                      label: c.active ? 'Deactivate' : 'Activate',
                      icon: c.active ? 'visibility-off' : 'check',
                      onSelect: () => {
                        update(list => list.map(x => (x.id === c.id ? { ...x, active: !c.active } : x)));
                        onNotice(`${c.name} account ${c.account} ${c.active ? 'deactivated' : 'activated'}.`);
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

      <SearchCarrierModal
        open={searching}
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
      <CarrierFormModal
        open={editing !== null}
        carrier={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onSave={c => {
          if (editing === 'new') add(c);
          else if (editing) {
            update(list => list.map(x => (x.id === editing.id ? { ...c, id: editing.id } : x)));
            onNotice(`${c.name} account ${c.account} updated.`);
          }
          setEditing(null);
        }}
        onRemove={() => {
          if (editing && editing !== 'new') setRemoving(editing);
          setEditing(null);
        }}
      />
      <RemoveCarrierModal
        carrier={removing}
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) {
            update(list => list.filter(x => x.id !== removing.id));
            onNotice(`${removing.name} account ${removing.account} removed.`);
          }
          setRemoving(null);
        }}
      />
    </section>
  );
}
