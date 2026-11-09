import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../../components/Button/Button';
import type { DataSort } from '../../../../../components/DataHeader/DataHeader';
import { DataTable, type DataColumn } from '../../../../../components/DataTable/DataTable';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { Tag } from '../../../../../components/Tag/Tag';
import { TextInput } from '../../../../../components/TextInput/TextInput';
import { Tile } from '../../../../../components/Tile/Tile';
import { AddressFields, addressFromDraft, withCountry, type AddressDraft, type AddressErrors } from '../AddressFields';
import { todayIso } from '../orders/orderData';
import { useOrders } from '../orders/orderStore';
import { TIME_ZONES, defaultTimeZone, timeZoneOf } from '../timeZones';
import { COUNTRIES, formatAddress, type Warehouse } from '../warehouseData';
import type { Carrier } from '../warehouseRecordData';
import { setCarriers, useCarriers } from '../warehouseStore';
import { CarrierFormModal, RemoveCarrierModal, SearchCarrierModal } from './CarrierModals';
import { RowMenu } from './RowMenu';
import { StatusPill } from './tableKit';
import styles from '../record.module.css';
import table from '../table.module.css';

/** The Warehouse Details card's fields; the record page keeps them so the header's Save can save them. */
export type DetailsDraft = {
  name: string;
  /** A picked time zone; empty follows the address (timeZones.ts). */
  timeZone: string;
} & AddressDraft;
export type DetailsErrors = { name?: string } & AddressErrors;

const required = (text: string): ReactNode => (
  <>
    {text} <span className={styles.requiredMark}>*</span>
  </>
);

// Volt "Data Table" (Base 3299:1399): headers with the sort icon, then the status pill (no header) before the •••
const CARRIER_COLUMNS: DataColumn[] = [
  { key: 'name', label: 'Name', width: 'fill' },
  { key: 'account', label: 'Account #', width: 'fill' },
  { key: 'nickname', label: 'Account Nickname', width: 'fill' },
  { key: 'billing', label: 'Billing Type', width: 'fill' },
  { key: 'services', label: 'Service Type', width: 'fill' },
  { key: 'status', label: 'Status', width: 120, align: 'end', labelHidden: true, sortable: false },
];

const ORDERS_PATH = '/app/inventory/orders';
const dollars = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/**
 * Warehouse record › Details (Figma 18:11145): the KPI tiles, the Warehouse Details card (read-only until the header's
 * Edit, then a form the header's Save saves) and the Carrier Accounts table with its Search / Add / Edit Carrier modals.
 */
export function DetailsTab({
  warehouse: w,
  editing,
  draft,
  errors,
  onDraftChange,
  onNotice,
  onOpenTab,
}: {
  warehouse: Warehouse;
  /** Shows the Warehouse Details form instead of the read-only fields. */
  editing: boolean;
  draft: DetailsDraft;
  errors: DetailsErrors;
  onDraftChange: (draft: DetailsDraft) => void;
  onNotice: (text: string) => void;
  /** Opens another of the record's tabs (a KPI tile's target). */
  onOpenTab: (tab: string) => void;
}) {
  const set = (key: keyof DetailsDraft) => (value: string) => onDraftChange({ ...draft, [key]: value });

  return (
    <div className={styles.tab}>
      <WarehouseKpis warehouse={w} onOpenTab={onOpenTab} />

      <section className={styles.card} aria-labelledby="wh-details-title">
        <div className={styles.cardHead}>
          <h2 id="wh-details-title" className={styles.cardTitle}>
            Warehouse Details
          </h2>
        </div>
        {editing ? (
          <div className={styles.form}>
            <div className={styles.detailsGrid}>
              <TextInput label={required('Warehouse Name')} value={draft.name} onChange={e => set('name')(e.target.value)} error={errors.name} required />
              <Dropdown label="Country *" options={COUNTRIES.map(c => ({ value: c, label: c }))} value={draft.country} onChange={v => onDraftChange({ ...draft, ...withCountry(draft, v as string) })} required />
              {/* Follows the address until a zone is picked */}
              <Dropdown
                label="Time Zone"
                options={TIME_ZONES.map(z => ({ value: z, label: z }))}
                value={draft.timeZone || defaultTimeZone(addressFromDraft(draft))}
                onChange={v => set('timeZone')(v as string)}
              />
            </div>
            {/* The address rows follow the country (AddressFields): Mexico uses calle, números, colonia, C.P., municipio, estado */}
            <AddressFields draft={draft} onChange={d => onDraftChange({ ...draft, ...d })} errors={errors} />
          </div>
        ) : (
          // Figma: each field is a label (Tiny / Regular, Gray Text/Weak) over its value (Medium / Bold, Gray Text/Strong)
          <dl className={styles.detailsGrid}>
            <Field label="Warehouse Name">{w.name}</Field>
            <Field label="Warehouse ID" wide>
              {w.code}
            </Field>
            <Field label="Address">{formatAddress(w)}</Field>
            <Field label="Country">{w.country}</Field>
            <Field label="Time Zone">{timeZoneOf(w)}</Field>
          </dl>
        )}
      </section>

      <CarrierAccounts code={w.code} warehouseName={w.name} onNotice={onNotice} />
    </div>
  );
}

/** One read-only field; `wide` spans the grid's last two columns (Warehouse ID beside the name). */
function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={styles.field} data-wide={wide || undefined}>
      <dt className="text-tiny-regular">{label}</dt>
      <dd className="text-medium-bold">{children}</dd>
    </div>
  );
}

/* ---------- KPI tiles ---------- */

/**
 * Figma "KPIs": eight design-system Tiles (Tile / KPI). Inventory Value, Locations and Open Orders come from this
 * warehouse's data; the others show Figma's sample figures until those workflows exist. Each opens what it counts.
 */
function WarehouseKpis({ warehouse: w, onOpenTab }: { warehouse: Warehouse; onOpenTab: (tab: string) => void }) {
  const navigate = useNavigate();
  const orders = useOrders();
  const open = orders.filter(o => o.warehouse === w.code && o.status === 'In Process');
  const today = todayIso();
  const weekOut = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  const dueThisWeek = open.filter(o => o.due && o.due >= today && o.due <= weekOut).length;
  const utilization = w.locations ? Math.round((w.filled / w.locations) * 100) : 0;
  const toOrders = () => navigate(`${ORDERS_PATH}?q=${encodeURIComponent(w.code)}`);

  const tiles = [
    { icon: 'dollar-sign', label: 'Inventory Value', value: dollars(w.value), note: '+3.2% vs last 30 days', onClick: () => onOpenTab('stock') },
    {
      icon: 'location',
      label: 'Locations',
      value: w.locations.toLocaleString('en-US'),
      note: `${w.filled.toLocaleString('en-US')} Filled. ${utilization}% Utilization`,
      onClick: () => onOpenTab('locations'),
    },
    { icon: 'caution', label: 'Below Reorder Point', value: '14 items', note: '5 with no open PO', onClick: () => onOpenTab('items') },
    { icon: 'orders', label: 'Open Orders', value: open.length.toLocaleString('en-US'), note: `${dueThisWeek} due this week`, onClick: toOrders },
    { icon: 'in-process', label: 'Waiting for Approval', value: '6', note: '2 older than 3 days', onClick: toOrders },
    { icon: 'review', label: 'Pending Review', value: '4', note: '1 with a discrepancy', onClick: toOrders },
    { icon: 'archive', label: 'In Transit', value: '3', note: '2 arriving tomorrow', onClick: toOrders },
    { icon: 'solar', label: 'Stock needed for projects', value: '3 short', note: 'For Sale orders due in 14 days', onClick: toOrders },
  ];

  return (
    <ul className={styles.kpis} aria-label={`${w.name} key figures`}>
      {tiles.map(t => (
        <li key={t.label}>
          <Tile icon={t.icon} label={t.label} value={t.value} note={t.note} onClick={t.onClick} />
        </li>
      ))}
    </ul>
  );
}

/* ---------- Carrier Accounts ---------- */

function CarrierAccounts({ code, warehouseName, onNotice }: { code: string; warehouseName: string; onNotice: (text: string) => void }) {
  const carriers = useCarriers(code);
  const [sort, setSort] = useState<DataSort | undefined>();
  const [selected, setSelected] = useState<string[]>([]);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [editing, setEditing] = useState<Carrier | 'new' | null>(null);
  // ••• › Copy: the Add Carrier Account form, filled from this account
  const [copyOf, setCopyOf] = useState<Carrier | null>(null);
  const [removing, setRemoving] = useState<Carrier | null>(null);
  // A column's text, for its sort (Service Type: the tags joined)
  const text = (c: Carrier, key: string) => (key === 'services' ? c.services.join(', ') : c[key as 'name' | 'account' | 'nickname' | 'billing']);
  const rows = sort ? [...carriers].sort((a, b) => text(a, sort.key).localeCompare(text(b, sort.key)) * (sort.direction === 'ascending' ? 1 : -1)) : carriers;

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
        {/* Figma "Solid / Teal / Icon": Button Small Brand with a left icon */}
        <Button size="small" variant="brand" icon="plus" onClick={() => setSearching(true)}>
          Add Carrier
        </Button>
      </div>
      {/*
        Volt Data Table. The whole row opens Edit Carrier Account: a click on a row's own controls (checkbox, name, •••,
        its menu) does its own thing; the underlined name is the keyboard way in.
      */}
      <div
        className={styles.clickRows}
        onClick={e => {
          const target = e.target as Element;
          if (target.closest('button, a, input, label, select, [role="menu"]')) return;
          const row = target.closest('[role="row"]');
          if (!row || row.querySelector('[role="columnheader"]')) return;
          const bodyRows = [...e.currentTarget.querySelectorAll('[role="row"]')].filter(r => !r.querySelector('[role="columnheader"]'));
          const c = rows[bodyRows.indexOf(row)];
          if (c) setEditing(c);
        }}
      >
        <DataTable
          aria-label="Carrier accounts"
          columns={CARRIER_COLUMNS}
          rows={rows}
          rowLabel={c => `${c.name} ${c.account}`}
          selected={selected}
          onSelectedChange={setSelected}
          sort={sort}
          onSortChange={key =>
            setSort(s => (s?.key === key ? { key, direction: s.direction === 'ascending' ? 'descending' : 'ascending' } : { key, direction: 'ascending' }))
          }
          inactive={c => !c.active}
          actionsVisible
          empty="No carrier accounts yet. Use Add Carrier to add one."
          onMore={c => setMenuFor(m => (m === c.id ? null : c.id))}
          renderAfterRow={c =>
            menuFor === c.id && (
              <RowMenu
                label={`${c.name} ${c.account}`}
                onClose={() => setMenuFor(null)}
                items={[
                  { label: 'Edit', onSelect: () => setEditing(c) },
                  {
                    label: 'Copy',
                    onSelect: () => {
                      setCopyOf(c);
                      setEditing('new');
                    },
                  },
                  {
                    label: c.active ? 'Deactivate' : 'Activate',
                    onSelect: () => {
                      update(list => list.map(x => (x.id === c.id ? { ...x, active: !c.active } : x)));
                      onNotice(`${c.name} account ${c.account} ${c.active ? 'deactivated' : 'activated'}.`);
                    },
                  },
                  { label: 'Remove', onSelect: () => setRemoving(c) },
                ]}
              />
            )
          }
          cells={c => ({
            // Like Contacts: the name is a link-styled button that opens Edit Carrier Account
            name: (
              <button type="button" className={styles.cellLink} onClick={() => setEditing(c)}>
                {c.name}
              </button>
            ),
            account: c.account,
            nickname: c.nickname,
            billing: c.billing,
            services: (
              <span className={table.tags}>
                {c.services.map(sv => (
                  <Tag key={sv} size="tiny">
                    {sv}
                  </Tag>
                ))}
              </span>
            ),
            // The app's table status: a dot and the word (orange Active, gray Inactive)
            status: <StatusPill active={c.active} />,
          })}
        />
      </div>

      <SearchCarrierModal
        open={searching}
        onClose={() => setSearching(false)}
        existing={carriers}
        onAdd={list => {
          update(all => [...all, ...list.map((c, i) => ({ ...c, id: `c${Date.now()}-${i}` }))]);
          onNotice(list.length === 1 ? `${list[0]!.name} account ${list[0]!.account} added.` : `${list.length} carrier accounts added.`);
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
        copyOf={editing === 'new' ? copyOf : null}
        onClose={() => {
          setEditing(null);
          setCopyOf(null);
        }}
        onSave={c => {
          if (editing === 'new') add(c);
          else if (editing) {
            update(list => list.map(x => (x.id === editing.id ? { ...c, id: editing.id } : x)));
            onNotice(`${c.name} account ${c.account} updated.`);
          }
          setEditing(null);
          setCopyOf(null);
        }}
        onRemove={() => {
          if (editing && editing !== 'new') setRemoving(editing);
          setEditing(null);
        }}
      />
      <RemoveCarrierModal
        carrier={removing}
        warehouseName={warehouseName}
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
