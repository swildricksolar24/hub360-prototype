import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../../../../components/Button/Button';
import { Checkbox } from '../../../../../../components/Checkbox/Checkbox';
import { DataHeader, type DataColumn } from '../../../../../../components/DataHeader/DataHeader';
import { DataRow } from '../../../../../../components/DataRow/DataRow';
import { Dropdown } from '../../../../../../components/Dropdown/Dropdown';
import { NumericInput } from '../../../../../../components/NumericInput/NumericInput';
import { RadioButton } from '../../../../../../components/RadioButton/RadioButton';
import { TextArea } from '../../../../../../components/TextArea/TextArea';
import { TextInput } from '../../../../../../components/TextInput/TextInput';
import { Toggle } from '../../../../../../components/Toggle/Toggle';
import { AppModal } from '../../../../../components/AppModal';
import {
  NOTE_TYPES,
  PACKAGES,
  SUPPLIERS,
  TERM_UNITS,
  today,
  WARRANTY_CATEGORIES,
  WARRANTY_PRICE_TYPES,
  type Item,
  type ItemSupplier,
  type Note,
  type NoteType,
  type PackageKey,
  type PriceBreak,
  type Warranty,
  type WarrantyKind,
  type WarrantyPrice,
} from '../itemData';
import { DragHandle, ItemPicker, options, requiredNote, Segment, TrashButton, useDragList } from '../shared';
import record from '../../record.module.css';
import table from '../../table.module.css';
import styles from '../items.module.css';

const uid = (p: string) => `${p}${Date.now()}${Math.floor(Math.random() * 1000)}`;

/* ---------- Add Warranty ---------- */

const blankWarranty = (kind: WarrantyKind): Warranty => ({
  id: uid('w'),
  kind,
  category: '',
  term: 0,
  termUnit: 'Months',
  document: '',
  documentKind: 'link',
  ...(kind === 'extended' ? { offeredByInstaller: false, prices: [{ id: uid('wp'), type: 'kW', value: null, unitCost: null }] } : {}),
});

/**
 * Add Warranty (ITEMS.md §2): repeatable groups of Category, Term, Term units and a document (a link or an upload),
 * each with a trash button. Extended warranties add Offered by Installer and draggable price rows. It edits every
 * warranty of one kind; opened from Add Warranty Information it starts a new group.
 */
export function WarrantyModal({
  open,
  kind,
  warranties,
  startNew,
  onClose,
  onSave,
}: {
  open: boolean;
  kind: WarrantyKind;
  warranties: Warranty[];
  startNew: boolean;
  onClose: () => void;
  onSave: (list: Warranty[]) => void;
}) {
  const [groups, setGroups] = useState<Warranty[]>([]);
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (!open) return;
    setTried(false);
    const mine = warranties.filter(w => w.kind === kind);
    setGroups(startNew || mine.length === 0 ? [...mine, blankWarranty(kind)] : mine);
  }, [open, kind, warranties, startNew]);

  const set = (id: string, patch: Partial<Warranty>) => setGroups(g => g.map(w => (w.id === id ? { ...w, ...patch } : w)));
  const invalid = (w: Warranty) => !w.category || !w.term;

  function save() {
    setTried(true);
    if (groups.some(invalid)) return;
    onSave(groups);
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={kind === 'standard' ? 'Add Warranty' : 'Add Extended Warranty'}
      description={requiredNote}
      startAction={{ label: '⊕ Add Warranty', onClick: () => setGroups(g => [...g, blankWarranty(kind)]) }}
      primaryAction={{ label: 'Save', onClick: save }}
    >
      <div className={styles.modalBody}>
        {groups.length === 0 && <p className={`text-medium-regular ${styles.muted}`}>No warranties. Use Add Warranty to add one.</p>}
        {groups.map((w, n) => (
          <WarrantyGroup key={w.id} n={n + 1} warranty={w} tried={tried} onChange={patch => set(w.id, patch)} onRemove={() => setGroups(g => g.filter(x => x.id !== w.id))} />
        ))}
      </div>
    </AppModal>
  );
}

function WarrantyGroup({
  n,
  warranty: w,
  tried,
  onChange,
  onRemove,
}: {
  n: number;
  warranty: Warranty;
  tried: boolean;
  onChange: (patch: Partial<Warranty>) => void;
  onRemove: () => void;
}) {
  const file = useRef<HTMLInputElement>(null);
  const prices = w.prices ?? [];
  const drag = useDragList(prices, next => onChange({ prices: next }));
  const setPrice = (id: string, patch: Partial<WarrantyPrice>) => onChange({ prices: prices.map(p => (p.id === id ? { ...p, ...patch } : p)) });
  return (
    <fieldset className={styles.group}>
      <div className={styles.groupHead}>
        <legend className={styles.subheading}>Warranty {n}</legend>
        <TrashButton label={`Remove warranty ${n}`} onClick={onRemove} />
      </div>
      <div className={styles.fields3}>
        <Dropdown
          label="Category *"
          placeholder="Select"
          options={options(WARRANTY_CATEGORIES)}
          value={w.category || null}
          onChange={v => onChange({ category: v as string })}
          error={tried && !w.category ? 'Choose a category' : undefined}
          required
        />
        <NumericInput label="Term (Number) *" min={1} value={w.term || null} onValueChange={v => onChange({ term: v ?? 0 })} error={tried && !w.term ? 'Enter the term' : undefined} />
        <Dropdown label="Term (Units)" options={options(TERM_UNITS)} value={w.termUnit} onChange={v => onChange({ termUnit: v as string })} />
      </div>
      <div className={styles.segmentRow}>
        <div className={styles.search}>
          <TextInput
            label={w.documentKind === 'file' ? 'Warranty Document (uploaded file)' : 'Warranty Document (link)'}
            placeholder="https://"
            value={w.document}
            onChange={e => onChange({ document: e.target.value, documentKind: 'link' })}
            leftIcon={w.documentKind === 'file' ? 'document' : 'link-add'}
          />
        </div>
        <Button size="small" variant="outline" icon="upload" onClick={() => file.current?.click()}>
          Upload
        </Button>
        <input
          ref={file}
          type="file"
          hidden
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) onChange({ document: f.name, documentKind: 'file' });
            e.target.value = '';
          }}
        />
      </div>
      {w.kind === 'extended' && (
        <>
          <Checkbox size="small" label="Offered by Installer" checked={!!w.offeredByInstaller} onChange={e => onChange({ offeredByInstaller: e.target.checked })} />
          <ul className={styles.dragRows} aria-label={`Warranty ${n} prices`}>
            {prices.map((p, i) => (
              <li key={p.id} className={styles.dragRow} {...drag.rowProps(i)}>
                <DragHandle />
                <Dropdown label="Type" options={options(WARRANTY_PRICE_TYPES)} value={p.type} onChange={v => setPrice(p.id, { type: v as string })} />
                <NumericInput label="Value (0 - 99.99)" min={0} max={99.99} step={0.01} value={p.value} onValueChange={v => setPrice(p.id, { value: v })} />
                <NumericInput label="Unit Cost ($)" min={0} step={0.01} value={p.unitCost} onValueChange={v => setPrice(p.id, { unitCost: v })} />
                <TrashButton label={`Remove price ${i + 1}`} onClick={() => onChange({ prices: prices.filter(x => x.id !== p.id) })} />
              </li>
            ))}
          </ul>
          <div>
            <Button size="small" variant="outline" icon="plus" onClick={() => onChange({ prices: [...prices, { id: uid('wp'), type: 'kW', value: null, unitCost: null }] })}>
              Add Price
            </Button>
          </div>
        </>
      )}
    </fieldset>
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
          <Button size="small" variant="outline" icon="plus" onClick={() => setBreaks([...breaks, { id: uid('pb'), upTo: null, value: null }])}>
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

/* ---------- Add Replacement ---------- */

const REPLACEMENT_COLUMNS: DataColumn[] = [
  { key: 'type', label: 'Type', width: 120, sortable: false },
  { key: 'number', label: 'Item', width: 210, sortable: false },
  { key: 'name', label: 'Name', width: 'fill', sortable: false },
  { key: 'remove', label: 'Remove', width: 56, labelHidden: true, sortable: false },
];

/** Add Replacement (ITEMS.md §2): search for items, then a table of the replacements with a trash button per row. */
export function ReplacementModal({
  open,
  item,
  all,
  onClose,
  onSave,
}: {
  open: boolean;
  item: Item;
  all: Item[];
  onClose: () => void;
  onSave: (ids: string[]) => void;
}) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    if (open) setIds(item.replacements);
  }, [open, item.replacements]);
  const rows = ids.map(id => all.find(i => i.id === id)).filter((i): i is Item => !!i);
  return (
    <AppModal open={open} onClose={onClose} title="Add Replacement" primaryAction={{ label: 'Save', onClick: () => onSave(ids) }}>
      <div className={styles.modalBody}>
        <ItemPicker
          items={all.filter(i => i.id !== item.id && !ids.includes(i.id) && i.type === item.type)}
          onPick={i => setIds(list => [...list, i.id])}
          label="Search replacement items"
          placeholder="Search by # or name"
          autoFocus
        />
        <div className={table.tableScroll}>
          <div role="table" aria-label="Replacement items" className={table.table}>
            <DataHeader className={table.head} corners="none" stretched columns={REPLACEMENT_COLUMNS} leading="none" actions={false} />
            {rows.length === 0 && <p className={`text-medium-regular ${record.emptyRow}`}>No replacements yet. Search above to add one.</p>}
            {rows.map((r, i) => (
              <div key={r.id} className={table.rowWrap} data-stripe={i % 2 === 0 || undefined}>
                <DataRow
                  className={table.row}
                  columns={REPLACEMENT_COLUMNS}
                  leading="none"
                  actions={false}
                  cells={{
                    type: r.type,
                    number: r.id,
                    name: r.name,
                    remove: <TrashButton label={`Remove ${r.name}`} onClick={() => setIds(list => list.filter(x => x !== r.id))} />,
                  }}
                />
              </div>
            ))}
          </div>
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
