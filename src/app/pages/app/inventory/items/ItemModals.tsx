import { useEffect, useState } from 'react';
import { Button } from '../../../../../components/Button/Button';
import { DataTable, type DataColumn } from '../../../../../components/DataTable/DataTable';
import { TwoLineCell } from '../../../../../components/TwoLineCell/TwoLineCell';
import { RadioButton } from '../../../../../components/RadioButton/RadioButton';
import { TextInput } from '../../../../../components/TextInput/TextInput';
import { AppModal } from '../../../../components/AppModal';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { Scrollbar } from '../../../../../components/Scrollbar/Scrollbar';
import { Tag } from '../../../../../components/Tag/Tag';
import { blankItem, CATEGORIES, TYPE_PREFIX, UNIT_TYPES, unitLabel, type Item, type ItemType } from './itemData';
import { usedIn } from './itemStore';
import { ItemPicker, StatusPill } from './shared';

/**
 * Over 6 items, the merge table scrolls in a box 6 rows tall: DataTable's 54px header and 70px rows (TwoLineCell's two
 * lines in the 68px row, plus its 2px divider). Component dimensions, not spacing tokens.
 */
const MERGE_VISIBLE_ROWS = 6;
// On a short window it gives way so Cancel / Merge Items stay on screen: the rest of the modal and its margins take
// about 500px
const MERGE_SCROLL_HEIGHT = `min(${54 + MERGE_VISIBLE_ROWS * 70}px, 100vh - 500px)`;
/** The merge table: the checked items, with a Keep radio first that picks the one the others merge into. */
const MERGE_COLUMNS: DataColumn[] = [
  { key: 'keep', label: 'Keep', width: 72, sortable: false },
  { key: 'item', label: 'Item', width: 'fill', minWidth: 172, sortable: false },
  { key: 'type', label: 'Type', width: 104, sortable: false },
  { key: 'category', label: 'Category', width: 132, sortable: false },
  { key: 'status', label: 'Status', width: 112, sortable: false },
];
import record from '../record.module.css';
import styles from './items.module.css';

/** The order Figma lists the types in on Create New Item. */
const CREATE_TYPES: ItemType[] = ['Part', 'Kit', 'Assembly'];
const defaultUnit = (type: ItemType) => (type === 'Kit' ? 'Kit (KT)' : 'Each (EA)');

/**
 * Create New Item (ITEMS.md §1; Figma "Modal - Add New Item" 681:14400): the item type (Part, Kit or Assembly; Add New ▾
 * picks the starting one), the System Item # it will get, an optional Custom Item #, the Item Name, then Category,
 * Subcategory and Unit. Create adds it to the catalog and opens its record in a new tab, so the list's tab stays.
 */
export function AddItemModal({
  type: startType,
  existing,
  onClose,
  onCreate,
}: {
  /** The type to start with (from Add New ▾); null closes the modal. */
  type: ItemType | null;
  existing: Item[];
  onClose: () => void;
  onCreate: (item: Item) => void;
}) {
  const [type, setType] = useState<ItemType>('Part');
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [unit, setUnit] = useState('Each (EA)');
  const [suffix, setSuffix] = useState('');
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (!startType) return;
    setType(startType);
    setNumber('');
    setName('');
    setCategory('');
    setSubcategory('');
    setUnit(defaultUnit(startType));
    // The system # the new item gets: its type's prefix (PA, KT, AS) and this part, made once per opening
    setSuffix(blankItem(startType, '').id.split('-').slice(1).join('-'));
    setTried(false);
  }, [startType]);
  const systemNumber = `${TYPE_PREFIX[type]}-${suffix}`;
  const errors = {
    name: !name.trim() ? 'Enter the item name' : undefined,
    number:
      number.trim() && existing.some(i => i.customNumber.toLowerCase() === number.trim().toLowerCase())
        ? `Another item already uses custom # ${number.trim()}`
        : undefined,
  };
  function chooseType(t: ItemType) {
    // Kits are counted as kits: switching to or from Kit moves the unit along unless it was changed by hand
    if (unit === defaultUnit(type)) setUnit(defaultUnit(t));
    setType(t);
  }
  function create() {
    setTried(true);
    if (!startType || errors.name || errors.number) return;
    onCreate(
      blankItem(type, name.trim(), number.trim(), {
        id: systemNumber,
        category,
        subcategory,
        unitType: unit,
        lastPurchase: { supplier: '', date: '', quantity: null, unitType: unit, cost: null },
      }),
    );
  }
  return (
    <AppModal
      open={startType !== null}
      onClose={onClose}
      title="Create New Item"
      description="* Required. Adds the item to the catalog. Open it afterwards to add specs, suppliers and files."
      primaryAction={{ label: 'Create', onClick: create }}
    >
      <form
        className={record.form}
        noValidate
        onSubmit={e => {
          e.preventDefault();
          create();
        }}
      >
        {/* Item type *: Volt Tag (small), the chosen one selected */}
        <div className={styles.typeField} role="group" aria-labelledby="create-item-type">
          <span id="create-item-type" className={`text-medium-regular ${styles.fieldLabel}`}>
            Item type <span className={record.requiredMark}>*</span>
          </span>
          <div className={styles.typeChips}>
            {CREATE_TYPES.map(t => (
              <Tag key={t} size="small" selected={type === t} onClick={() => chooseType(t)}>
                {t}
              </Tag>
            ))}
          </div>
        </div>
        <div className={record.halves}>
          {/* The system # isn't editable: shown as text, bold, where the field would be */}
          <div className={styles.systemNumber}>
            <span className={`text-medium-regular ${styles.fieldLabel}`} id="create-system-number">
              System Item #
            </span>
            <span className={`text-medium-bold ${styles.systemNumberValue}`} aria-labelledby="create-system-number">
              {systemNumber}
            </span>
          </div>
          <TextInput
            label="Custom Item # (optional)"
            value={number}
            onChange={e => setNumber(e.target.value)}
            error={tried ? errors.number : undefined}
            autoComplete="off"
          />
        </div>
        <TextInput
          label="Item Name *"
          value={name}
          onChange={e => setName(e.target.value)}
          error={tried ? errors.name : undefined}
          autoComplete="off"
          required
          autoFocus
        />
        <div className={record.thirds}>
          <Dropdown
            label="Category"
            placeholder="Select"
            options={Object.keys(CATEGORIES).map(c => ({ value: c, label: c }))}
            value={category || null}
            onChange={v => {
              setCategory(v as string);
              setSubcategory('');
            }}
          />
          <Dropdown
            label="Subcategory"
            placeholder="Select"
            options={(CATEGORIES[category] ?? []).map(s => ({ value: s, label: s }))}
            value={subcategory || null}
            onChange={v => setSubcategory(v as string)}
            disabled={!category}
          />
          <Dropdown
            label="Unit *"
            options={UNIT_TYPES.map(u => ({ value: u, label: unitLabel(u) }))}
            value={unit}
            onChange={v => setUnit(v as string)}
            required
          />
        </div>
        <button type="submit" hidden />
      </form>
    </AppModal>
  );
}

/**
 * Merging Items (ITEMS.md §1), from the Items list's Actions › Merge with two or more items checked. The checked items
 * are listed in a table; the Keep radio on each row picks the item the others merge into. The first is picked to start
 * with, so Merge Items is ready at once. `onMerge` gets the item kept and the items merged into it.
 */
export function MergeItemsModal({
  open,
  sources,
  onClose,
  onMerge,
}: {
  open: boolean;
  sources: Item[];
  onClose: () => void;
  onMerge: (target: Item, merged: Item[]) => void;
}) {
  const [target, setTarget] = useState<Item | null>(null);
  useEffect(() => {
    if (open) setTarget(sources[0] ?? null);
    // Only when the modal opens: a new selection reopens it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const table = (
    <DataTable
      aria-label="Items to merge"
      columns={MERGE_COLUMNS}
      rows={sources}
      rowLabel={i => i.name}
      actions={false}
      inactive={i => !i.active}
      cells={i => ({
        keep: (
          <RadioButton name="merge-keep" label="" aria-label={`Keep ${i.name}`} checked={target?.id === i.id} onChange={() => setTarget(i)} />
        ),
        item: <TwoLineCell title={i.id} description={i.name} />,
        type: i.type,
        category: i.category || '—',
        status: <StatusPill active={i.active} />,
      })}
    />
  );

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Merging Items"
      primaryAction={{
        label: 'Merge Items',
        disabled: !target,
        onClick: () => target && onMerge(target, sources.filter(s => s.id !== target.id)),
      }}
    >
      <div className={styles.modalBody}>
        {/* Copy from Figma "Merging Items"; Large/Regular, the same size as the Delete Items modal */}
        <p className="text-large-regular">
          This Merge option allows you to combine all selected Items with the Item chosen below. All data will be
          synchronized with the selected Item, including Assemblies, Kits, and Orders. Once the merge is complete, the
          selected Item will replace the merged Items, and the merged Items will be deactivated.
        </p>
        {/* The warning one size down from the body: Volt Medium/Semi-Bold, in the error red */}
        <p className={`text-medium-semi-bold ${styles.warning}`}>Warning: This process cannot be undone once the merge is complete.</p>
        {sources.length > MERGE_VISIBLE_ROWS ? (
          // More than 6 items: they scroll inside the Volt Scrollbar, which shows 6 rows at a time
          <Scrollbar label="Items to merge" height={MERGE_SCROLL_HEIGHT}>
            {table}
          </Scrollbar>
        ) : (
          table
        )}
      </div>
    </AppModal>
  );
}

/** Deleting Items / Deleting Part - Confirmation Required (ITEMS.md §1, §2). */
export function DeleteItemsModal({
  open,
  items,
  noun = 'Items',
  onClose,
  onConfirm,
}: {
  open: boolean;
  items: Item[];
  /** "Items" from the list; "Part", "Assembly" or "Kit" from a record. */
  noun?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={`Deleting ${noun} - Confirmation Required`}
      primaryAction={{ label: `Delete ${noun}`, danger: true, onClick: onConfirm }}
    >
      <div className={styles.modalBody}>
        {/* Copy from Figma "Modal - Delete Items" (681:14500), Large/Regular; the last line is a red "Warning:" like
            Merging Items' */}
        <p className="text-large-regular">
          You are about to delete the selected Item(s). Deleting these Items will remove them from any Kits, Assemblies,
          or Orders where they are currently used. If an active replacement Item is available, it will be substituted
          automatically where applicable.
        </p>
        <p className={`text-medium-semi-bold ${styles.warning}`}>
          Warning: This action cannot be undone. Please confirm that you want to proceed with the deletion.
        </p>
      </div>
    </AppModal>
  );
}

export type DeactivateChoice = 'replace' | 'deactivate' | 'remove';

/**
 * Deactivating Part - Active Assemblies or Kits Error (ITEMS.md §2), shown when active builds use the item; it asks
 * what to do with them. An item no build uses gets the plain Confirm Deactivation.
 */
export function DeactivateItemModal({
  item,
  all,
  onClose,
  onConfirm,
}: {
  item: Item | null;
  all: Item[];
  onClose: () => void;
  onConfirm: (how: DeactivateChoice | 'none', replacementId?: string) => void;
}) {
  const [how, setHow] = useState<DeactivateChoice>('replace');
  const [replacement, setReplacement] = useState<Item | null>(null);
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (!item) return;
    setHow('replace');
    setReplacement(null);
    setTried(false);
  }, [item]);
  const users = item ? usedIn(item.id, all).filter(i => i.active) : [];

  if (item && users.length === 0) {
    return (
      <AppModal
        open
        onClose={onClose}
        title="Confirm Deactivation"
        description={`You are about to DEACTIVATE ${item.name}. It stays on file and can be activated again. Do you want to continue?`}
        primaryAction={{ label: 'Confirm', onClick: () => onConfirm('none') }}
      />
    );
  }

  const word = item?.type ?? 'Part';
  const assemblies = users.filter(u => u.type === 'Assembly').length;
  const kits = users.filter(u => u.type === 'Kit').length;
  const usedText = [assemblies && `${assemblies} active ${assemblies === 1 ? 'assembly' : 'assemblies'}`, kits && `${kits} active ${kits === 1 ? 'kit' : 'kits'}`]
    .filter(Boolean)
    .join(' and ');
  const candidates = all.filter(i => i.active && i.id !== item?.id && i.type === word);

  return (
    <AppModal
      open={item !== null}
      onClose={onClose}
      title={`Deactivating ${word} - Active Assemblies or Kits Error`}
      primaryAction={{
        label: `Deactivate ${word}`,
        onClick: () => {
          setTried(true);
          if (how === 'replace' && !replacement) return;
          onConfirm(how, replacement?.id);
        },
      }}
    >
      <div className={styles.modalBody}>
        <p className="text-medium-regular">
          {item?.name} is used in {usedText}: {users.map(u => u.name).join(', ')}.
        </p>
        <p className="text-large-bold">Would You Like To?</p>
        <div className={styles.radios} role="radiogroup" aria-label="What to do with the builds">
          <RadioButton
            name="deactivate-how"
            label={`Replace this ${word.toLowerCase()} with another (recommended)`}
            checked={how === 'replace'}
            onChange={() => setHow('replace')}
          />
          {how === 'replace' && (
            <div className={styles.indent}>
              {replacement ? (
                <div className={styles.segmentRow}>
                  <span className="text-medium-regular">
                    Replace with <strong>{replacement.name}</strong> ({replacement.id})
                  </span>
                  <Button size="small" variant="outline" onClick={() => setReplacement(null)}>
                    Change
                  </Button>
                </div>
              ) : (
                <>
                  <ItemPicker items={candidates} onPick={setReplacement} label={`${word} Name`} placeholder={`Search for the replacement ${word.toLowerCase()}`} />
                  {tried && <p className={`text-small-regular ${styles.warning}`}>Choose the {word.toLowerCase()} to use instead.</p>}
                </>
              )}
            </div>
          )}
          <RadioButton
            name="deactivate-how"
            label="Deactivate the assemblies and kits that include it"
            checked={how === 'deactivate'}
            onChange={() => setHow('deactivate')}
          />
          <RadioButton
            name="deactivate-how"
            label="Remove it from those assemblies and kits"
            checked={how === 'remove'}
            onChange={() => setHow('remove')}
          />
        </div>
      </div>
    </AppModal>
  );
}
