import { createContext, useContext, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { Avatar } from '../../../../../../components/Avatar/Avatar';
import { Badge } from '../../../../../../components/Badge/Badge';
import { Button } from '../../../../../../components/Button/Button';
import { DataTable, type DataColumn as TableColumn, type DataSort } from '../../../../../../components/DataTable/DataTable';
import { Dropdown } from '../../../../../../components/Dropdown/Dropdown';
import { EditableCell } from '../../../../../../components/EditableCell/EditableCell';
import { Hyperlink } from '../../../../../../components/Hyperlink/Hyperlink';
import { Icon } from '../../../../../../components/Icon/Icon';
import { IconButton } from '../../../../../../components/IconButton/IconButton';
import { NumericInput } from '../../../../../../components/NumericInput/NumericInput';
import { SearchInput } from '../../../../../../components/SearchBar/SearchBar';
import { Tag } from '../../../../../../components/Tag/Tag';
import { TextArea } from '../../../../../../components/TextArea/TextArea';
import { TextInput } from '../../../../../../components/TextInput/TextInput';
import { UploadFile } from '../../../../../../components/UploadFile/UploadFile';
import { Toggle } from '../../../../../../components/Toggle/Toggle';
import { useAuth } from '../../../../../auth/AuthContext';
import { AppLink } from '../../../../../components/AppLink';
import { AppModal } from '../../../../../components/AppModal';
import { useHelperFlag } from '../../../../../shell/helperFlags';
import { ColumnFilter, filterOptions, matchesFilters, withFilter, type ColumnFilters } from '../../ColumnFilter';
import { RowMenu } from '../../record/RowMenu';
import { TableToolbar, useColumns, useTableControls } from '../../record/tableKit';
import {
  allCompliance,
  CATEGORIES,
  COMPLIANCE,
  COMPLIANCE_STATUSES,
  COUNTRIES,
  DIMENSION_LABEL,
  DIMENSION_UNITS,
  initialsOf,
  MANUFACTURERS,
  money,
  newBarcode,
  PACKAGES,
  replacementReasons,
  SPEC_TEMPLATES,
  SUPPLIERS,
  today,
  UNIT_NAMES,
  UNIT_TYPES,
  WEIGHT_LABEL,
  WEIGHT_UNITS,
  type ComplianceStatus,
  type Item,
  type ItemSupplier,
  type ItemUnit,
  type Note,
  type SpecField,
  type Warranty,
} from '../itemData';
import { itemPath, updateItem, useItems } from '../itemStore';
import { Card, InfoCheckbox, MenuButton, nextSort, options, required, sortRows } from '../shared';
import { DeleteNoteModal, NoteModal, RemoveSupplierModal, ReplacementModal, SpecSheetModal, SupplierModal, WarrantyModal } from './DetailsModals';
import record from '../../record.module.css';
import warehouseStyles from '../../warehouses.module.css';
import styles from '../items.module.css';
import { useProfilePhoto } from '../../../../../auth/useProfilePhoto';

/** The Details cards' fields; the record page keeps them so Save (the header's, or the editing banner's) saves them. */
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
  | 'trackExpiry'
  | 'serialized'
  | 'nonInventory'
  | 'discontinued'
  | 'compliance'
  | 'countryOfOrigin'
  | 'generalSpecs'
  | 'units'
  | 'buyUnit'
  | 'sellUnit'
  | 'countUnit'
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
export type DetailsErrors = { name?: string; category?: string; powerOutput?: string };

const DRAFT_KEYS: (keyof DetailsDraft)[] = [
  'customNumber',
  'name',
  'category',
  'subcategory',
  'description',
  'manufacturer',
  'model',
  'lotControl',
  'trackExpiry',
  'serialized',
  'nonInventory',
  'discontinued',
  'compliance',
  'countryOfOrigin',
  'generalSpecs',
  'units',
  'buyUnit',
  'sellUnit',
  'countUnit',
  'images',
  'specSheet',
  'unitType',
  'weight',
  'weightUnit',
  'length',
  'width',
  'height',
  'dimensionUnit',
  'categorySpecs',
  'packages',
  'minQuantity',
  'safetyStock',
  'reorderPoint',
  'leadTime',
  'autoCalculate',
  'lastPurchase',
];

export const toDraft = (i: Item): DetailsDraft => Object.fromEntries(DRAFT_KEYS.map(k => [k, i[k]])) as DetailsDraft;

/** How many fields differ from the saved item (the editing banner's "2 unsaved changes"). */
export const unsavedChanges = (draft: DetailsDraft, item: Item) => DRAFT_KEYS.filter(k => JSON.stringify(draft[k]) !== JSON.stringify(item[k])).length;

/** On save, a unit with no barcode gets one (Units & Packaging: "Leave a barcode blank to generate one"). */
export const withBarcodes = (draft: DetailsDraft): DetailsDraft => ({ ...draft, units: draft.units.map(u => (u.barcode.trim() ? u : { ...u, barcode: newBarcode() })) });

type Props = {
  item: Item;
  draft: DetailsDraft;
  errors: DetailsErrors;
  onDraftChange: (draft: DetailsDraft) => void;
  onNotice: (text: string) => void;
  /** Edit was pressed: the cards' fields and controls can change. Otherwise Details is read-only. */
  editing: boolean;
};

/** True while Details is read-only (before Edit): drag to reorder and dropping photos are off too. */
const LockedContext = createContext(false);

/** The Details sections the header's jump links go to (Figma 1144:8625), each by its card's id. */
export const DETAILS_SECTIONS = [
  { id: 'item-identification', label: 'Identification / Images' },
  { id: 'item-tracking', label: 'Tracking / Compliance' },
  { id: 'item-specifications', label: 'Specifications' },
  { id: 'item-units', label: 'Units & Packaging' },
  { id: 'item-warranty', label: 'Warranty' },
  { id: 'item-replacements', label: 'Replacement' },
  { id: 'item-notes', label: 'Notes' },
];

/**
 * Item record › Details (ITEMS.md §2; Figma "Inventory / Items / Details" 1144:7736). Full-width rows: Identification
 * and Images in one panel, Tracking and Compliance in one panel, then Specifications, Units & Packaging, Warranty,
 * Replacement Items and Notes. The form fields are saved by Save (the editing banner's); the lists (warranties,
 * replacements, notes) save as they change. Suppliers, Reorder Details and Last Purchase have their own tabs
 * (SuppliersTab, CostTab).
 */
export function DetailsTab({ item, draft, errors, onDraftChange, onNotice, editing }: Props) {
  const set = <K extends keyof DetailsDraft>(key: K, value: DetailsDraft[K]) => onDraftChange({ ...draft, [key]: value });

  return (
    <LockedContext.Provider value={!editing}>
      <div className={record.tab}>
        {/*
          Read-only until the header's Edit: a disabled fieldset turns off every field, button and menu in the cards
          (links still work). data-readonly keeps the Volt fields looking normal while they're off. Notes stay outside it: searching, reading and adding notes isn't editing the item.
        */}
        <fieldset className={styles.lock} disabled={!editing} data-readonly={!editing || undefined}>
          <div className={styles.panelRow}>
            <IdentificationCard item={item} draft={draft} errors={errors} onDraftChange={onDraftChange} set={set} />
            <ImagesCard draft={draft} set={set} onNotice={onNotice} />
          </div>
          <div className={styles.panelRow}>
            <TrackingCard draft={draft} onDraftChange={onDraftChange} set={set} />
            <ComplianceCard draft={draft} set={set} />
          </div>
          <SpecificationsCard draft={draft} errors={errors} set={set} patch={p => onDraftChange({ ...draft, ...p })} onNotice={onNotice} />
          <UnitsCard item={item} draft={draft} set={set} onNotice={onNotice} />
          <WarrantyCard item={item} onNotice={onNotice} />
          <ReplacementCard item={item} onNotice={onNotice} />
        </fieldset>
        <NotesCard item={item} onNotice={onNotice} />
      </div>
    </LockedContext.Provider>
  );
}

/**
 * Item record › Cost (Figma's Cost page is marked "for later"): Reorder Details and Last Purchase, which used to sit
 * under Details. Their fields are part of the Details draft, so the editing banner saves them too.
 */
export function CostTab({ draft, onDraftChange, editing }: Pick<Props, 'draft' | 'onDraftChange' | 'editing'>) {
  const set = <K extends keyof DetailsDraft>(key: K, value: DetailsDraft[K]) => onDraftChange({ ...draft, [key]: value });
  return (
    <div className={record.tab}>
      {/* Read-only until Edit, like Details */}
      <fieldset className={styles.lock} disabled={!editing} data-readonly={!editing || undefined}>
        <div className={styles.pair}>
          <ReorderCard draft={draft} set={set} />
          <LastPurchaseCard draft={draft} set={set} />
        </div>
      </fieldset>
    </div>
  );
}

type SetField = <K extends keyof DetailsDraft>(key: K, value: DetailsDraft[K]) => void;

/** A Details card: Figma's Large/Bold title over a strong divider. */
function DetailCard(props: { title: string; id: string; action?: ReactNode; children: ReactNode }) {
  return <Card {...props} className={styles.detailCard} />;
}

/**
 * Figma's "Delete All" in a card header (Images, Units & Packaging, Warranty, Replacement Items): the Volt red brand
 * button with a trash icon, off when there's nothing to delete. It always asks first, in the app's standard modal.
 */
function DeleteAllButton({ what, count, detail, onConfirm }: { what: string; count: number; detail?: string; onConfirm: () => void }) {
  const [asking, setAsking] = useState(false);
  return (
    <>
      <Button size="medium" variant="brand-red" icon="delete" disabled={count === 0} onClick={() => setAsking(true)}>
        Delete All
      </Button>
      <AppModal
        open={asking}
        onClose={() => setAsking(false)}
        title={`Delete All ${what}`}
        description={`All ${count} ${what.toLowerCase()} will be removed from this item.${detail ? ` ${detail}` : ''}`}
        primaryAction={{
          label: 'Delete All',
          danger: true,
          onClick: () => {
            onConfirm();
            setAsking(false);
          },
        }}
      />
    </>
  );
}

/* ---------- Identification ---------- */

function IdentificationCard({
  item,
  draft,
  errors,
  onDraftChange,
  set,
}: {
  item: Item;
  draft: DetailsDraft;
  errors: DetailsErrors;
  onDraftChange: (d: DetailsDraft) => void;
  set: SetField;
}) {
  const word = item.type;
  // Figma note: changing the category swaps the category specs below, so it asks first when there are some
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);
  const applyCategory = (category: string, clearSpecs: boolean) =>
    onDraftChange({
      ...draft,
      category,
      subcategory: CATEGORIES[category]?.includes(draft.subcategory) ? draft.subcategory : '',
      categorySpecs: clearSpecs ? {} : draft.categorySpecs,
    });
  const hasSpecs = Object.values(draft.categorySpecs).some(v => v.trim());

  return (
    <DetailCard id="item-identification" title="Identification">
      <div className={record.form}>
        <div className={styles.fieldRow}>
          <TextInput
            className={styles.wideField}
            label={required('Item Name')}
            value={draft.name}
            onChange={e => set('name', e.target.value)}
            error={errors.name}
            // No required (teal) outline on the cards' fields; the red * marks it, and Save checks it
          />
          {/* Figma note: the system # is set by the system and can't be changed: read-only (not disabled), so it looks like the other fields */}
          <TextInput label={`System ${word} #`} value={item.id} readOnly />
          <TextInput label={`Custom ${word} #`} value={draft.customNumber} onChange={e => set('customNumber', e.target.value)} />
        </div>
        <div className={styles.fieldRow}>
          <Dropdown
            label="Category *"
            placeholder="Select"
            // No required (teal) outline on the cards' dropdowns; the red * marks it, and Save checks it
            error={errors.category}
            options={options(Object.keys(CATEGORIES))}
            value={draft.category || null}
            onChange={v => {
              const category = v as string;
              if (category === draft.category) return;
              const swaps = SPEC_TEMPLATES[category] !== SPEC_TEMPLATES[draft.category];
              if (swaps && hasSpecs) setPendingCategory(category);
              else applyCategory(category, swaps);
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
          <Dropdown label="Manufacturer" placeholder="Select" options={options(MANUFACTURERS)} value={draft.manufacturer || null} onChange={v => set('manufacturer', v as string)} />
          <TextInput label="Model #" value={draft.model} onChange={e => set('model', e.target.value)} />
        </div>
        <TextArea label="Description" rows={6} value={draft.description} onChange={e => set('description', e.target.value)} />
      </div>
      <AppModal
        open={pendingCategory !== null}
        onClose={() => setPendingCategory(null)}
        title="Change Category"
        description={
          pendingCategory &&
          `Changing ${draft.category} to ${pendingCategory} swaps the category specs: this ${word.toLowerCase()}’s ${draft.category} specs will be cleared. Do you want to continue?`
        }
        primaryAction={{
          label: 'Change Category',
          onClick: () => {
            if (pendingCategory) applyCategory(pendingCategory, true);
            setPendingCategory(null);
          },
        }}
      />
    </DetailCard>
  );
}

/* ---------- Specifications ---------- */

const num = (text: string) => {
  const n = Number(text.replace(/,/g, '').trim());
  return text.trim() === '' || Number.isNaN(n) ? null : n;
};
const short = (n: number | null) => (n == null ? '' : n.toLocaleString('en-US', { maximumFractionDigits: 2 }));

/**
 * The unit picked at the right of a field (Figma "Right Icon" input; the weight can be lbs, kg or grams): the Volt
 * Dropdown, with the same menu as the app's other dropdowns, made flat so it sits inside the field.
 */
function UnitSelect({ label, value, units, labels, onChange }: { label: string; value: string; units: string[]; labels: Record<string, string>; onChange: (u: string) => void }) {
  return (
    <Dropdown
      className={styles.inlineUnit}
      variant="button"
      size="medium"
      label={label}
      hideLabel
      options={units.map(u => ({ value: u, label: labels[u] ?? u }))}
      value={value}
      onChange={v => onChange(v as string)}
    />
  );
}

function SpecificationsCard({
  draft,
  errors,
  set,
  patch,
  onNotice,
}: {
  draft: DetailsDraft;
  errors: DetailsErrors;
  set: SetField;
  patch: (p: Partial<DetailsDraft>) => void;
  onNotice: (t: string) => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const locked = useContext(LockedContext);
  const template = SPEC_TEMPLATES[draft.category];
  const [dims, setDims] = useState<string | null>(null);
  const saved = [draft.length, draft.width, draft.height];
  const dimsText = dims ?? (saved.every(v => v == null) ? '' : saved.map(short).join(' × '));
  const [adding, setAdding] = useState(false);
  const [spec, setSpec] = useState({ label: '', value: '' });
  const [tried, setTried] = useState(false);

  // Dimensions are typed as one "L × W × H" (an x works too); they're stored once all three are numbers
  const setDimensions = (text: string) => {
    setDims(text);
    const parts = text.split(/[×x*]/i);
    const [length, width, height] = parts.map(num);
    if (parts.length === 3 && length != null && width != null && height != null) patch({ length, width, height });
    else if (!text.trim()) patch({ length: null, width: null, height: null });
  };

  return (
    <DetailCard
      id="item-specifications"
      title="Specifications"
      action={
        <>
          {/* Robby (Figma 127:4953): one button for the spec sheet, its name with an edit icon at the end; it opens the
              Spec Sheet modal (view, replace, remove). Before there is one it reads "+ Add Spec Sheet". */}
          {/* Read-only: the spec sheet is a link that opens it (a link isn't turned off by the locked fieldset) */}
          {locked && draft.specSheet ? (
            <Hyperlink
              href="#"
              className={styles.specSheetLink}
              title={draft.specSheet}
              onClick={e => {
                e.preventDefault();
                onNotice(`${draft.specSheet} would open here; this prototype doesn’t store files.`);
              }}
            >
              <Icon name="document" size={20} color="currentColor" />
              <span>{draft.specSheet}</span>
            </Hyperlink>
          ) : draft.specSheet ? (
            <Button
              size="medium"
              variant="primary"
              icon="edit"
              iconPosition="right"
              className={styles.specSheetButton}
              title={draft.specSheet}
              aria-label={`Spec sheet: ${draft.specSheet}. Edit`}
              onClick={() => setSheetOpen(true)}
            >
              {draft.specSheet}
            </Button>
          ) : (
            <Button size="medium" variant="brand" icon="plus" onClick={() => setSheetOpen(true)}>
              Add Spec Sheet
            </Button>
          )}
          <SpecSheetModal
            open={sheetOpen}
            itemName={draft.name}
            specSheet={draft.specSheet}
            onClose={() => setSheetOpen(false)}
            onView={() => onNotice(`${draft.specSheet} would open here; this prototype doesn’t store files.`)}
            onSave={next => {
              set('specSheet', next);
              setSheetOpen(false);
            }}
          />
        </>
      }
    >
      <p className={`text-tiny-semi-bold ${styles.specGroup}`}>General</p>
      <div className={styles.fieldRow}>
        <TextInput
          label="Weight"
          inputMode="decimal"
          value={draft.weight == null ? '' : String(draft.weight)}
          onChange={e => set('weight', num(e.target.value))}
          trailingAction={<UnitSelect label="Weight unit" value={draft.weightUnit} units={WEIGHT_UNITS} labels={WEIGHT_LABEL} onChange={u => set('weightUnit', u)} />}
        />
        <TextInput
          label="Dimensions (L × W × H)"
          placeholder="0 × 0 × 0"
          value={dimsText}
          onChange={e => setDimensions(e.target.value)}
          onBlur={() => setDims(null)}
          trailingAction={<UnitSelect label="Dimension unit" value={draft.dimensionUnit} units={DIMENSION_UNITS} labels={DIMENSION_LABEL} onChange={u => set('dimensionUnit', u)} />}
        />
        <Dropdown label="Country of Origin" placeholder="Select" options={options(COUNTRIES)} value={draft.countryOfOrigin || null} onChange={v => set('countryOfOrigin', v as string)} />
      </div>
      {draft.generalSpecs.length > 0 && (
        <div className={styles.specGrid}>
          {draft.generalSpecs.map(s => (
            <TextInput
              key={s.id}
              label={s.label}
              value={s.value}
              onChange={e => set('generalSpecs', draft.generalSpecs.map(x => (x.id === s.id ? { ...x, value: e.target.value } : x)))}
              trailingAction={
                // A 24px button like the weight / dimension unit picker, so the field stays 44px tall
                <button type="button" className={styles.inlineRemove} aria-label={`Remove ${s.label}`} title="Remove" onClick={() => set('generalSpecs', draft.generalSpecs.filter(x => x.id !== s.id))}>
                  <Icon name="close-small" size={20} color="currentColor" />
                </button>
              }
            />
          ))}
        </div>
      )}
      {/* Figma note: Add Spec adds a general spec to this item only */}
      <div className={styles.addSpecRow}>
        <Button
          size="medium"
          variant="primary"
          icon="plus"
          onClick={() => {
            setSpec({ label: '', value: '' });
            setTried(false);
            setAdding(true);
          }}
        >
          Add Spec
        </Button>
      </div>
      {template && (
        <>
          {/* Figma note: category specs and their units come from Inventory Settings › Categories */}
          <p className={`text-tiny-semi-bold ${styles.specGroup}`}>{draft.category} specs (from category)</p>
          {template.map((row, i) => (
            <div key={i} className={styles.specFields} style={{ ['--spec-cols' as string]: Math.max(row.length, 4) }}>
              {row.map(f => (
                <SpecInput key={f.key} field={f} value={draft.categorySpecs[f.key] ?? ''} error={f.key === 'powerOutput' ? errors.powerOutput : undefined} onChange={v => set('categorySpecs', { ...draft.categorySpecs, [f.key]: v })} />
              ))}
            </div>
          ))}
        </>
      )}
      <AppModal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add Spec"
        description="Adds a spec to this item only. Category specs are set in Inventory Settings › Categories."
        primaryAction={{
          label: 'Add Spec',
          onClick: () => {
            setTried(true);
            if (!spec.label.trim()) return;
            set('generalSpecs', [...draft.generalSpecs, { id: `gs${Date.now()}`, label: spec.label.trim(), value: spec.value.trim() }]);
            setAdding(false);
          },
        }}
      >
        <div className={record.halves}>
          <TextInput label={required('Spec Name')} value={spec.label} onChange={e => setSpec(s => ({ ...s, label: e.target.value }))} error={tried && !spec.label.trim() ? 'Enter the spec name' : undefined} autoFocus />
          <TextInput label="Value" value={spec.value} onChange={e => setSpec(s => ({ ...s, value: e.target.value }))} />
        </div>
      </AppModal>
    </DetailCard>
  );
}

function SpecInput({ field, value, error, onChange }: { field: SpecField; value: string; error?: string; onChange: (v: string) => void }) {
  const label = field.required ? `${field.label} *` : field.label;
  return field.options ? (
    <Dropdown label={label} placeholder="Select" options={options(field.options)} value={value || null} onChange={v => onChange(v as string)} />
  ) : (
    <TextInput label={field.required ? required(field.label) : field.label} value={value} onChange={e => onChange(e.target.value)} error={error} />
  );
}

/* ---------- Units & Packaging ---------- */

const UNIT_COLUMNS: TableColumn[] = [
  // Figma's header items carry a filter and a sort; like every DataTable, they show while the pointer is over the header
  { key: 'unit', label: 'Unit', width: 190, minWidth: 130 },
  { key: 'contains', label: 'Contains', width: 124 },
  { key: 'uom', label: 'UoM', width: 150, minWidth: 100, filterable: true },
  { key: 'barcode', label: 'Barcode / UPC', width: 'fill', minWidth: 160 },
  { key: 'weight', label: 'Weight', width: 130, minWidth: 112 },
  // The row buttons are 40px and this table's cells have no side padding (items.module.css .unitsTable), so their
  // columns are 40px (fixed, so the data columns take the rest of the width)
  { key: 'print', label: 'Print label', width: 40, labelHidden: true, sortable: false, fixed: true },
  { key: 'remove', label: 'Remove', width: 40, labelHidden: true, sortable: false, fixed: true },
];

/**
 * Figma notes: the base unit can't change once stock has been received. Pack, Case, Pallet … are conversions of it,
 * each with its own barcode and a print-label action. A blank barcode is generated on save; barcodes must be unique
 * across items.
 */
function UnitsCard({ item, draft, set, onNotice }: { item: Item; draft: DetailsDraft; set: SetField; onNotice: (t: string) => void }) {
  const all = useItems();
  const units = draft.units;
  const baseLocked = item.stock.length > 0;
  const update = (id: string, patch: Partial<ItemUnit>) => set('units', units.map(u => (u.id === id ? { ...u, ...patch } : u)));
  const taken = new Set(all.filter(i => i.id !== item.id).flatMap(i => i.units.map(u => u.barcode)).filter(Boolean));
  const duplicate = (u: ItemUnit) => !!u.barcode.trim() && (taken.has(u.barcode.trim()) || units.some(o => o.id !== u.id && o.barcode.trim() === u.barcode.trim()));
  const names = units.map(u => u.unit).filter(Boolean);
  // Sort and filter change only what's shown; the saved order (base unit first) stays
  const [sort, setSort] = useState<DataSort | undefined>();
  const [filters, setFilters] = useState<ColumnFilters>({});
  const [filterOpen, setFilterOpen] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const cellValue = (u: ItemUnit, key: string): string | number => (key === 'contains' ? (u.contains ?? 0) : String(u[key as 'unit' | 'uom' | 'barcode' | 'weight'] ?? ''));
  const shown = sortRows(
    units.filter(u => matchesFilters(u, filters, (x, k) => String(cellValue(x, k)))),
    sort,
    cellValue,
  );

  return (
    <DetailCard
      id="item-units"
      title="Units & Packaging"
      action={
        <>
        {/* The base unit (the first row) always stays */}
        <DeleteAllButton what="Units" count={Math.max(0, units.length - 1)} detail="The base unit stays." onConfirm={() => set('units', units.slice(0, 1))} />
        <Button
          size="medium"
          variant="brand"
          icon="plus"
          // A new row starts on the top choice of each menu: the first unit not yet in the table, counted in the base unit
          onClick={() =>
            set('units', [...units, { id: `u${Date.now()}`, unit: UNIT_NAMES.find(n => !names.includes(n)) ?? '', contains: null, uom: names[0] ?? '', barcode: '', weight: '' }])
          }
        >
          Add Unit
        </Button>
        </>
      }
    >
      <div className={styles.fieldRow}>
        {/* Buying, selling and counting are by the package: Pack, Case, Carton, Bulk or Pallet */}
        <Dropdown label="Buy Unit (Default)" placeholder="Select" options={options(PACKAGES.map(p => p.label))} value={draft.buyUnit || null} onChange={v => set('buyUnit', v as string)} />
        <Dropdown label="Sell Unit (Default)" placeholder="Select" options={options(PACKAGES.map(p => p.label))} value={draft.sellUnit || null} onChange={v => set('sellUnit', v as string)} />
        <Dropdown label="Count Unit (Default)" placeholder="Select" options={options(PACKAGES.map(p => p.label))} value={draft.countUnit || null} onChange={v => set('countUnit', v as string)} />
      </div>
      {/* The box around the table places a column's filter pop-over under its header cell */}
      <div className={warehouseStyles.tableBox} ref={tableRef}>
      <DataTable
        className={styles.unitsTable}
        aria-label="Units"
        columns={UNIT_COLUMNS}
        rows={shown}
        totalRows={units.length}
        rowLabel={u => u.unit || 'New unit'}
        actions={false}
        sort={sort}
        onSortChange={k => setSort(nextSort(k))}
        onFilter={k => setFilterOpen(open => (open === k ? null : k))}
        activeFilters={Object.keys(filters)}
        openFilter={filterOpen ?? undefined}
        empty="No units match these filters."
        cells={u => {
          const i = units.indexOf(u);
          const base = i === 0;
          return {
            unit:
              base && baseLocked ? (
                <EditableCell type="read-only" label="Base unit" value={u.unit} />
              ) : (
                <EditableCell
                  type="select"
                  label={base ? 'Base unit' : 'Unit'}
                  value={u.unit}
                  placeholder="Select"
                  options={UNIT_NAMES.filter(n => n === u.unit || !names.includes(n))}
                  onValueChange={v => {
                    // Renaming a unit carries along the units built from it and the defaults that use it
                    const next = units.map(x => (x.id === u.id ? { ...x, unit: v, ...(base ? { uom: v } : {}) } : x.uom === u.unit ? { ...x, uom: v } : x));
                    set('units', next);
                  }}
                />
              ),
            contains: base ? (
              <EditableCell type="read-only" label="Contains" value="1" />
            ) : (
              <EditableCell label={`${u.unit || 'Unit'} contains`} inputType="number" value={u.contains == null ? '' : String(u.contains)} onValueChange={v => update(u.id, { contains: num(v) })} />
            ),
            uom: base ? (
              <EditableCell type="read-only" label="Unit of measure" value={u.uom} />
            ) : (
              <EditableCell type="select" label={`${u.unit || 'Unit'} unit of measure`} value={u.uom} options={names.slice(0, i).length ? names.slice(0, i) : names} onValueChange={v => update(u.id, { uom: v })} />
            ),
            barcode: (
              <EditableCell
                label={`${u.unit || 'Unit'} barcode`}
                value={u.barcode}
                placeholder="Generated on save"
                error={duplicate(u)}
                onValueChange={v => update(u.id, { barcode: v.replace(/\s/g, '') })}
              />
            ),
            weight: <EditableCell label={`${u.unit || 'Unit'} weight`} value={u.weight} placeholder="0 lbs" onValueChange={v => update(u.id, { weight: v })} />,
            print: <IconButton size="medium" icon="export-download" label={`Print the ${u.unit || 'unit'} label`} onClick={() => onNotice(`${u.unit || 'Unit'} label sent to the printer.`)} />,
            remove: base ? (
              // The base unit stays: a lock in the same button as the rows' remove, which says why when pressed
              <IconButton
                size="medium"
               
                icon="lock"
                label={`${u.unit || 'The base unit'} is the base unit and can’t be removed`}
                title="The base unit can’t be removed"
                onClick={() => onNotice(`${u.unit || 'The base unit'} is the base unit, so it can’t be removed. The other units are counted in it.`)}
              />
            ) : (
              <IconButton
                size="medium"
               
                icon="delete"
                label={`Remove ${u.unit || 'this unit'}`}
                onClick={() =>
                  set(
                    'units',
                    units.filter(x => x.id !== u.id),
                  )
                }
              />
            ),
          };
        }}
      />
      {filterOpen && (
        <ColumnFilter
          key={filterOpen}
          anchor={tableRef.current?.querySelector<HTMLElement>(`[role="columnheader"][data-column="${filterOpen}"]`)}
          label={UNIT_COLUMNS.find(c => c.key === filterOpen)?.label ?? ''}
          options={filterOptions(units, u => String(cellValue(u, filterOpen)))}
          value={filters[filterOpen] ?? []}
          onApply={values => {
            setFilters(f => withFilter(f, filterOpen, values));
            setFilterOpen(null);
          }}
          onClose={() => setFilterOpen(null)}
        />
      )}
      </div>
      {units.some(duplicate) && <p className={`text-small-regular ${styles.fieldError}`}>Barcodes must be unique across items. Change the highlighted barcode.</p>}
    </DetailCard>
  );
}

/* ---------- Warranty ---------- */

const termText = (w: Warranty) => {
  const years = w.termUnit === 'Years' ? w.term : w.term % 12 === 0 ? w.term / 12 : null;
  return years != null ? `${years} year${years === 1 ? '' : 's'}` : `${w.term} months`;
};
/** "Manufacturer · Product", "Installer · Workmanship": who provides it, then what it covers. */
const warrantyTitle = (w: Warranty) => `${w.providedBy} · ${w.covers}`;
const priceText = (n: number | null | undefined) => (n == null ? 'no price yet' : `${n.toFixed(2)}`);
/** The price of an extended warranty, or the standard one's document. */
const warrantyNote = (w: Warranty) => {
  if (w.kind === 'extended') {
    if (w.pricedBy === 'flat') return `Flat price · ${priceText(w.price)}`;
    if (w.pricedBy === 'unit') return `Per unit · ${priceText(w.price)}`;
    const n = w.tiers?.length ?? 0;
    return `Priced by system size · ${n} tier${n === 1 ? '' : 's'}`;
  }
  return !w.document ? 'No document' : w.documentKind === 'link' ? 'Link' : w.document;
};

function WarrantyCard({ item, onNotice }: { item: Item; onNotice: (t: string) => void }) {
  // The warranty in the modal: null = closed, 'new' = Add Warranty
  const [editing, setEditing] = useState<Warranty | 'new' | null>(null);
  const [removing, setRemoving] = useState<Warranty | null>(null);
  const list = [...item.warranties.filter(w => w.kind === 'standard'), ...item.warranties.filter(w => w.kind === 'extended')];

  return (
    <DetailCard
      id="item-warranty"
      title="Warranty"
      action={
        <>
        <DeleteAllButton
          what="Warranties"
          count={list.length}
          onConfirm={() => {
            updateItem(item.id, i => ({ ...i, warranties: [] }));
            onNotice(`All warranties were removed from ${item.name}.`);
          }}
        />
        {/* Figma 1152:23496: one Add Warranty; the type (standard or extended) is chosen in the modal */}
        <Button size="medium" variant="brand" icon="plus" onClick={() => setEditing('new')}>
          Add Warranty
        </Button>
        </>
      }
    >
      {list.length === 0 && <p className={`text-medium-regular ${record.emptyRow}`}>No warranties yet. Use Add Warranty to add one.</p>}
      <ul className={styles.detailList} aria-label="Warranties">
        {list.map(w => (
          <li key={w.id} className={styles.warrantyRow}>
            <Badge shape="pill" color={w.kind === 'extended' ? 'green' : 'black'}>
              {w.kind === 'extended' ? 'Extended' : 'Standard'}
            </Badge>
            <span className={`text-medium-bold ${styles.warrantyTitle}`}>{warrantyTitle(w)}</span>
            <span className="text-medium-regular">{termText(w)}</span>
            <span className={`text-tiny-regular ${styles.warrantyNote}`}>{warrantyNote(w)}</span>
            {/* Figma note: Edit opens the warranty pop-up (the same as Add Warranty) */}
            <IconButton size="medium" icon="edit" label={`Edit the ${warrantyTitle(w)} warranty`} onClick={() => setEditing(w)} />
            <IconButton size="medium" icon="delete" label={`Remove the ${warrantyTitle(w)} warranty`} onClick={() => setRemoving(w)} />
          </li>
        ))}
      </ul>
      <AppModal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove Warranty"
        description={removing && `The ${warrantyTitle(removing)} warranty (${termText(removing)}) will be removed from ${item.name}. Warranties already registered on sold serials don’t change.`}
        primaryAction={{
          label: 'Remove Warranty',
          danger: true,
          onClick: () => {
            if (removing) {
              updateItem(item.id, x => ({ ...x, warranties: x.warranties.filter(y => y.id !== removing.id) }));
              onNotice(`${warrantyTitle(removing)} warranty removed.`);
            }
            setRemoving(null);
          },
        }}
      />
      <WarrantyModal
        open={editing !== null}
        warranty={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onSave={saved => {
          const adding = editing === 'new';
          updateItem(item.id, i => ({ ...i, warranties: adding ? [...i.warranties, saved] : i.warranties.map(w => (w.id === saved.id ? saved : w)) }));
          setEditing(null);
          onNotice(`${warrantyTitle(saved)} warranty ${adding ? 'added' : 'saved'}.`);
        }}
      />
    </DetailCard>
  );
}

/* ---------- Images ---------- */

/**
 * Drag and drop reordering for a short list (Images, Replacement Items). `item(i)` goes on each row: the row being
 * dragged gets `data-dragging`, the row it would land on `data-drop-target`. `move(a, b)` is for keyboard moves.
 */
function useReorder<T>(list: T[], onReorder: (next: T[]) => void) {
  const locked = useContext(LockedContext);
  const from = useRef<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const move = (a: number, b: number) => {
    if (a === b || b < 0 || b >= list.length) return;
    const next = [...list];
    const [moved] = next.splice(a, 1);
    next.splice(b, 0, moved);
    onReorder(next);
  };
  const end = () => {
    from.current = null;
    setDragging(null);
    setOver(null);
  };
  const item = (index: number) => (locked ? {} : {
    draggable: true,
    'data-dragging': dragging === index || undefined,
    'data-drop-target': (dragging != null && over === index && dragging !== index) || undefined,
    onDragStart: (e: DragEvent) => {
      from.current = index;
      setDragging(index);
      e.dataTransfer.effectAllowed = 'move';
      // Firefox only starts a drag that carries data
      e.dataTransfer.setData('text/plain', String(index));
    },
    onDragOver: (e: DragEvent) => {
      if (from.current == null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (over !== index) setOver(index);
    },
    onDrop: (e: DragEvent) => {
      if (from.current == null) return;
      e.preventDefault();
      move(from.current, index);
      end();
    },
    onDragEnd: end,
  });
  return { item, move };
}

/** Pictures of photos added this session, by file name (the prototype keeps only names; a reload drops these). */
const imagePreviews = new Map<string, string>();
/**
 * The sample items' photos (assets/item-photos, credited in its CREDITS.md), by file: "Front View.jpg" shows
 * front-view.jpg.
 */
const SAMPLE_PHOTOS = Object.fromEntries(
  Object.entries(import.meta.glob<string>('../../../../../assets/item-photos/*.jpg', { eager: true, import: 'default' })).map(([path, url]) => [path.split('/').pop()!, url]),
);
const photoFor = (name: string) => imagePreviews.get(name) ?? SAMPLE_PHOTOS[name.toLowerCase().replace(/\s+/g, '-')];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE = 25 * 1024 * 1024;

function ImagesCard({ draft, set, onNotice }: { draft: DetailsDraft; set: SetField; onNotice: (t: string) => void }) {
  const file = useRef<HTMLInputElement>(null);
  const images = draft.images;
  const drag = useReorder(images, next => set('images', next));
  const locked = useContext(LockedContext);
  const [dropping, setDropping] = useState(false);
  const depth = useRef(0);

  // Photos from Upload or dropped on the card: JPG, PNG or WebP up to 25 MB; others are turned away with a notice
  function addFiles(list: File[]) {
    const ok = list.filter(f => IMAGE_TYPES.includes(f.type) && f.size <= MAX_IMAGE);
    const turnedAway = list.length - ok.length;
    const fresh = ok.filter(f => !images.includes(f.name));
    for (const f of fresh) imagePreviews.set(f.name, URL.createObjectURL(f));
    if (fresh.length) set('images', [...images, ...fresh.map(f => f.name)]);
    if (turnedAway) onNotice(`${turnedAway} file${turnedAway === 1 ? ' wasn’t' : 's weren’t'} added: images must be JPG, PNG or WebP up to 25 MB.`);
  }
  // A drag from outside the page carries files; a tile being reordered doesn't, so it's left to the tiles
  const carriesFiles = (e: DragEvent) => [...e.dataTransfer.types].includes('Files');
  const dropProps = {
    onDragEnter: (e: DragEvent) => {
      if (!carriesFiles(e)) return;
      depth.current += 1;
      setDropping(true);
    },
    onDragOver: (e: DragEvent) => {
      if (!carriesFiles(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    },
    onDragLeave: (e: DragEvent) => {
      if (!carriesFiles(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDropping(false);
    },
    onDrop: (e: DragEvent) => {
      if (!carriesFiles(e)) return;
      e.preventDefault();
      depth.current = 0;
      setDropping(false);
      addFiles([...e.dataTransfer.files]);
    },
  };

  return (
    <DetailCard
      id="item-images"
      title="Images"
      action={
        <>
          <DeleteAllButton what="Images" count={images.length} detail="Save to keep the change." onConfirm={() => set('images', [])} />
          <Button size="medium" variant="brand" icon="upload" onClick={() => file.current?.click()}>
            Upload
          </Button>
          <input
            ref={file}
            type="file"
            hidden
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={e => {
              addFiles([...(e.target.files ?? [])]);
              e.target.value = '';
            }}
          />
        </>
      }
    >
      {images.length === 0 ? (
        // No photos yet: the Volt upload drop zone (drag photos onto it, or browse)
        <UploadFile multiple accept="image/jpeg,image/png,image/webp" hint="JPG, PNG or WebP up to 25 MB" onFiles={addFiles} disabled={locked} />
      ) : (
        // With photos: drop more anywhere on the gallery; it outlines in teal while files are over it
        <ul className={styles.gallery} aria-label="Images" data-dropping={dropping || undefined} {...(locked ? {} : dropProps)}>
          {images.map((name, i) => (
            <li key={name} className={styles.imageTile} title={name} {...drag.item(i)}>
              {photoFor(name) ? (
                <img className={styles.tileImage} src={photoFor(name)} alt="" draggable={false} />
              ) : (
                <Icon name="photo" size={32} color="currentColor" />
              )}
              {/* The first image is the main one; drag another to the front to make it the main image */}
              <span className={styles.srOnly}>{i === 0 ? `${name} (main image)` : name}</span>
              {i === 0 && (
                <Tag size="small" selected className={styles.mainTag} aria-hidden>
                  Main
                </Tag>
              )}
              <button type="button" className={styles.tileRemove} aria-label={`Delete ${name}`} title="Delete" onClick={() => set('images', images.filter(n => n !== name))}>
                <Icon name="delete" size={24} color="currentColor" />
              </button>
              <span className={styles.tileDrag} aria-hidden>
                <Icon name="drag-indicator" size={24} color="currentColor" />
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className={`text-small-regular ${styles.cardHint}`}>
        The large image is the main image on lists, quotes and the catalog. Drag another to the front to make it the main
        image. JPG, PNG or WebP up to 25 MB.
      </p>
    </DetailCard>
  );
}

/* ---------- Tracking ---------- */

const TRACKING: { key: 'lotControl' | 'trackExpiry' | 'serialized' | 'nonInventory' | 'discontinued'; title: string; hint: string }[] = [
  { key: 'lotControl', title: 'Lot control', hint: 'Receipts record a lot; picks and moves ask for it.' },
  { key: 'trackExpiry', title: 'Track expiry dates (FEFO)', hint: 'Lots record an expiry date; picks use the earliest expiry first. Needs lot control.' },
  { key: 'serialized', title: 'Serial numbers', hint: 'Each unit gets its own serial number.' },
  { key: 'nonInventory', title: 'Non-inventory item', hint: 'Bought or sold but not stocked (e.g. a service).' },
  {
    key: 'discontinued',
    title: 'Discontinued',
    hint: 'Won’t be purchased again. When sold out, it’s replaced by its replacement item or simply stays inactive.',
  },
];

/** Figma note: a part can be both lot controlled and serialized (rare). Expiry tracking needs lot control. */
function TrackingCard({ draft, onDraftChange, set }: { draft: DetailsDraft; onDraftChange: (d: DetailsDraft) => void; set: SetField }) {
  return (
    <DetailCard id="item-tracking" title="Tracking">
      {TRACKING.map(t => {
        const needsLots = t.key === 'trackExpiry' && !draft.lotControl;
        return (
          <div key={t.key} className={styles.toggleRow}>
            <span className={styles.toggleText}>
              <span className="text-medium-bold" id={`track-${t.key}`}>
                {t.title}
              </span>
              <span className={`text-tiny-regular ${styles.toggleHint}`}>{t.hint}</span>
            </span>
            <Toggle
              aria-labelledby={`track-${t.key}`}
              checked={draft[t.key] && !needsLots}
              disabled={needsLots}
              onChange={e => {
                // Turning lot control off also stops expiry tracking
                if (t.key === 'lotControl' && !e.target.checked) onDraftChange({ ...draft, lotControl: false, trackExpiry: false });
                else set(t.key, e.target.checked);
              }}
            />
          </div>
        );
      })}
    </DetailCard>
  );
}

/* ---------- Compliance ---------- */

function ComplianceCard({ draft, set }: { draft: DetailsDraft; set: SetField }) {
  return (
    <DetailCard
      id="item-compliance"
      title="Compliance"
      action={<MenuButton label="Mark All" items={COMPLIANCE_STATUSES.map(s => ({ label: s, onSelect: () => set('compliance', allCompliance(s)) }))} />}
    >
      {COMPLIANCE.map(c => (
        <div key={c} className={styles.complianceRow}>
          <span className="text-medium-regular">{c}</span>
          <Dropdown
            className={styles.complianceStatus}
            variant="button"
            size="medium"
            label={`${c} status`}
            hideLabel
            options={options(COMPLIANCE_STATUSES)}
            value={draft.compliance[c] ?? 'Not reviewed'}
            onChange={v => set('compliance', { ...draft.compliance, [c]: v as ComplianceStatus })}
          />
        </div>
      ))}
    </DetailCard>
  );
}

/* ---------- Replacement Items ---------- */

/** Figma note: drag to set the order they're offered in; the reason shows to the person picking a substitute. */
function ReplacementCard({ item, onNotice }: { item: Item; onNotice: (t: string) => void }) {
  const all = useItems();
  const [open, setOpen] = useState(false);
  const inactiveReplacement = useHelperFlag('item.inactiveReplacement');
  const linked = item.replacements.map(id => all.find(i => i.id === id)).filter((i): i is Item => !!i);
  // Helper switch: "Inactive replacement" shows the first replacement as inactive, or adds an inactive item when there are none
  const fallback = all.find(i => !i.active && i.id !== item.id);
  const shown: Item[] = !inactiveReplacement ? linked : linked.length ? [{ ...linked[0], active: false }, ...linked.slice(1)] : fallback ? [fallback] : [];
  const reasons = replacementReasons(item);
  const drag = useReorder(shown, next => updateItem(item.id, x => ({ ...x, replacements: next.map(r => r.id) })));

  return (
    <DetailCard
      id="item-replacements"
      title="Replacement Items"
      action={
        <>
          <DeleteAllButton
            what="Replacement Items"
            count={item.replacements.length}
            onConfirm={() => {
              updateItem(item.id, x => ({ ...x, replacements: [] }));
              onNotice(`All replacement items were removed from ${item.name}.`);
            }}
          />
          <Button size="medium" variant="brand" icon="plus" onClick={() => setOpen(true)}>
            Add Replacement
          </Button>
        </>
      }
    >
      {shown.length === 0 && <p className={`text-medium-regular ${record.emptyRow}`}>No replacement items. Use Add Replacement to add one.</p>}
      <ul className={`${styles.detailList} ${styles.replacementList}`} aria-label="Replacement items">
        {shown.map((r, i) => (
          <li key={r.id} className={styles.replacementRow} data-inactive={!r.active || undefined} {...drag.item(i)}>
            {/* Drag the row to reorder; with the keyboard, focus the handle and press ↑ / ↓ */}
            {/* The same Volt compact icon button as the row's delete */}
            <IconButton
              size="medium"
              icon="drag-indicator"
              className={styles.rowDrag}
              label={`Move ${r.name} (${i + 1} of ${shown.length}). Use the up and down arrow keys.`}
              title="Drag to reorder"
              onKeyDown={e => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  drag.move(i, e.key === 'ArrowUp' ? i - 1 : i + 1);
                }
              }}
            />
            {/* Name and reason: side by side when the row has room, the reason under the name when it doesn't */}
            <div className={styles.replacementMain}>
              {/* draggable={false}: a link drags itself as a URL, which would stop the row from moving */}
              <AppLink to={itemPath(r.id)} size="small" className={styles.replacementName} draggable={false}>
                {r.id} · {r.name}
                {!r.active && ' (inactive)'}
              </AppLink>
              <Dropdown
                className={styles.replacementReason}
                variant="button"
                size="medium"
                label={`Why ${r.name} is offered`}
                hideLabel
                options={options(reasons)}
                value={item.replacementReasons[r.id] ?? reasons[0]}
                onChange={v => updateItem(item.id, x => ({ ...x, replacementReasons: { ...x.replacementReasons, [r.id]: v as string } }))}
              />
            </div>
            <IconButton
              size="medium"
              icon="delete"
              label={`Remove ${r.name}`}
              onClick={() => {
                updateItem(item.id, x => ({ ...x, replacements: x.replacements.filter(id => id !== r.id) }));
                onNotice(`${r.name} is no longer a replacement.`);
              }}
            />
          </li>
        ))}
      </ul>
      <ReplacementModal
        open={open}
        item={item}
        all={all}
        onClose={() => setOpen(false)}
        onAdd={ids => {
          updateItem(item.id, x => ({
            ...x,
            replacements: [...x.replacements, ...ids],
            replacementReasons: { ...x.replacementReasons, ...Object.fromEntries(ids.map(id => [id, reasons[0]])) },
          }));
          setOpen(false);
          onNotice(ids.length === 1 ? `${all.find(i => i.id === ids[0])?.name ?? ids[0]} was added as a replacement.` : `${ids.length} replacement items were added.`);
        }}
      />
    </DetailCard>
  );
}

/* ---------- Reorder Details, Last Purchase (not on Figma's Details; kept until their tab exists) ---------- */

function ReorderCard({ draft, set }: { draft: DetailsDraft; set: SetField }) {
  return (
    <Card
      id="item-reorder"
      className={styles.detailCard}
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
    <Card id="item-last-purchase" title="Last Purchase" className={styles.detailCard}>
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

/* ---------- Suppliers tab ---------- */

/** Figma "Inventory / Items / Suppliers" (1152:40675): the supplier fills; the short values keep their width. */
const SUPPLIER_COLUMNS: TableColumn[] = [
  { key: 'supplier', label: 'Supplier', width: 'fill', minWidth: 200 },
  { key: 'partNumber', label: 'Supplier Part #', width: 160, minWidth: 140 },
  { key: 'buyUnit', label: 'Buy Unit', width: 140, minWidth: 120 },
  { key: 'costBuy', label: 'Cost / Buy Unit', width: 150, minWidth: 140 },
  { key: 'costEach', label: 'Cost / Each', width: 130, minWidth: 120 },
  { key: 'breaks', label: 'Price Breaks', width: 140, minWidth: 130, priority: 2 },
  { key: 'leadTime', label: 'Lead Time', width: 130, minWidth: 120, priority: 1 },
  { key: 'updated', label: 'Last Purchased', width: 160, minWidth: 150 },
];

/**
 * A supplier's buy unit: the largest package it has a cost for (e.g. a pallet of 30), or Each. Cost / Each is worked
 * out from it, and its price breaks and lead time are the ones shown.
 */
function buyPackage(s: ItemSupplier) {
  const priced = PACKAGES.filter(p => s.packages[p.key].cost != null);
  const best = priced.sort((a, b) => (s.packages[b.key].quantity ?? 1) - (s.packages[a.key].quantity ?? 1))[0];
  const key = best?.key ?? 'pack';
  const pack = s.packages[key];
  const quantity = pack.quantity ?? 1;
  return {
    label: quantity > 1 ? `${best?.label ?? 'Pack'} (${quantity})` : 'Each',
    cost: pack.cost,
    each: pack.cost == null ? null : pack.cost / quantity,
    breaks: s.priceBreaks[key]?.length ?? 0,
    leadTime: pack.leadTime,
  };
}

/** The value a Suppliers column sorts by. */
function supplierValue(s: ItemSupplier, key: string): string | number {
  const b = buyPackage(s);
  switch (key) {
    case 'buyUnit':
      return b.label;
    case 'costBuy':
      return b.cost ?? 0;
    case 'costEach':
      return b.each ?? 0;
    case 'breaks':
      return b.breaks;
    case 'leadTime':
      return b.leadTime ?? 0;
    case 'updated':
      return Date.parse(s.updated) || 0;
    default:
      return String(s[key as 'supplier' | 'partNumber'] ?? '');
  }
}

/**
 * Item record › Suppliers (Figma "Inventory / Items / Suppliers" 1152:40675): the toolbar (View, Columns, Upload,
 * Actions, Search, Add Supplier), then the suppliers on the Volt Data Table with the primary one tagged, and Figma's
 * footnote. A name opens Edit Supplier; ••• has Edit, Make Primary and Remove.
 */
export function SuppliersTab({ item, onNotice }: { item: Item; onNotice: (t: string) => void }) {
  const [editing, setEditing] = useState<ItemSupplier | 'new' | null>(null);
  const [removing, setRemoving] = useState<ItemSupplier | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [view, setView] = useState('all');
  const cols = useColumns(SUPPLIER_COLUMNS);
  const t = useTableControls(item.suppliers, {
    search: s => `${s.supplier} ${s.partNumber} ${s.partName}`,
    sortValue: supplierValue,
    filter: s => view === 'all' || s.primary,
    paged: false,
  });
  const update = (fn: (list: ItemSupplier[]) => ItemSupplier[]) => updateItem(item.id, i => ({ ...i, suppliers: fn(i.suppliers) }));
  const makePrimary = (s: ItemSupplier) => {
    update(list => list.map(x => ({ ...x, primary: x.id === s.id })));
    onNotice(`${s.supplier} is now the primary supplier.`);
  };

  return (
    <section className={record.card} aria-label="Suppliers">
      <TableToolbar
        label="Suppliers"
        view={{ options: [{ value: 'all', label: 'All' }, { value: 'primary', label: 'Primary' }], value: view, onChange: setView }}
        onColumns={() => cols.setOpen(true)}
        onUpload={() => onNotice('Supplier uploads aren’t designed yet, so no file was read.')}
        actions={{ options: [{ value: 'export', label: 'Export to CSV' }], onAction: () => onNotice(`Exported ${t.rows.length} suppliers to CSV.`), selectedCount: 0 }}
        search={{ value: t.query, onChange: t.setQuery, label: 'Search suppliers' }}
        trailing={
          <Button size="medium" variant="brand" icon="plus" onClick={() => setEditing('new')}>
            Add Supplier
          </Button>
        }
      />
      {/* The Volt DataTable, like every other table in the app */}
      <div className={warehouseStyles.tableBox}>
        <DataTable
          aria-label={`Suppliers of ${item.name}`}
          columns={cols.columns}
          rows={t.rows}
          rowLabel={s => s.supplier}
          sort={t.headerProps.sort}
          onSortChange={t.headerProps.onSortChange}
          empty={item.suppliers.length ? 'No suppliers match your search or view.' : 'No suppliers yet. Use Add Supplier to add one.'}
          cells={s => {
            const b = buyPackage(s);
            return {
              supplier: (
                <span className={styles.supplierName}>
                  <button type="button" className={record.cellLink} onClick={() => setEditing(s)}>
                    {s.supplier}
                  </button>
                  {s.primary && (
                    <Badge shape="pill" color="blue">
                      Primary
                    </Badge>
                  )}
                </span>
              ),
              partNumber: s.partNumber || '—',
              buyUnit: b.label,
              costBuy: money(b.cost),
              costEach: money(b.each),
              breaks: b.breaks ? `${b.breaks} ${b.breaks === 1 ? 'tier' : 'tiers'}` : '—',
              leadTime: b.leadTime == null ? '—' : `${b.leadTime} ${b.leadTime === 1 ? 'day' : 'days'}`,
              updated: s.updated,
            };
          }}
          onMore={s => setMenuFor(m => (m === s.id ? null : s.id))}
          renderAfterRow={s =>
            menuFor === s.id && (
              <RowMenu
                label={s.supplier}
                onClose={() => setMenuFor(null)}
                items={[
                  { label: 'Edit', onSelect: () => setEditing(s) },
                  ...(s.primary ? [] : [{ label: 'Make Primary', onSelect: () => makePrimary(s) }]),
                  { label: 'Remove', onSelect: () => setRemoving(s) },
                ]}
              />
            )
          }
        />
      </div>
      <p className={`text-small-regular ${styles.cardHint}`}>
        Cost / Each is worked out from the buy unit (e.g. a pallet of 30). The primary supplier is used for Suggested Orders and default purchase
        prices. Lead time feeds the reorder calculations.
      </p>
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
      {cols.modal}
    </section>
  );
}

/* ---------- Notes ---------- */

const NOTE_COLUMNS: TableColumn[] = [
  // Name and date are short, so they keep their width and the note takes the rest
  // The author's photo has its own column (no heading), before Created By: the 32px avatar plus the 8px cell padding each side
  { key: 'photo', label: 'Photo', width: 48, labelHidden: true, sortable: false, fixed: true },
  { key: 'author', label: 'Created By', width: 160, fixed: true },
  { key: 'updated', label: 'Last Updated', width: 160, fixed: true },
  { key: 'text', label: 'Note', width: 'fill', minWidth: 160, sortable: false },
  // The 40px pin button with no cell padding (items.module.css .notesTable), 8px before the row's •••
  { key: 'pin', label: 'Pinned', width: 40, labelHidden: true, sortable: false, fixed: true },
];

function NotesCard({ item, onNotice }: { item: Item; onNotice: (t: string) => void }) {
  const { user } = useAuth();
  // Every author shows the current profile photo (initials when there is none)
  const photo = useProfilePhoto();
  const me = user?.name ?? 'TK-421';
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
      className={styles.detailCard}
      action={
        <Button size="medium" variant="brand" icon="plus" onClick={() => setEditing('new')}>
          Add Note
        </Button>
      }
    >
      {/* Figma Notes: the search runs full width under the title */}
      <SearchInput aria-label="Search notes" placeholder="Search" value={query} onChange={e => setQuery(e.target.value)} />
      {/* The Volt DataTable, like every other table in the app */}
      <div className={warehouseStyles.tableBox}>
        <DataTable
          className={styles.notesTable}
          aria-label="Notes"
          columns={NOTE_COLUMNS}
          rows={rows}
          rowLabel={n => `Note by ${n.author}`}
          sort={sort}
          onSortChange={k => setSort(nextSort(k))}
          empty={q ? `No notes match “${query}”.` : 'No notes yet. Use Add Note to add one.'}
          cells={n => ({
            photo: <Avatar size="small" src={photo} initials={initialsOf(n.author)} />,
            author: n.author,
            updated: n.updated,
            text: (
              <button type="button" className={record.cellLink} onClick={() => setEditing(n)}>
                {n.text}
              </button>
            ),
            pin: (
              <IconButton
                size="medium"
                className={styles.notePin}
                icon="bookmark"
                selected={pinned(n)}
                label={pinned(n) ? 'Unpin note' : 'Pin note for everyone'}
                title={n.pinAll ? 'Pinned for everyone' : n.pinMe ? 'Pinned for you' : 'Not pinned'}
                onClick={() => update(list => list.map(x => (x.id === n.id ? { ...x, pinAll: !pinned(n), pinMe: !pinned(n) && x.pinMe } : x)))}
              />
            ),
          })}
          onMore={n => setMenuFor(m => (m === n.id ? null : n.id))}
          renderAfterRow={n =>
            menuFor === n.id && (
              <RowMenu
                label={`note by ${n.author}`}
                onClose={() => setMenuFor(null)}
                items={[
                  { label: 'Edit', onSelect: () => setEditing(n) },
                  { label: 'Delete', onSelect: () => setDeleting(n) },
                ]}
              />
            )
          }
        />
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
