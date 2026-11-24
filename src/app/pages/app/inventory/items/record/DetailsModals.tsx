import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../../../../components/Button/Button';
import { Checkbox } from '../../../../../../components/Checkbox/Checkbox';
import { DataTable, type DataColumn, type DataSort } from '../../../../../../components/DataTable/DataTable';
import { EditableCell } from '../../../../../../components/EditableCell/EditableCell';
import { Icon } from '../../../../../../components/Icon/Icon';
import { IconButton } from '../../../../../../components/IconButton/IconButton';
import { Dropdown } from '../../../../../../components/Dropdown/Dropdown';
import { NumericInput } from '../../../../../../components/NumericInput/NumericInput';
import { RadioButton } from '../../../../../../components/RadioButton/RadioButton';
import { SearchInput } from '../../../../../../components/SearchBar/SearchBar';
import { Tag } from '../../../../../../components/Tag/Tag';
import { TextArea } from '../../../../../../components/TextArea/TextArea';
import { TextInput } from '../../../../../../components/TextInput/TextInput';
import { Toggle } from '../../../../../../components/Toggle/Toggle';
import { AppModal } from '../../../../../components/AppModal';
import {
  available,
  NOTE_TYPES,
  PACKAGES,
  SUPPLIERS,
  TERM_UNITS,
  today,
  WARRANTY_COVERS,
  WARRANTY_PROVIDERS,
  type Item,
  type ItemSupplier,
  type Note,
  type NoteType,
  type PackageKey,
  type PriceBreak,
  type Warranty,
  type WarrantyPricing,
} from '../itemData';
import { DragHandle, nextSort, options, requiredNote, Segment, sortRows, TrashButton, useDragList } from '../shared';
import record from '../../record.module.css';
import styles from '../items.module.css';

const uid = (p: string) => `${p}${Date.now()}${Math.floor(Math.random() * 1000)}`;

/* ---------- Add Warranty ---------- */

/** The modal's working copy: tier fields stay as typed ("$55.00") until saved. */
type TierDraft = { id: string; from: string; to: string; price: string };
type WarrantyDraft = Omit<Warranty, 'term' | 'tiers'> & { term: number | null; tiers: TierDraft[] };

const blankTier = (): TierDraft => ({ id: uid('wt'), from: '', to: '', price: '' });
const money = (n: number) => `$${n.toFixed(2)}`;
/** "$1,055.5" → 1055.5; blank or not a number → null. */
const parseNumber = (text: string) => {
  const n = Number(text.replace(/[$,\s]/g, ''));
  return text.trim() && Number.isFinite(n) ? n : null;
};

function toDraft(w: Warranty | null): WarrantyDraft {
  if (!w)
    return {
      id: uid('w'),
      kind: 'standard',
      covers: '',
      providedBy: '',
      term: null,
      termUnit: 'Years',
      document: '',
      documentKind: 'link',
      pricedBy: 'size',
      price: null,
      tiers: [blankTier()],
    };
  return {
    ...w,
    pricedBy: w.pricedBy ?? 'size',
    price: w.price ?? null,
    tiers: w.tiers?.length
      ? w.tiers.map(t => ({ id: t.id, from: t.from == null ? '' : String(t.from), to: t.to == null ? '' : String(t.to), price: t.price == null ? '' : money(t.price) }))
      : [blankTier()],
  };
}

function fromDraft(d: WarrantyDraft): Warranty {
  const base: Warranty = {
    id: d.id,
    kind: d.kind,
    covers: d.covers,
    providedBy: d.providedBy,
    term: d.term ?? 0,
    termUnit: d.termUnit,
    document: d.document.trim(),
    documentKind: d.documentKind,
  };
  if (d.kind === 'standard') return base;
  if (d.pricedBy === 'size') {
    const tiers = d.tiers
      .map(t => ({ id: t.id, from: parseNumber(t.from), to: parseNumber(t.to), price: parseNumber(t.price) }))
      .filter(t => t.from != null || t.to != null || t.price != null);
    return { ...base, pricedBy: 'size', tiers };
  }
  return { ...base, pricedBy: d.pricedBy, price: d.price };
}

/** Figma's worked examples under the tiers ("an 8.2 kW system → 8.2 × $55.00 = $451.00"), from the first two priced tiers. */
function tierExamples(tiers: TierDraft[]) {
  const priced = tiers
    .map(t => ({ from: parseNumber(t.from), to: parseNumber(t.to), price: parseNumber(t.price) }))
    .filter((t): t is { from: number; to: number; price: number } => t.from != null && t.to != null && t.price != null && t.to > t.from);
  return priced.slice(0, 2).map((t, i) => {
    const preferred = i === 0 ? 8.2 : 14;
    const size = preferred >= t.from && preferred <= t.to ? preferred : Math.round(((t.from + t.to) / 2) * 10) / 10;
    return `${/^(8|1[18](.|$))/.test(String(size)) ? 'an' : 'a'} ${size} kW system → ${size} × ${money(t.price)} = ${money(size * t.price)}`;
  });
}

const PRICED_BY: { value: WarrantyPricing; label: string }[] = [
  { value: 'flat', label: 'Flat price' },
  { value: 'size', label: 'System size (kW)' },
  { value: 'unit', label: 'Per unit' },
];

/**
 * Add Warranty / Edit Warranty (Figma "Add Warranty (Improved)" 1152:23496, ITEMS.md §2): one warranty per modal.
 * Warranty Type chips (Standard, included / Extended, sold separately), then Covers, Provided by, Term and Units, the
 * warranty document (an upload or a link), and for an extended warranty its price: a flat price, a price per kW by
 * system size tier, or a price per unit.
 */
export function WarrantyModal({
  open,
  warranty,
  onClose,
  onSave,
}: {
  open: boolean;
  /** The warranty being edited; null adds one. */
  warranty: Warranty | null;
  onClose: () => void;
  onSave: (w: Warranty) => void;
}) {
  const [d, setD] = useState<WarrantyDraft>(() => toDraft(null));
  const [tried, setTried] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    setTried(false);
    setD(toDraft(warranty));
  }, [open, warranty]);

  const set = (patch: Partial<WarrantyDraft>) => setD(x => ({ ...x, ...patch }));
  const setTier = (id: string, patch: Partial<TierDraft>) => setD(x => ({ ...x, tiers: x.tiers.map(t => (t.id === id ? { ...t, ...patch } : t)) }));
  const examples = tierExamples(d.tiers);

  function save() {
    setTried(true);
    if (!d.covers || !d.providedBy || !d.term) return;
    onSave(fromDraft(d));
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      width={900}
      title={warranty ? 'Edit Warranty' : 'Add Warranty'}
      primaryAction={{ label: warranty ? 'Save' : 'Add Warranty', onClick: save }}
    >
      <div className={`${styles.modalBody} ${styles.warrantyBody}`}>
        <div className={styles.warrantyType}>
          <span id="warranty-type-label" className={`text-medium-regular ${styles.chipsLabel}`}>
            Warranty Type *
          </span>
          <div className={styles.chips} role="group" aria-labelledby="warranty-type-label">
            <Tag size="medium" selected={d.kind === 'standard'} onClick={() => set({ kind: 'standard' })}>
              Standard (included)
            </Tag>
            <Tag size="medium" selected={d.kind === 'extended'} onClick={() => set({ kind: 'extended' })}>
              Extended (sold separately)
            </Tag>
          </div>
        </div>
        <div className={styles.fields4}>
          <Dropdown
            label="Covers *"
            placeholder="Select"
            options={options(WARRANTY_COVERS)}
            value={d.covers || null}
            onChange={v => set({ covers: v as string })}
            error={tried && !d.covers ? 'Choose what it covers' : undefined}
            required
          />
          <Dropdown
            label="Provided by *"
            placeholder="Select"
            options={options(WARRANTY_PROVIDERS)}
            value={d.providedBy || null}
            onChange={v => set({ providedBy: v as string })}
            error={tried && !d.providedBy ? 'Choose who provides it' : undefined}
            required
          />
          <NumericInput label="Term *" required min={1} value={d.term} onValueChange={v => set({ term: v })} error={tried && !d.term ? 'Enter the term' : undefined} />
          <Dropdown label="Units" options={options(TERM_UNITS)} value={d.termUnit} onChange={v => set({ termUnit: v as string })} />
        </div>
        <div className={styles.documentRow}>
          <div className={styles.search}>
            <TextInput
              label="Warranty document"
              placeholder="Upload a PDF or paste a link"
              value={d.document}
              onChange={e => set({ document: e.target.value, documentKind: 'link' })}
              leftIcon={d.document ? (d.documentKind === 'file' ? 'document' : 'link-add') : undefined}
            />
          </div>
          <Button size="medium" variant="outline" icon="upload" onClick={() => file.current?.click()}>
            Upload
          </Button>
          <input
            ref={file}
            type="file"
            hidden
            accept=".pdf"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) set({ document: f.name, documentKind: 'file' });
              e.target.value = '';
            }}
          />
        </div>
        {/* Extended only: the price panel opens and closes with an animation; while closed it is inert (out of the tab
            order and hidden from screen readers) */}
        <div className={styles.pricingReveal} data-open={d.kind === 'extended' || undefined} inert={d.kind !== 'extended'}>
          <div className={styles.pricingRevealInner}>
            <section className={styles.pricing} aria-labelledby="warranty-price-title">
              <h3 id="warranty-price-title" className={`text-medium-bold ${styles.pricingTitle}`}>
                Price (extended warranties only)
              </h3>
              <div className={styles.chips} role="group" aria-labelledby="warranty-priced-by">
                <span id="warranty-priced-by" className={`text-medium-regular ${styles.chipsLabel}`}>
                  Priced by:
                </span>
                {PRICED_BY.map(p => (
                  <Tag key={p.value} size="medium" selected={d.pricedBy === p.value} onClick={() => set({ pricedBy: p.value })}>
                    {p.label}
                  </Tag>
                ))}
              </div>
              {d.pricedBy === 'size' ? (
                <>
                  <div role="table" aria-label="Price per kW by system size" className={styles.tiers}>
                    <div role="row" className={styles.tierHead}>
                      <span role="columnheader" className="text-medium-bold">
                        System size from (kW)
                      </span>
                      <span role="columnheader" className="text-medium-bold">
                        To (kW)
                      </span>
                      <span role="columnheader" className="text-medium-bold">
                        Price per kW
                      </span>
                      <span role="columnheader" className={styles.tierActions} aria-label="Remove" />
                    </div>
                    {d.tiers.length === 0 && <p className={`text-medium-regular ${styles.tierEmpty}`}>No tiers. Use Add Tier to add one.</p>}
                    {d.tiers.map((t, i) => (
                      <div role="row" key={t.id} className={styles.tierRow}>
                        <span role="cell">
                          <EditableCell label={`Tier ${i + 1} from (kW)`} value={t.from} placeholder="0" onValueChange={v => setTier(t.id, { from: v })} />
                        </span>
                        <span role="cell">
                          <EditableCell label={`Tier ${i + 1} to (kW)`} value={t.to} placeholder="0" onValueChange={v => setTier(t.id, { to: v })} />
                        </span>
                        <span role="cell">
                          <EditableCell label={`Tier ${i + 1} price per kW`} value={t.price} placeholder="$0.00" onValueChange={v => setTier(t.id, { price: v })} />
                        </span>
                        <span role="cell" className={styles.tierActions}>
                          <IconButton size="medium" icon="delete" label={`Remove tier ${i + 1}`} onClick={() => set({ tiers: d.tiers.filter(x => x.id !== t.id) })} />
                        </span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <Button size="medium" variant="outline" icon="plus" onClick={() => set({ tiers: [...d.tiers, blankTier()] })}>
                      Add Tier
                    </Button>
                  </div>
                  <p className={`text-tiny-regular ${styles.pricingNote}`}>
                    The tier the system size falls into sets the price per kW, so bigger systems cost less per kW.
                    {examples.length > 0 && ` Example: ${examples.join('; ')}.`}
                  </p>
                </>
              ) : (
                <div className={styles.priceField}>
                  <NumericInput
                    label={d.pricedBy === 'flat' ? 'Price ($)' : 'Price per unit ($)'}
                    min={0}
                    step={0.01}
                    value={d.price ?? null}
                    onValueChange={v => set({ price: v })}
                  />
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </AppModal>
  );
}

/* ---------- Add Supplier ---------- */

const blankSupplier = (item: Item): ItemSupplier => ({
  id: uid('sup'),
  supplier: '',
  primary: item.suppliers.length === 0,
  partNumber: '',
  partName: item.name,
  packages: Object.fromEntries(PACKAGES.map(p => [p.key, { quantity: null, cost: null, leadTime: null }])) as ItemSupplier['packages'],
  breakMode: 'percent',
  priceBreaks: { pack: [], case: [], carton: [], bulk: [], pallet: [] },
  updated: today(),
});

/**
 * Add Supplier (ITEMS.md §2): the supplier and its part #, cost and lead time per package size, and price breaks per
 * package. Editing adds a red Remove Supplier.
 */
export function SupplierModal({
  open,
  item,
  supplier,
  onClose,
  onSave,
  onRemove,
}: {
  open: boolean;
  item: Item;
  /** The supplier being edited; null adds one. */
  supplier: ItemSupplier | null;
  onClose: () => void;
  onSave: (s: ItemSupplier) => void;
  onRemove: () => void;
}) {
  const [form, setForm] = useState<ItemSupplier>(() => blankSupplier(item));
  const [pkg, setPkg] = useState<PackageKey>('pack');
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (!open) return;
    setTried(false);
    setPkg('pack');
    setForm(supplier ? structuredClone(supplier) : blankSupplier(item));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, supplier]);

  const breaks = form.priceBreaks[pkg];
  const setBreaks = (next: PriceBreak[]) => setForm(f => ({ ...f, priceBreaks: { ...f.priceBreaks, [pkg]: next } }));
  const drag = useDragList(breaks, setBreaks);
  const setPackage = (key: PackageKey, field: 'quantity' | 'cost' | 'leadTime', v: number | null) =>
    setForm(f => ({ ...f, packages: { ...f.packages, [key]: { ...f.packages[key], [field]: v } } }));
  const used = item.suppliers.filter(s => s.id !== supplier?.id).map(s => s.supplier);
  const errors = { supplier: !form.supplier ? 'Choose a supplier' : undefined };

  function save() {
    setTried(true);
    if (errors.supplier) return;
    onSave({ ...form, partNumber: form.partNumber.trim(), partName: form.partName.trim(), updated: today() });
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={supplier ? 'Edit Supplier' : 'Add Supplier'}
      description={requiredNote}
      startAction={supplier ? { label: 'Remove Supplier', danger: true, onClick: onRemove } : undefined}
      primaryAction={{ label: 'Save', onClick: save }}
    >
      <div className={styles.modalBody}>
        <div className={styles.segmentRow}>
          <div className={styles.search}>
            <Dropdown
              label="Supplier *"
              placeholder="Select"
              options={SUPPLIERS.map(s => ({ value: s, label: s, disabled: used.includes(s) }))}
              value={form.supplier || null}
              onChange={v => setForm(f => ({ ...f, supplier: v as string }))}
              error={tried ? errors.supplier : undefined}
              required
            />
          </div>
          <Checkbox size="small" label="Set as Primary Supplier" checked={form.primary} onChange={e => setForm(f => ({ ...f, primary: e.target.checked }))} />
        </div>
        <div className={record.halves}>
          <TextInput label="Supplier Part #" value={form.partNumber} onChange={e => setForm(f => ({ ...f, partNumber: e.target.value }))} />
          <TextInput label="Supplier Part Name" value={form.partName} onChange={e => setForm(f => ({ ...f, partName: e.target.value }))} />
        </div>

        <div className={styles.modalSectionHead}>
          <h3 className={styles.subheading}>Package + Cost Details</h3>
          <span>Last Updated: {form.updated}</span>
        </div>
        <div className={styles.packageGrid}>
          {PACKAGES.map(p => (
            <PackageRow key={p.key} label={p.label} value={form.packages[p.key]} onChange={(field, v) => setPackage(p.key, field, v)} />
          ))}
        </div>

        <div className={styles.modalSectionHead}>
          <h3 className={styles.subheading}>Price Breaks</h3>
          <span>Last Updated: {form.updated}</span>
        </div>
        <Segment label="Price breaks for" value={pkg} options={PACKAGES.map(p => ({ value: p.key, label: p.label }))} onChange={setPkg} />
        <div className={styles.segmentRow}>
          <div className={styles.titleChecks} role="radiogroup" aria-label="Price break type">
            <RadioButton name="break-mode" label="Percentage Off" checked={form.breakMode === 'percent'} onChange={() => setForm(f => ({ ...f, breakMode: 'percent' }))} />
            <RadioButton name="break-mode" label="Discounted Price" checked={form.breakMode === 'price'} onChange={() => setForm(f => ({ ...f, breakMode: 'price' }))} />
          </div>
          <Button size="medium" variant="outline" icon="plus" onClick={() => setBreaks([...breaks, { id: uid('pb'), upTo: null, value: null }])}>
            Add Quantity
          </Button>
        </div>
        {breaks.length === 0 && <p className={`text-medium-regular ${styles.muted}`}>No price breaks for this package size yet.</p>}
        <ul className={styles.dragRows} aria-label="Price breaks">
          {breaks.map((b, i) => (
            <li key={b.id} className={styles.dragRow} data-cols="2" {...drag.rowProps(i)}>
              <DragHandle />
              <NumericInput label="Up to Quantity" min={1} value={b.upTo} onValueChange={v => setBreaks(breaks.map(x => (x.id === b.id ? { ...x, upTo: v } : x)))} />
              <NumericInput
                label={form.breakMode === 'percent' ? 'Percentage Off (%)' : 'Discounted Price ($)'}
                min={0}
                max={form.breakMode === 'percent' ? 100 : undefined}
                step={form.breakMode === 'percent' ? 1 : 0.01}
                value={b.value}
                onValueChange={v => setBreaks(breaks.map(x => (x.id === b.id ? { ...x, value: v } : x)))}
              />
              <TrashButton label={`Remove price break ${i + 1}`} onClick={() => setBreaks(breaks.filter(x => x.id !== b.id))} />
            </li>
          ))}
        </ul>
      </div>
    </AppModal>
  );
}

function PackageRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ItemSupplier['packages'][PackageKey];
  onChange: (field: 'quantity' | 'cost' | 'leadTime', v: number | null) => void;
}) {
  return (
    <>
      <span className={styles.packageLabel}>{label}</span>
      <NumericInput label={`${label} Quantity`} min={0} value={value.quantity} onValueChange={v => onChange('quantity', v)} />
      <NumericInput label={`${label} Cost ($)`} min={0} step={0.01} value={value.cost} onValueChange={v => onChange('cost', v)} />
      <NumericInput label={`${label} Lead Time (Days)`} min={0} value={value.leadTime} onValueChange={v => onChange('leadTime', v)} />
    </>
  );
}

/** Asks before a supplier is removed from the item. */
export function RemoveSupplierModal({ supplier, onClose, onConfirm }: { supplier: ItemSupplier | null; onClose: () => void; onConfirm: () => void }) {
  return (
    <AppModal
      open={supplier !== null}
      onClose={onClose}
      title="Remove supplier?"
      description={supplier && `${supplier.supplier} will be removed from this item’s suppliers, with its costs and price breaks.`}
      primaryAction={{ label: 'Remove Supplier', danger: true, onClick: onConfirm }}
    />
  );
}

/* ---------- Add Replacement Item ---------- */

const REPLACEMENT_COLUMNS: DataColumn[] = [
  { key: 'number', label: 'Item #', width: 190 },
  { key: 'name', label: 'Name', width: 'fill' },
  { key: 'available', label: 'Available', width: 120 },
];

/** The item's stock available to use across every warehouse. */
const totalAvailable = (i: Item) => i.stock.reduce((sum, s) => sum + available(s), 0);

/**
 * Add Replacement Item (Figma 175:4904, ITEMS.md §2): a pick list. Search by #, name or manufacturer, check the items
 * to offer, then Add puts them at the end of the card's list. Items already chosen (and the item itself) aren't listed.
 */
export function ReplacementModal({
  open,
  item,
  all,
  onClose,
  onAdd,
}: {
  open: boolean;
  item: Item;
  all: Item[];
  onClose: () => void;
  onAdd: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [sort, setSort] = useState<DataSort | undefined>();
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setPicked([]);
    setSort(undefined);
  }, [open]);

  const q = query.trim().toLowerCase();
  // Items in the same category (other solar panels for a panel) come first
  const candidates = all
    .filter(i => i.id !== item.id && i.type === item.type && i.active && !item.replacements.includes(i.id))
    .sort((x, y) => Number(y.category === item.category) - Number(x.category === item.category));
  const shown = candidates.filter(i => !q || `${i.id} ${i.customNumber} ${i.name} ${i.manufacturer}`.toLowerCase().includes(q));
  const rows = sortRows(shown, sort, (i, key) => (key === 'available' ? totalAvailable(i) : key === 'name' ? i.name : i.id));

  return (
    <AppModal
      open={open}
      onClose={onClose}
      width={640}
      title="Add Replacement Item"
      description={
        <>
          Offered when {item.id} is short or discontinued.
          <br />
          Items already chosen are not shown in the list below.
        </>
      }
      primaryAction={{ label: picked.length > 1 ? `Add ${picked.length}` : 'Add', disabled: picked.length === 0, onClick: () => onAdd(picked) }}
    >
      <div className={styles.modalBody}>
        <SearchInput
          aria-label="Search items by #, name or manufacturer"
          placeholder="Search items by #, name or manufacturer"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        <div className={styles.pickList}>
          <DataTable
            aria-label="Items to offer as replacements"
            columns={REPLACEMENT_COLUMNS}
            rows={rows}
            rowLabel={i => i.name}
            cells={i => ({ number: i.id, name: i.name, available: totalAvailable(i).toLocaleString() })}
            selectable
            selected={picked}
            onSelectedChange={setPicked}
            sort={sort}
            onSortChange={k => setSort(nextSort(k))}
            empty={
              <p className={`text-medium-regular ${styles.pickEmpty}`}>
                {candidates.length === 0 ? `No other active ${item.type.toLowerCase()}s to offer.` : `No items match “${query}”.`}
              </p>
            }
          />
        </div>
      </div>
    </AppModal>
  );
}

/* ---------- Add / Edit Note ---------- */

/** Add Note / Edit Note (ITEMS.md §2): pins, pop-up, the note and its types. Editing shows Last Updated and a red Delete. */
export function NoteModal({
  open,
  note,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  /** The note being edited; null adds one. */
  note: Note | null;
  onClose: () => void;
  onSave: (fields: Pick<Note, 'text' | 'pinMe' | 'pinAll' | 'popup' | 'types'>) => void;
  onDelete: () => void;
}) {
  const [text, setText] = useState('');
  const [pinMe, setPinMe] = useState(false);
  const [pinAll, setPinAll] = useState(false);
  const [popup, setPopup] = useState(false);
  const [types, setTypes] = useState<NoteType[]>([]);
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (!open) return;
    setTried(false);
    setText(note?.text ?? '');
    setPinMe(note?.pinMe ?? false);
    setPinAll(note?.pinAll ?? false);
    setPopup(note?.popup ?? false);
    setTypes(note?.types ?? ['General']);
  }, [open, note]);

  function save() {
    setTried(true);
    if (!text.trim()) return;
    onSave({ text: text.trim(), pinMe, pinAll, popup, types });
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={note ? 'Edit Note' : 'Add Note'}
      description={note ? `Last Updated: ${note.updated} by ${note.author}` : requiredNote}
      startAction={note ? { label: 'Delete', danger: true, onClick: onDelete } : undefined}
      primaryAction={{ label: 'Save Note', onClick: save }}
    >
      <div className={styles.modalBody}>
        <div className={styles.titleChecks}>
          <Toggle label="Pin For Myself" checked={pinMe} onChange={e => setPinMe(e.target.checked)} />
          <Toggle label="Pin For Everyone" checked={pinAll} onChange={e => setPinAll(e.target.checked)} />
          <Toggle label="Pop-Up" checked={popup} onChange={e => setPopup(e.target.checked)} />
        </div>
        <TextArea label="Note *" rows={5} value={text} onChange={e => setText(e.target.value)} error={tried && !text.trim() ? 'Write the note' : undefined} autoFocus />
        <fieldset className={styles.group}>
          <legend className={styles.subheading}>Note Type</legend>
          <div className={styles.titleChecks}>
            {NOTE_TYPES.map(t => (
              <Checkbox
                key={t}
                size="small"
                label={t}
                checked={types.includes(t)}
                onChange={e => setTypes(list => (e.target.checked ? [...list, t] : list.filter(x => x !== t)))}
              />
            ))}
          </div>
        </fieldset>
      </div>
    </AppModal>
  );
}

/** Asks before a note is deleted. */
export function DeleteNoteModal({ note, onClose, onConfirm }: { note: Note | null; onClose: () => void; onConfirm: () => void }) {
  return (
    <AppModal
      open={note !== null}
      onClose={onClose}
      title="Delete note?"
      description={note && `${note.author}’s note from ${note.updated} will be deleted. This action cannot be undone.`}
      primaryAction={{ label: 'Delete Note', danger: true, onClick: onConfirm }}
    />
  );
}

/* ---------- Spec Sheet ---------- */

/**
 * Spec Sheet (ITEMS.md §2): opened from the Specifications card's spec sheet button. Shows the current sheet (View),
 * replaces it with an upload or a link, or removes it. Like the card's fields, the change is kept by the page's Save.
 */
export function SpecSheetModal({
  open,
  itemName,
  specSheet,
  onClose,
  onSave,
  onView,
}: {
  open: boolean;
  itemName: string;
  /** The current spec sheet (a file name or a link); empty when there's none. */
  specSheet: string;
  onClose: () => void;
  /** The new spec sheet; '' removes it. */
  onSave: (specSheet: string) => void;
  onView: () => void;
}) {
  const [value, setValue] = useState('');
  const [tried, setTried] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    setValue('');
    setTried(false);
  }, [open]);
  const isLink = /^https?:\/\//i.test(value.trim());

  // With a sheet already there, leaving Replace with empty keeps it
  function save() {
    setTried(true);
    if (!value.trim()) {
      if (specSheet) onClose();
      return;
    }
    onSave(value.trim());
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={specSheet ? 'Spec Sheet' : 'Add Spec Sheet'}
      description={`The manufacturer’s spec sheet for ${itemName || 'this item'}. Upload a PDF or paste a link.`}
      startAction={specSheet ? { label: 'Remove Spec Sheet', danger: true, onClick: () => onSave('') } : undefined}
      primaryAction={{ label: specSheet ? 'Save' : 'Add Spec Sheet', onClick: save }}
    >
      <div className={styles.modalBody}>
        {specSheet && (
          <div className={styles.currentFile}>
            <Icon name="document" size={24} />
            <span className={`text-medium-semi-bold ${styles.currentFileName}`}>{specSheet}</span>
            <Button size="medium" variant="outline" icon="visibility" onClick={onView}>
              View
            </Button>
          </div>
        )}
        <div className={styles.documentRow}>
          <div className={styles.search}>
            <TextInput
              label={specSheet ? 'Replace with' : 'Spec sheet *'}
              placeholder="Upload a PDF or paste a link"
              value={value}
              onChange={e => setValue(e.target.value)}
              leftIcon={value ? (isLink ? 'link-add' : 'document') : undefined}
              error={tried && !specSheet && !value.trim() ? 'Upload a PDF or paste a link' : undefined}
            />
          </div>
          <Button size="medium" variant="outline" icon="upload" onClick={() => file.current?.click()}>
            Upload
          </Button>
          <input
            ref={file}
            type="file"
            hidden
            accept=".pdf,.doc,.docx"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) setValue(f.name);
              e.target.value = '';
            }}
          />
        </div>
      </div>
    </AppModal>
  );
}
