import { useEffect, useState } from 'react';
import { Button } from '../../../../../components/Button/Button';
import { Badge } from '../../../../../components/Badge/Badge';
import { Checkbox } from '../../../../../components/Checkbox/Checkbox';
import { Icon } from '../../../../../components/Icon/Icon';
import { RadioButton } from '../../../../../components/RadioButton/RadioButton';
import { TextInput } from '../../../../../components/TextInput/TextInput';
import { AppModal } from '../../../../components/AppModal';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { Scrollbar } from '../../../../../components/Scrollbar/Scrollbar';
import { Tag } from '../../../../../components/Tag/Tag';
import { blankItem, CATEGORIES, TYPE_PREFIX, UNIT_TYPES, unitLabel, type Item, type ItemType } from './itemData';
import { itemUsage, openOrdersUsing, usedIn, useItems, type ItemUsage } from './itemStore';
import { ItemPicker } from './shared';
import { useOrders } from '../orders/orderStore';
import type { Order } from '../orders/orderData';

/**
 * With 7 or more items, the merge cards scroll in a box 6 cards tall: each card is MERGE_CARD_HEIGHT (its two text
 * lines and 12px padding top and bottom) with 8px between. Component dimensions, not spacing tokens.
 */
const MERGE_VISIBLE_CARDS = 6;
const MERGE_CARD_HEIGHT = 60;
// On a short window it gives way so Cancel / Merge Items stay on screen: the rest of the modal and its margins take
// about 560px
const MERGE_SCROLL_HEIGHT = `min(${MERGE_VISIBLE_CARDS * MERGE_CARD_HEIGHT + (MERGE_VISIBLE_CARDS - 1) * 8}px, 100vh - 560px)`;
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
              <Tag key={t} size="medium" selected={type === t} onClick={() => chooseType(t)}>
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
 * Merge Items (ITEMS.md §1; Figma "Modal - Merge" 681:14487, "Merge Items (Improved)"), from the Items list's Actions ›
 * Merge with two or more items of one type checked. One radio card per item: the kept one (the first to start with) has
 * the Selected look and a blue Keep pill, the others "Merge & deactivate". Under the cards, what moves to the kept item,
 * then "I understand this can't be undone", which Merge Items waits for. `onMerge` gets the item kept and the others.
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
  const orders = useOrders();
  const [targetId, setTargetId] = useState<string | null>(null);
  const [understood, setUnderstood] = useState(false);
  useEffect(() => {
    // Each time it opens: the first item kept, the box unticked (closing or cancelling resets it)
    if (open) {
      setTargetId(sources[0]?.id ?? null);
      setUnderstood(false);
    }
    // Only when the modal opens: a new selection reopens it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const target = sources.find(s => s.id === targetId) ?? sources[0];
  const merged = sources.filter(s => s.id !== target?.id);
  const others = merged.length > 1;
  const moves = target ? mergeMoves(target, merged, orders) : [];

  const cards = (
    <div className={styles.mergeCards} role="radiogroup" aria-label="Item to keep">
      {sources.map(i => {
        const kept = i.id === target?.id;
        return (
          // A click anywhere on the card picks it; the radio inside is what the keyboard and screen readers use (the card
          // isn't a <label>, because Volt's RadioButton is one and labels can't nest)
          <div key={i.id} className={styles.mergeCard} data-kept={kept || undefined} onClick={() => setTargetId(i.id)}>
            <RadioButton name="merge-keep" label="" aria-label={`Keep ${i.id} · ${i.name}`} checked={kept} onChange={() => setTargetId(i.id)} />
            <span className={styles.mergeCardText}>
              <span className="text-medium-bold">
                {i.id} · {i.name}
              </span>
              <span className={`text-tiny-regular ${styles.mergeCardMeta}`}>{itemSummary(i)}</span>
            </span>
            <Badge shape="pill" color={kept ? 'blue' : 'black'}>
              {kept ? 'Keep' : 'Merge & deactivate'}
            </Badge>
          </div>
        );
      })}
    </div>
  );

  return (
    <AppModal
      open={open}
      onClose={onClose}
      width={900}
      title={`Merge ${sources.length} items into one`}
      description={`Choose the item to keep. Everything from the other ${others ? 'items moves to it, and the other items are' : 'item moves to it, and the other item is'} deactivated.`}
      primaryAction={{
        label: 'Merge Items',
        disabled: !target || !understood,
        onClick: () => target && onMerge(target, merged),
      }}
    >
      <div className={styles.mergeBody}>
        <div className={styles.mergeKeep}>
          <p className={`text-tiny-semi-bold ${styles.mergeEyebrow}`}>KEEP THIS ITEM</p>
          {sources.length > MERGE_VISIBLE_CARDS ? (
            // 7 or more items: the cards scroll inside the Volt Scrollbar, 6 at a time
            <Scrollbar label="Items to merge" height={MERGE_SCROLL_HEIGHT}>
              {cards}
            </Scrollbar>
          ) : (
            cards
          )}
        </div>
        {target && moves.length > 0 && (
          <div className={styles.mergeMoves}>
            <p className="text-medium-bold">What moves to {target.id}</p>
            <ul className={`text-medium-regular ${styles.mergeMoveList}`}>
              {moves.map(m => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}
        {/* Volt Checkbox Small: Figma's 22px box beside the text, not the 44px default */}
        <Checkbox
          size="small"
          label={<span className={styles.mergeConfirm}>I understand this can’t be undone</span>}
          checked={understood}
          onChange={e => setUnderstood(e.target.checked)}
        />
      </div>
    </AppModal>
  );
}

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;
const listOf = (names: string[]) => (names.length < 3 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

/** A card's second line: "324 on hand · 3 warehouses · 2 suppliers · used in 2 kits" (the used-in part only when used). */
function itemSummary(i: Item) {
  const onHand = i.stock.reduce((t, s) => t + s.onHand, 0);
  const parts = [`${onHand.toLocaleString('en-US')} on hand`, plural(new Set(i.stock.map(s => s.warehouse)).size, 'warehouse'), plural(i.suppliers.length, 'supplier')];
  const users = usedIn(i.id);
  if (users.length) {
    const kinds = new Set(users.map(u => u.type));
    const one = kinds.size === 1 ? [...kinds][0] : null;
    parts.push(`used in ${one ? plural(users.length, one.toLowerCase(), one === 'Assembly' ? 'assemblies' : undefined) : plural(users.length, 'build')}`);
  }
  return parts.join(' · ');
}

/** "What moves to …": one line per kind of thing that moves, left out when there's none. */
function mergeMoves(target: Item, merged: Item[], orders: Order[]) {
  const ids = merged.map(m => m.id);
  const lines: string[] = [];
  const units = merged.reduce((t, m) => t + m.stock.reduce((u, s) => u + s.onHand, 0), 0);
  const stocked = merged.filter(m => m.stock.length).map(m => m.id);
  if (units > 0) lines.push(`${plural(units, 'unit')} of stock (${listOf(stocked)}), with cost history`);
  const suppliers = [...new Set(merged.flatMap(m => m.suppliers.map(s => s.supplier)))];
  if (suppliers.length) lines.push(`${plural(suppliers.length, 'supplier')} (${listOf(suppliers)}) added to the supplier list`);
  const open = openOrdersUsing(ids, orders).length;
  if (open) lines.push(`${plural(open, 'open order')} updated to use ${target.id}`);
  lines.push(
    merged.length === 1
      ? `${ids[0]} stays as an alias of ${target.id}, so searching for ${ids[0]} (or scanning its old labels) finds ${target.id}`
      : `${listOf(ids)} stay as aliases of ${target.id}, so searching for any of them (or scanning their old labels) finds ${target.id}`,
  );
  return lines;
}

/**
 * Delete Items (ITEMS.md §1, §2; Figma "Modal - Delete Items" 681:14500, "Delete Items (Improved)"), from the Items
 * list's Actions › Delete and a record's Delete. Only items that were never used are deleted; any item with history
 * (past or open orders, stock, a build that includes it) is deactivated instead, so that history is kept. The two
 * groups are listed apart, each in-use item says why, and an optional replacement takes the deactivated items' place in
 * open orders and builds. The red button says what will happen ("Deactivate 2 & Delete 1"). `onConfirm` gets the
 * replacement's id, if one was picked.
 */
export function DeleteItemsModal({
  open,
  items,
  onClose,
  onConfirm,
}: {
  open: boolean;
  items: Item[];
  onClose: () => void;
  onConfirm: (replacementId?: string) => void;
}) {
  const all = useItems();
  const orders = useOrders();
  const [replacement, setReplacement] = useState<Item | null>(null);
  useEffect(() => {
    if (open) setReplacement(null);
  }, [open]);

  const usage = new Map(items.map(i => [i.id, itemUsage(i, all, orders)]));
  const deletable = items.filter(i => usage.get(i.id)!.neverUsed);
  const inUse = items.filter(i => !usage.get(i.id)!.neverUsed);
  // The replacement only matters when a deactivated item is on an open order or in a build
  const needsReplacement = inUse.some(i => usage.get(i.id)!.openOrders > 0 || usage.get(i.id)!.builds.length > 0);
  const candidates = all.filter(i => i.active && !items.some(x => x.id === i.id) && (inUse.length === 0 || i.type === inUse[0].type));

  const n = (count: number, one: string, many = `${one}s`) => `${count.toLocaleString('en-US')} ${count === 1 ? one : many}`;
  const action =
    deletable.length && inUse.length
      ? `Deactivate ${inUse.length} & Delete ${deletable.length}`
      : deletable.length
        ? `Delete ${n(deletable.length, 'item')}`
        : `Deactivate ${n(inUse.length, 'item')}`;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      width={900}
      title={`Delete ${items.length === 1 ? items[0].name : n(items.length, 'item')}?`}
      description="Items with any history (past orders, stock or cost history) are always deactivated instead of deleted, for every role."
      primaryAction={{ label: action, danger: true, onClick: () => onConfirm(needsReplacement ? replacement?.id : undefined) }}
    >
      <div className={styles.deleteBody}>
        {deletable.length > 0 && (
          <section className={styles.deleteGroup} aria-label="Can be deleted">
            <p className={`text-tiny-semi-bold ${styles.mergeEyebrow}`}>CAN BE DELETED · NEVER USED ({deletable.length})</p>
            {deletable.map(i => (
              <div key={i.id} className={styles.deleteRow}>
                <Icon name="delete" size={20} color="currentColor" />
                <span className="text-medium-regular">
                  {i.id} · {i.name}
                </span>
              </div>
            ))}
          </section>
        )}
        {inUse.length > 0 && (
          <section className={styles.deleteGroup} aria-label="In use, will be deactivated">
            <p className={`text-tiny-semi-bold ${styles.mergeEyebrow}`}>IN USE · WILL BE DEACTIVATED ({inUse.length})</p>
            {inUse.map(i => (
              <div key={i.id} className={styles.deleteRow} data-in-use="">
                <Icon name="caution" size={20} color="currentColor" />
                <span className={styles.deleteRowText}>
                  <span className="text-medium-regular">
                    {i.id} · {i.name}
                  </span>
                  <span className={`text-tiny-regular ${styles.mergeCardMeta}`}>{usageText(usage.get(i.id)!)}</span>
                </span>
              </div>
            ))}
          </section>
        )}
        {needsReplacement &&
          (replacement ? (
            <div className={styles.segmentRow}>
              <span className="text-medium-regular">
                Replacement for open orders and builds: <strong>{replacement.name}</strong> ({replacement.id})
              </span>
              <Button size="medium" variant="outline" onClick={() => setReplacement(null)}>
                Change
              </Button>
            </div>
          ) : (
            <div className={styles.deleteReplacement}>
              <span className="text-medium-regular" id="delete-replacement-label">
                Replacement item for open orders (optional)
              </span>
              <ItemPicker items={candidates} onPick={setReplacement} label="Replacement item for open orders" placeholder="Search items…" />
            </div>
          ))}
      </div>
    </AppModal>
  );
}

/** An in-use item's reason line: "Used in 14 past orders · 893 on hand · on 1 open order · used in 2 kits". */
function usageText(u: ItemUsage) {
  const parts: string[] = [];
  if (u.pastOrders) parts.push(`Used in ${plural(u.pastOrders, 'past order')}`);
  if (u.onHand) parts.push(`${u.onHand.toLocaleString('en-US')} on hand`);
  if (u.openOrders) parts.push(`on ${plural(u.openOrders, 'open order')}`);
  if (u.builds.length) {
    const kinds = new Set(u.builds.map(b => b.type));
    const one = kinds.size === 1 ? [...kinds][0] : null;
    parts.push(`used in ${one ? plural(u.builds.length, one.toLowerCase(), one === 'Assembly' ? 'assemblies' : undefined) : plural(u.builds.length, 'build')}`);
  }
  return parts.length ? parts.join(' · ') : 'Has stock or cost history';
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
                  <Button size="medium" variant="outline" onClick={() => setReplacement(null)}>
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
