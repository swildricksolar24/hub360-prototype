import { useRef, useState, type ReactNode } from 'react';
import { Button } from '../../../../../../components/Button/Button';
import { Checkbox } from '../../../../../../components/Checkbox/Checkbox';
import { DataHeader, type DataColumn, type DataSort } from '../../../../../../components/DataHeader/DataHeader';
import { DataRow } from '../../../../../../components/DataRow/DataRow';
import { Dropdown } from '../../../../../../components/Dropdown/Dropdown';
import { Avatar } from '../../../../../../components/Avatar/Avatar';
import { Icon } from '../../../../../../components/Icon/Icon';
import { NumericInput } from '../../../../../../components/NumericInput/NumericInput';
import { SearchInput } from '../../../../../../components/SearchBar/SearchBar';
import { TextArea } from '../../../../../../components/TextArea/TextArea';
import { TextInput } from '../../../../../../components/TextInput/TextInput';
import { UploadFile } from '../../../../../../components/UploadFile/UploadFile';
import { useAuth } from '../../../../../auth/AuthContext';
import { AppLink } from '../../../../../components/AppLink';
import { AppModal } from '../../../../../components/AppModal';
import { useHelperFlag } from '../../../../../shell/helperFlags';
import { RowMenu } from '../../record/RowMenu';
import {
  CATEGORIES,
  COMPLIANCE,
  COMPLIANCE_INFO,
  DIMENSION_UNITS,
  initialsOf,
  MANUFACTURERS,
  money,
  PACKAGE_UNITS,
  PACKAGES,
  SPEC_TEMPLATES,
  SUPPLIERS,
  today,
  UNIT_TYPES,
  WEIGHT_UNITS,
  type Item,
  type ItemSupplier,
  type Note,
  type Warranty,
  type WarrantyKind,
} from '../itemData';
import { itemPath, updateItem, useItems } from '../itemStore';
import { Card, InfoCheckbox, InfoTip, nextSort, options, required, Segment, sortRows } from '../shared';
import { DeleteNoteModal, NoteModal, RemoveSupplierModal, ReplacementModal, SupplierModal, WarrantyModal } from './DetailsModals';
import record from '../../record.module.css';
import table from '../../table.module.css';
import styles from '../items.module.css';

/** The Details cards' fields; the record page keeps them so the header's Save can save them. */
export type DetailsDraft = Pick<
  Item,
  | 'customNumber'
  | 'name'
  | 'category'
  | 'subcategory'
  | 'description'
  | 'manufacturer'
  | 'model'
  | 'lotControl'
  | 'serialized'
  | 'nonInventory'
  | 'discontinued'
  | 'compliance'
  | 'images'
  | 'specSheet'
  | 'unitType'
  | 'weight'
  | 'weightUnit'
  | 'length'
  | 'width'
  | 'height'
  | 'dimensionUnit'
  | 'categorySpecs'
  | 'packages'
  | 'minQuantity'
  | 'safetyStock'
  | 'reorderPoint'
  | 'leadTime'
  | 'autoCalculate'
  | 'lastPurchase'
>;
export type DetailsErrors = { name?: string };

export const toDraft = (i: Item): DetailsDraft => ({
  customNumber: i.customNumber,
  name: i.name,
  category: i.category,
  subcategory: i.subcategory,
  description: i.description,
  manufacturer: i.manufacturer,
  model: i.model,
  lotControl: i.lotControl,
  serialized: i.serialized,
  nonInventory: i.nonInventory,
  discontinued: i.discontinued,
  compliance: i.compliance,
  images: i.images,
  specSheet: i.specSheet,
  unitType: i.unitType,
  weight: i.weight,
  weightUnit: i.weightUnit,
  length: i.length,
  width: i.width,
  height: i.height,
  dimensionUnit: i.dimensionUnit,
  categorySpecs: i.categorySpecs,
  packages: i.packages,
  minQuantity: i.minQuantity,
  safetyStock: i.safetyStock,
  reorderPoint: i.reorderPoint,
  leadTime: i.leadTime,
  autoCalculate: i.autoCalculate,
  lastPurchase: i.lastPurchase,
});

type Props = {
  item: Item;
  draft: DetailsDraft;
  errors: DetailsErrors;
  onDraftChange: (draft: DetailsDraft) => void;
  onNotice: (text: string) => void;
};

/**
 * Item record › Details (ITEMS.md §2; Figma Part 127:6327, Assembly 411:62773, Kit 411:65254). The same cards serve
 * all three types, with the labels following the type. The form cards are saved by the header's Save; the tables
 * (warranty, replacements, suppliers, notes) save as they change. A category without a spec template leaves out
 * Category Specs.
 */
export function DetailsTab({ item, draft, errors, onDraftChange, onNotice }: Props) {
  const set = <K extends keyof DetailsDraft>(key: K, value: DetailsDraft[K]) => onDraftChange({ ...draft, [key]: value });
  const template = SPEC_TEMPLATES[draft.category];

  // The short form cards and the 3-column Replacement table pair up two per row. The spec cards, and the tables with
  // more columns (Warranty with its switch, Supplier, Notes), run full width so their columns fit (table.module.css).
  const pairs: ReactNode[][] = [
    [<PackageCard key="packages" draft={draft} set={set} />, <ReorderCard key="reorder" draft={draft} set={set} />],
    [<LastPurchaseCard key="last-purchase" draft={draft} set={set} />, <ReplacementCard key="replacement" item={item} onNotice={onNotice} />],
  ];

  return (
    <div className={record.tab}>
      <GeneralInformation item={item} draft={draft} errors={errors} set={set} onDraftChange={onDraftChange} />
      <GeneralSpecs draft={draft} set={set} />
      {template && <CategorySpecs draft={draft} set={set} template={template} />}
      {pairs.map((pair, i) => (
        <div key={i} className={styles.pair}>
          {pair}
        </div>
      ))}
      <WarrantyCard item={item} onNotice={onNotice} />
      <SupplierCard item={item} onNotice={onNotice} />
      <NotesCard item={item} onNotice={onNotice} />
    </div>
  );
}

type SetField = <K extends keyof DetailsDraft>(key: K, value: DetailsDraft[K]) => void;

/* ---------- General Information ---------- */

const FLAGS: { key: 'lotControl' | 'serialized' | 'nonInventory' | 'discontinued'; label: string; info: string }[] = [
  { key: 'lotControl', label: 'Lot Control', info: 'Track this item by lot, so a recall can find every unit from one batch.' },
  { key: 'serialized', label: 'Serialized', info: 'Every unit has its own serial #, recorded when it is received and shipped.' },
  { key: 'nonInventory', label: 'Non-Inventory Item', info: 'Bought or sold, but not counted as stock (for example a service or a fee).' },
  { key: 'discontinued', label: 'Discontinued', info: 'No longer ordered. Stock on hand can still be used.' },
];

function GeneralInformation({ item, draft, errors, set, onDraftChange }: { item: Item; draft: DetailsDraft; errors: DetailsErrors; set: SetField; onDraftChange: (d: DetailsDraft) => void }) {
  const word = item.type;
  return (
    <Card
      id="item-general"
      title="General Information"
      action={
        <div className={styles.titleChecks}>
          {FLAGS.map(f => (
            <InfoCheckbox key={f.key} label={f.label} info={f.info} checked={draft[f.key]} onChange={on => set(f.key, on)} />
          ))}
        </div>
      }
    >
      <div className={record.form}>
        <div className={styles.fields4}>
          <div className={styles.readOnlyField}>
            <span className={styles.readOnlyLabel} id="item-system-number">
              System {word} #
            </span>
            <span className={styles.readOnlyValue} aria-labelledby="item-system-number">
              <Icon name="lock" size={20} color="currentColor" />
              {item.id}
            </span>
          </div>
          <TextInput label={`Custom ${word} #`} value={draft.customNumber} onChange={e => set('customNumber', e.target.value)} />
          <Dropdown
            label="Category"
            placeholder="Select"
            options={options(Object.keys(CATEGORIES))}
            value={draft.category || null}
            onChange={v => {
              // A new category clears a subcategory that isn't in it
              const category = v as string;
              onDraftChange({ ...draft, category, subcategory: CATEGORIES[category]?.includes(draft.subcategory) ? draft.subcategory : '' });
            }}
          />
          <Dropdown
            label="Subcategory"
            placeholder={draft.category ? 'Select' : 'Choose a category first'}
            disabled={!draft.category}
            options={options(CATEGORIES[draft.category] ?? [])}
            value={CATEGORIES[draft.category]?.includes(draft.subcategory) ? draft.subcategory : null}
            onChange={v => set('subcategory', v as string)}
          />
        </div>
        <div className={styles.fields3}>
          <div className={styles.column}>
            <TextInput label={required(`${word} Name`)} value={draft.name} onChange={e => set('name', e.target.value)} error={errors.name} required />
            <Dropdown label="Manufacturer" placeholder="Select" options={options(MANUFACTURERS)} value={draft.manufacturer || null} onChange={v => set('manufacturer', v as string)} />
            <TextInput label="Model #" value={draft.model} onChange={e => set('model', e.target.value)} />
          </div>
          <TextArea label={`${word} Description`} rows={9} value={draft.description} onChange={e => set('description', e.target.value)} />
          <div className={styles.column}>
            <span className={styles.readOnlyLabel}>Image(s)</span>
            <UploadFile multiple accept="image/*" hint="Supports JPG, PNG" onFiles={files => set('images', [...draft.images, ...files.map(f => f.name)])} />
            {draft.images.length > 0 && (
              <ul className={styles.fileChips} aria-label="Images">
                {draft.images.map(name => (
                  <li key={name} className={styles.fileChip}>
                    <Icon name="photo" size={20} color="currentColor" />
                    {name}
                    <button type="button" className={styles.trash} aria-label={`Remove ${name}`} onClick={() => set('images', draft.images.filter(n => n !== name))}>
                      <Icon name="close-small" size={20} color="currentColor" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <h3 className={styles.subheading}>Compliance</h3>
        <div className={styles.tiles}>
          {COMPLIANCE.map(c => (
            <div key={c} className={styles.tile}>
              <Checkbox
                size="small"
                label={c}
                checked={draft.compliance.includes(c)}
                onChange={e => set('compliance', e.target.checked ? [...draft.compliance, c] : draft.compliance.filter(x => x !== c))}
              />
              <InfoTip label={c} text={COMPLIANCE_INFO[c]} />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ---------- General Specs, Category Specs ---------- */

function GeneralSpecs({ draft, set }: { draft: DetailsDraft; set: SetField }) {
  const file = useRef<HTMLInputElement>(null);
  return (
    <Card id="item-general-specs" title="General Specs">
      <div className={record.form}>
        <div className={styles.segmentRow}>
          <div className={styles.search}>
            <TextInput label="Spec Sheet" value={draft.specSheet} placeholder="No file chosen" readOnly leftIcon="document" />
          </div>
          <Button size="small" variant="outline" icon="upload" onClick={() => file.current?.click()}>
            Choose File
          </Button>
          <input
            ref={file}
            type="file"
            hidden
            accept=".pdf,.doc,.docx"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) set('specSheet', f.name);
              e.target.value = '';
            }}
          />
        </div>
        <div className={styles.fields3}>
          <Dropdown label="Unit Type" options={options(UNIT_TYPES)} value={draft.unitType} onChange={v => set('unitType', v as string)} />
          <NumericInput label="Weight" min={0} step={0.01} value={draft.weight} onValueChange={v => set('weight', v)} />
          <Dropdown label="Unit of Measure" options={options(WEIGHT_UNITS)} value={draft.weightUnit} onChange={v => set('weightUnit', v as string)} />
        </div>
        <div className={styles.fields4}>
          <NumericInput label="Length" min={0} step={0.1} value={draft.length} onValueChange={v => set('length', v)} />
          <NumericInput label="Width" min={0} step={0.1} value={draft.width} onValueChange={v => set('width', v)} />
          <NumericInput label="Height" min={0} step={0.1} value={draft.height} onValueChange={v => set('height', v)} />
          <Dropdown label="Unit of Measure" options={options(DIMENSION_UNITS)} value={draft.dimensionUnit} onChange={v => set('dimensionUnit', v as string)} />
        </div>
      </div>
    </Card>
  );
}

function CategorySpecs({ draft, set, template }: { draft: DetailsDraft; set: SetField; template: { key: string; label: string }[][] }) {
  return (
    <Card id="item-category-specs" title="Category Specs">
      <div className={record.form}>
        {template.map((row, i) => (
          <div key={i} className={styles.specRow}>
            {row.map(f => (
              <TextInput
                key={f.key}
                label={f.label}
                value={draft.categorySpecs[f.key] ?? ''}
                onChange={e => set('categorySpecs', { ...draft.categorySpecs, [f.key]: e.target.value })}
              />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- Warranty ---------- */

const WARRANTY_COLUMNS: DataColumn[] = [
  { key: 'category', label: 'Category', width: 'fill' },
  { key: 'term', label: 'Term (Months)', width: 150 },
  { key: 'document', label: 'Warranty Document', width: 200, sortable: false },
];

function WarrantyCard({ item, onNotice }: { item: Item; onNotice: (t: string) => void }) {
  const [kind, setKind] = useState<WarrantyKind>('standard');
  const [editing, setEditing] = useState<'add' | 'edit' | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Warranty | null>(null);
  const [sort, setSort] = useState<DataSort | undefined>();
  const months = (w: Warranty) => (w.termUnit === 'Years' ? w.term * 12 : w.term);
  const rows = sortRows(
    item.warranties.filter(w => w.kind === kind),
    sort,
    (w, k) => (k === 'term' ? months(w) : w.category),
  );
  const save = (list: Warranty[]) => updateItem(item.id, i => ({ ...i, warranties: [...i.warranties.filter(w => w.kind !== kind), ...list] }));

  return (
    <Card
      id="item-warranty"
      title="Warranty"
      action={
        <>
          <Segment
            label="Warranty type"
            value={kind}
            options={[
              { value: 'standard', label: 'Standard Warranties' },
              { value: 'extended', label: 'Extended Warranties' },
            ]}
            onChange={setKind}
          />
          <Button size="small" variant="brand" icon="plus" onClick={() => setEditing('add')}>
            Add Warranty Information
          </Button>
        </>
      }
    >
      <div className={table.tableScroll}>
        <div role="table" aria-label={`${kind === 'standard' ? 'Standard' : 'Extended'} warranties`} className={table.table}>
          <DataHeader className={table.head} corners="none" columns={WARRANTY_COLUMNS} leading="none" sort={sort} onSortChange={k => setSort(nextSort(k))} />
          {rows.length === 0 && (
            <p className={`text-medium-regular ${record.emptyRow}`}>No {kind} warranties yet. Use Add Warranty Information to add one.</p>
          )}
          {rows.map((w, i) => (
            <div key={w.id} className={table.rowWrap} data-stripe={i % 2 === 0 || undefined}>
              <DataRow
                className={table.row}
                columns={WARRANTY_COLUMNS}
                leading="none"
                cells={{
                  category: w.offeredByInstaller ? `${w.category} (offered by installer)` : w.category,
                  term: String(months(w)),
                  document: w.document ? (
                    <Button
                      size="tiny"
                      variant="text"
                      icon={w.documentKind === 'link' ? 'link-add' : 'document'}
                      onClick={() =>
                        w.documentKind === 'link' && /^https?:\/\//.test(w.document)
                          ? window.open(w.document, '_blank', 'noopener')
                          : onNotice(`${w.document} would open here; this prototype doesn’t store files.`)
                      }
                    >
                      {w.documentKind === 'link' ? 'Link' : 'View'}
                    </Button>
                  ) : (
                    '—'
                  ),
                }}
                moreLabel={`More actions for ${w.category} warranty`}
                onMore={() => setMenuFor(m => (m === w.id ? null : w.id))}
              />
              {menuFor === w.id && (
                <RowMenu
                  label={`${w.category} warranty`}
                  onClose={() => setMenuFor(null)}
                  items={[
                    { label: 'Edit', onSelect: () => setEditing('edit') },
                    { label: 'Remove', onSelect: () => setRemoving(w) },
                  ]}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <AppModal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove Warranty"
        description={removing && `The ${removing.category} warranty (${months(removing)} months) will be removed from ${item.name}.`}
        primaryAction={{
          label: 'Remove Warranty',
          danger: true,
          onClick: () => {
            if (removing) {
              updateItem(item.id, x => ({ ...x, warranties: x.warranties.filter(y => y.id !== removing.id) }));
              onNotice(`${removing.category} warranty removed.`);
            }
            setRemoving(null);
          },
        }}
      />
      <WarrantyModal
        open={editing !== null}
        kind={kind}
        warranties={item.warranties}
        startNew={editing === 'add'}
        onClose={() => setEditing(null)}
        onSave={list => {
          save(list);
          setEditing(null);
          onNotice(`${kind === 'standard' ? 'Standard' : 'Extended'} warranties saved.`);
        }}
      />
    </Card>
  );
}

/* ---------- Replacement Items ---------- */

const REPLACEMENT_COLUMNS: DataColumn[] = [
  { key: 'type', label: 'Type', width: 70 },
  { key: 'number', label: 'Item', width: 144 },
  { key: 'name', label: 'Name', width: 'fill' },
];

function ReplacementCard({ item, onNotice }: { item: Item; onNotice: (t: string) => void }) {
  const all = useItems();
  const [open, setOpen] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [sort, setSort] = useState<DataSort | undefined>();
  const inactiveReplacement = useHelperFlag('item.inactiveReplacement');
  const linked = item.replacements.map(id => all.find(i => i.id === id)).filter((i): i is Item => !!i);
  // Helper switch: "Inactive replacement" shows the first replacement as inactive, or adds an inactive item when there are none
  const fallback = all.find(i => !i.active && i.id !== item.id);
  const shown: Item[] = !inactiveReplacement ? linked : linked.length ? [{ ...linked[0], active: false }, ...linked.slice(1)] : fallback ? [fallback] : [];
  const rows = sortRows(
    shown,
    sort,
    (r, k) => (k === 'number' ? r.id : String(r[k as 'type' | 'name'])),
  );
  return (
    <Card
      id="item-replacements"
      title="Replacement Items"
      action={
        <Button size="small" variant="brand" icon="plus" onClick={() => setOpen(true)}>
          Add Replacement
        </Button>
      }
    >
      <div className={table.tableScroll}>
        <div role="table" aria-label="Replacement items" className={`${table.table} ${styles.halfTable}`}>
          <DataHeader className={table.head} corners="none" columns={REPLACEMENT_COLUMNS} leading="none" sort={sort} onSortChange={k => setSort(nextSort(k))} />
          {rows.length === 0 && <p className={`text-medium-regular ${record.emptyRow}`}>No replacement items. Use Add Replacement to add one.</p>}
          {rows.map((r, i) => (
            <div key={r.id} className={table.rowWrap} data-stripe={i % 2 === 0 || undefined} data-inactive={!r.active || undefined}>
              <DataRow
                className={table.row}
                columns={REPLACEMENT_COLUMNS}
                leading="none"
                cells={{
                  type: r.type,
                  number: (
                    <AppLink to={itemPath(r.id)} size="small">
                      {r.id}
                    </AppLink>
                  ),
                  name: r.name,
                }}
                moreLabel={`More actions for ${r.name}`}
                onMore={() => setMenuFor(m => (m === r.id ? null : r.id))}
              />
              {menuFor === r.id && (
                <RowMenu
                  label={r.name}
                  onClose={() => setMenuFor(null)}
                  items={[
                    {
                      label: 'Remove',
                      onSelect: () => {
                        updateItem(item.id, x => ({ ...x, replacements: x.replacements.filter(id => id !== r.id) }));
                        onNotice(`${r.name} is no longer a replacement.`);
                      },
                    },
                  ]}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <ReplacementModal
        open={open}
        item={item}
        all={all}
        onClose={() => setOpen(false)}
        onSave={ids => {
          updateItem(item.id, x => ({ ...x, replacements: ids }));
          setOpen(false);
          onNotice('Replacement items saved.');
        }}
      />
    </Card>
  );
}

/* ---------- Package Quantities, Reorder Details, Last Purchase ---------- */

function PackageCard({ draft, set }: { draft: DetailsDraft; set: SetField }) {
  return (
    <Card id="item-packages" title="Package Quantities">
      <div className={styles.packageGrid} data-cols="2">
        {PACKAGES.map(p => (
          <PackageQuantity key={p.key} label={p.label} value={draft.packages[p.key]} onChange={v => set('packages', { ...draft.packages, [p.key]: v })} />
        ))}
      </div>
    </Card>
  );
}

function PackageQuantity({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { quantity: number | null; unit: string };
  onChange: (v: { quantity: number | null; unit: string }) => void;
}) {
  return (
    <>
      <span className={styles.packageLabel}>{label}</span>
      <NumericInput label={`${label} Quantity`} min={0} value={value.quantity} onValueChange={q => onChange({ ...value, quantity: q })} />
      <Dropdown label="Unit of Measure" options={options(PACKAGE_UNITS)} value={value.unit} onChange={u => onChange({ ...value, unit: u as string })} />
    </>
  );
}

function ReorderCard({ draft, set }: { draft: DetailsDraft; set: SetField }) {
  return (
    <Card
      id="item-reorder"
      title="Reorder Details"
      action={
        <InfoCheckbox
          label="Auto-Calculate"
          info="Works out the reorder point from the safety stock, the lead time and the last 90 days of use."
          checked={draft.autoCalculate}
          onChange={on => set('autoCalculate', on)}
        />
      }
    >
      <div className={styles.fields2}>
        <NumericInput label="Global Min Quantity" min={0} value={draft.minQuantity} onValueChange={v => set('minQuantity', v)} />
        <NumericInput label="Global Safety Stock" min={0} value={draft.safetyStock} onValueChange={v => set('safetyStock', v)} />
        <NumericInput
          label="Global Reorder Point"
          min={0}
          value={draft.autoCalculate ? (draft.safetyStock ?? 0) + (draft.leadTime ?? 0) * 4 : draft.reorderPoint}
          onValueChange={v => set('reorderPoint', v)}
          disabled={draft.autoCalculate}
        />
        <NumericInput label="Average Lead Time (Days)" min={0} value={draft.leadTime} onValueChange={v => set('leadTime', v)} />
      </div>
    </Card>
  );
}

function LastPurchaseCard({ draft, set }: { draft: DetailsDraft; set: SetField }) {
  const lp = draft.lastPurchase;
  const change = (patch: Partial<DetailsDraft['lastPurchase']>) => set('lastPurchase', { ...lp, ...patch });
  return (
    <Card id="item-last-purchase" title="Last Purchase">
      <div className={record.form}>
        <Dropdown label="Supplier" placeholder="Select" options={options(SUPPLIERS)} value={lp.supplier || null} onChange={v => change({ supplier: v as string })} />
        <div className={styles.fields2}>
          <TextInput label="Purchase Date" placeholder="May 18, 2026" value={lp.date} onChange={e => change({ date: e.target.value })} />
          <NumericInput label="Purchase Quantity" min={0} value={lp.quantity} onValueChange={v => change({ quantity: v })} />
        </div>
        <div className={styles.fields2}>
          <Dropdown label="Unit Type" options={options(UNIT_TYPES)} value={lp.unitType} onChange={v => change({ unitType: v as string })} />
          <NumericInput label="Cost ($)" min={0} step={0.01} value={lp.cost} onValueChange={v => change({ cost: v })} />
        </div>
      </div>
    </Card>
  );
}

/* ---------- Supplier ---------- */

const SUPPLIER_COLUMNS: DataColumn[] = [
  { key: 'primary', label: 'Primary supplier', width: 56, labelHidden: true, sortable: false },
  { key: 'supplier', label: 'Supplier', width: 'fill' },
  { key: 'partNumber', label: 'Item #', width: 130 },
  { key: 'cost', label: 'Cost', width: 110, align: 'end' },
  { key: 'updated', label: 'Date', width: 130 },
  { key: 'leadTime', label: 'Lead Time (Days)', width: 160, align: 'end' },
];

function SupplierCard({ item, onNotice }: { item: Item; onNotice: (t: string) => void }) {
  const [editing, setEditing] = useState<ItemSupplier | 'new' | null>(null);
  const [removing, setRemoving] = useState<ItemSupplier | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [sort, setSort] = useState<DataSort | undefined>();
  const rows = sortRows(item.suppliers, sort, (s, k) =>
    k === 'cost' ? (s.packages.pack.cost ?? 0) : k === 'leadTime' ? (s.packages.pack.leadTime ?? 0) : k === 'updated' ? Date.parse(s.updated) || 0 : String(s[k as 'supplier' | 'partNumber']),
  );
  const update = (fn: (list: ItemSupplier[]) => ItemSupplier[]) => updateItem(item.id, i => ({ ...i, suppliers: fn(i.suppliers) }));
  const makePrimary = (s: ItemSupplier) => {
    update(list => list.map(x => ({ ...x, primary: x.id === s.id })));
    onNotice(`${s.supplier} is now the primary supplier.`);
  };

  return (
    <Card
      id="item-suppliers"
      title="Supplier"
      action={
        <Button size="small" variant="brand" icon="plus" onClick={() => setEditing('new')}>
          Add Supplier
        </Button>
      }
    >
      <div className={table.tableScroll}>
        <div role="table" aria-label="Suppliers" className={table.table}>
          <DataHeader className={table.head} corners="none" columns={SUPPLIER_COLUMNS} leading="none" sort={sort} onSortChange={k => setSort(nextSort(k))} />
          {rows.length === 0 && <p className={`text-medium-regular ${record.emptyRow}`}>No suppliers yet. Use Add Supplier to add one.</p>}
          {rows.map((s, i) => (
            <div key={s.id} className={table.rowWrap} data-stripe={i % 2 === 0 || undefined}>
              <DataRow
                className={table.row}
                columns={SUPPLIER_COLUMNS}
                leading="none"
                cells={{
                  primary: (
                    <button
                      type="button"
                      className={record.star}
                      aria-pressed={s.primary}
                      aria-label={s.primary ? `${s.supplier} is the primary supplier` : `Make ${s.supplier} the primary supplier`}
                      title={s.primary ? 'Primary supplier' : 'Make primary supplier'}
                      onClick={() => !s.primary && makePrimary(s)}
                    >
                      <Icon name={s.primary ? 'rating' : 'rating-hollow'} size={20} color="currentColor" />
                    </button>
                  ),
                  supplier: (
                    <button type="button" className={record.cellLink} onClick={() => setEditing(s)}>
                      {s.supplier}
                    </button>
                  ),
                  partNumber: s.partNumber || '—',
                  cost: money(s.packages.pack.cost),
                  updated: s.updated,
                  leadTime: s.packages.pack.leadTime == null ? '—' : String(s.packages.pack.leadTime),
                }}
                moreLabel={`More actions for ${s.supplier}`}
                onMore={() => setMenuFor(m => (m === s.id ? null : s.id))}
              />
              {menuFor === s.id && (
                <RowMenu
                  label={s.supplier}
                  onClose={() => setMenuFor(null)}
                  items={[
                    { label: 'Edit', onSelect: () => setEditing(s) },
                    ...(s.primary ? [] : [{ label: 'Make Primary', onSelect: () => makePrimary(s) }]),
                    { label: 'Remove', onSelect: () => setRemoving(s) },
                  ]}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <SupplierModal
        open={editing !== null}
        item={item}
        supplier={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onSave={s => {
          update(list => {
            const next = editing === 'new' ? [...list, s] : list.map(x => (x.id === s.id ? s : x));
            // One primary supplier: setting a new one clears the others; the first supplier is always primary
            const primary = s.primary ? s.id : next.find(x => x.primary)?.id ?? next[0]?.id;
            return next.map(x => ({ ...x, primary: x.id === primary }));
          });
          onNotice(`${s.supplier} ${editing === 'new' ? 'added' : 'updated'}.`);
          setEditing(null);
        }}
        onRemove={() => {
          if (editing && editing !== 'new') setRemoving(editing);
          setEditing(null);
        }}
      />
      <RemoveSupplierModal
        supplier={removing}
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) {
            update(list => {
              const rest = list.filter(x => x.id !== removing.id);
              return removing.primary && rest.length ? rest.map((x, i) => ({ ...x, primary: i === 0 })) : rest;
            });
            onNotice(`${removing.supplier} removed.`);
          }
          setRemoving(null);
        }}
      />
    </Card>
  );
}

/* ---------- Notes ---------- */

const NOTE_COLUMNS: DataColumn[] = [
  { key: 'author', label: 'Created By', width: 200 },
  { key: 'updated', label: 'Last Updated', width: 140 },
  { key: 'text', label: 'Note', width: 'fill', sortable: false },
  { key: 'pin', label: 'Pinned', width: 56, labelHidden: true, sortable: false },
];

function NotesCard({ item, onNotice }: { item: Item; onNotice: (t: string) => void }) {
  const { user } = useAuth();
  const me = user?.name ?? 'Oswald Cobblepot';
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Note | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Note | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [sort, setSort] = useState<DataSort | undefined>();
  const q = query.trim().toLowerCase();
  const pinned = (n: Note) => n.pinAll || (n.pinMe && n.author === me);
  // Helper switch: "No notes" lists none (the store keeps them)
  const noNotes = useHelperFlag('item.noNotes');
  const notes: Note[] = noNotes ? [] : item.notes;
  const found = notes.filter(n => !q || `${n.author} ${n.text} ${n.types.join(' ')}`.toLowerCase().includes(q));
  const sorted = sortRows(found, sort, (n, k) => (k === 'updated' ? Date.parse(n.updated) || 0 : n.author));
  // Pinned notes stay on top
  const rows = [...sorted.filter(pinned), ...sorted.filter(n => !pinned(n))];
  const update = (fn: (list: Note[]) => Note[]) => updateItem(item.id, i => ({ ...i, notes: fn(i.notes) }));

  return (
    <Card
      id="item-notes"
      title="Notes"
      action={
        <>
          <SearchInput aria-label="Search notes" placeholder="Search" value={query} onChange={e => setQuery(e.target.value)} />
          <Button size="small" variant="brand" icon="plus" onClick={() => setEditing('new')}>
            Add Note
          </Button>
        </>
      }
    >
      <div className={table.tableScroll}>
        <div role="table" aria-label="Notes" className={table.table}>
          <DataHeader className={table.head} corners="none" columns={NOTE_COLUMNS} leading="none" sort={sort} onSortChange={k => setSort(nextSort(k))} />
          {rows.length === 0 && (
            <p className={`text-medium-regular ${record.emptyRow}`}>{q ? `No notes match “${query}”.` : 'No notes yet. Use Add Note to add one.'}</p>
          )}
          {rows.map((n, i) => (
            <div key={n.id} className={table.rowWrap} data-stripe={i % 2 === 0 || undefined}>
              <DataRow
                className={table.row}
                columns={NOTE_COLUMNS}
                leading="none"
                cells={{
                  author: (
                    <span className={styles.cellIcon}>
                      <Avatar size="small" initials={initialsOf(n.author)} />
                      {n.author}
                    </span>
                  ),
                  updated: n.updated,
                  text: (
                    <button type="button" className={record.cellLink} onClick={() => setEditing(n)}>
                      {n.text}
                    </button>
                  ),
                  pin: (
                    <button
                      type="button"
                      className={styles.iconToggle}
                      aria-pressed={pinned(n)}
                      aria-label={pinned(n) ? 'Unpin note' : 'Pin note for everyone'}
                      title={n.pinAll ? 'Pinned for everyone' : n.pinMe ? 'Pinned for you' : 'Not pinned'}
                      onClick={() => update(list => list.map(x => (x.id === n.id ? { ...x, pinAll: !pinned(n), pinMe: !pinned(n) && x.pinMe } : x)))}
                    >
                      <Icon name="bookmark" size={20} color="currentColor" />
                    </button>
                  ),
                }}
                moreLabel={`More actions for the note by ${n.author}`}
                onMore={() => setMenuFor(m => (m === n.id ? null : n.id))}
              />
              {menuFor === n.id && (
                <RowMenu
                  label={`note by ${n.author}`}
                  onClose={() => setMenuFor(null)}
                  items={[
                    { label: 'Edit', onSelect: () => setEditing(n) },
                    { label: 'Delete', onSelect: () => setDeleting(n) },
                  ]}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <NoteModal
        open={editing !== null}
        note={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onSave={fields => {
          if (editing === 'new') update(list => [{ id: `n${Date.now()}`, author: me, updated: today(), ...fields }, ...list]);
          else if (editing) update(list => list.map(x => (x.id === editing.id ? { ...x, ...fields, updated: today() } : x)));
          onNotice(editing === 'new' ? 'Note added.' : 'Note saved.');
          setEditing(null);
        }}
        onDelete={() => {
          if (editing && editing !== 'new') setDeleting(editing);
          setEditing(null);
        }}
      />
      <DeleteNoteModal
        note={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) update(list => list.filter(x => x.id !== deleting.id));
          onNotice('Note deleted.');
          setDeleting(null);
        }}
      />
    </Card>
  );
}

