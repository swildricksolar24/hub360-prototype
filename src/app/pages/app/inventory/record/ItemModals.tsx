import { useEffect, useState } from 'react';
import { Checkbox } from '../../../../../components/Checkbox/Checkbox';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { Scrollbar } from '../../../../../components/Scrollbar/Scrollbar';
import { Tag } from '../../../../../components/Tag/Tag';
import { Toggle } from '../../../../../components/Toggle/Toggle';
import { Icon } from '../../../../../components/Icon/Icon';
import { SearchInput } from '../../../../../components/SearchBar/SearchBar';
import { TextInput } from '../../../../../components/TextInput/TextInput';
import { AppModal } from '../../../../components/AppModal';
import type { Warehouse } from '../warehouseData';
import { ITEM_TYPES, type CatalogItem, type ItemType, type WarehouseItem, type WarehouseLocation } from '../warehouseRecordData';
import { codeOf } from './locationTree';
import { MenuButton } from './tableKit';
import styles from '../record.module.css';

/** The icon beside an item in search results. */
export const ITEM_ICONS: Record<ItemType, string> = { Part: 'part', Assembly: 'settings', Kit: 'archive' };

/**
 * Figma "Modal- Add Item" Default / Search (571:41931, 571:41966): search items and pick one, or add every result with
 * Add All Items. Add New ▾ (Part, Assembly, Kit) sits beside the search, because the modal footer holds only buttons.
 */
export function SearchItemsModal({
  open,
  title = 'Search Items',
  items,
  onClose,
  onPick,
  onPickAll,
  onAddNew,
}: {
  open: boolean;
  title?: string;
  /** The items that can be added (already-added ones left out). */
  items: CatalogItem[];
  onClose: () => void;
  onPick: (item: CatalogItem) => void;
  onPickAll: (items: CatalogItem[]) => void;
  /** Shows Add New ▾ (Part, Assembly, Kit). */
  onAddNew?: (type: ItemType) => void;
}) {
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (open) setQuery('');
  }, [open]);
  const q = query.trim().toLowerCase();
  const results = q ? items.filter(i => `${i.name} ${i.number} ${i.type} ${i.category} ${i.subCategory}`.toLowerCase().includes(q)) : [];

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={title}
      startAction={{ label: 'Add All Items', disabled: results.length === 0, onClick: () => onPickAll(results) }}
    >
      <div className={styles.searchRow}>
        <SearchInput
          className={styles.toolbarSearch}
          aria-label="Search items"
          placeholder="Search by name, item # or type"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        {/* Add New ▾: just the type names, no icons */}
        {onAddNew && <MenuButton label="Add New" items={ITEM_TYPES.map(type => ({ label: type, onSelect: () => onAddNew(type) }))} />}
      </div>
      {!q && <p className={`text-medium-regular ${styles.noResults}`}>Type a name, item # or type to find items.</p>}
      {q && results.length === 0 && (
        <p className={`text-medium-regular ${styles.noResults}`}>
          No items match “{query}”.{onAddNew ? ' Use Add New to create one.' : ''}
        </p>
      )}
      {results.length > 0 && (
        <ul className={styles.results} aria-label="Items">
          {results.map(i => (
            <li key={i.id}>
              <button type="button" className={styles.result} onClick={() => onPick(i)}>
                <span className={styles.resultIcon}>
                  <Icon name={ITEM_ICONS[i.type]} size={24} color="currentColor" />
                </span>
                <span className={styles.resultText}>
                  <span className={styles.resultName}>{i.name}</span>
                  <span className={styles.resultSub}>Item # {i.number}</span>
                </span>
                <span className={styles.resultSide}>
                  Type
                  <br />
                  <strong>{i.type}</strong>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </AppModal>
  );
}

/** What Copy Items hands back: the source, the extras to copy, and what happens to items already here. */
export type CopyOptions = { levels: boolean; suppliers: boolean; locations: boolean; existing: 'update' | 'skip' };

/**
 * Copy Items from Another Warehouse (WAREHOUSE_RECORD.md 6c; Figma "Copy Items from Warehouse (Improved)" 1167:62298),
 * from the Items tab's Add Item ▾ › Clone Warehouse. Pick the warehouse to copy from; its item list is copied, never its
 * stock quantities. "Also copy" switches add the stocking levels (on), preferred suppliers (on) and default locations
 * (off; only where a location with the same code exists here). Items already here are updated (the default) or
 * skipped. A preview says what will happen before "Copy N Items". Replaces Figma's older "Modal- Add Warehouse /
 * Search" and its confirmation.
 */
export function CopyItemsModal({
  open,
  warehouseName,
  warehouses,
  itemsOf,
  hereIds,
  onClose,
  onCopy,
}: {
  open: boolean;
  /** This warehouse's name. */
  warehouseName: string;
  /** The other warehouses. */
  warehouses: Warehouse[];
  /** A warehouse's items. */
  itemsOf: (w: Warehouse) => WarehouseItem[];
  /** The items this warehouse already carries. */
  hereIds: Set<string>;
  onClose: () => void;
  onCopy: (from: Warehouse, options: CopyOptions) => void;
}) {
  const [fromCode, setFromCode] = useState('');
  const [opts, setOpts] = useState<CopyOptions>({ levels: true, suppliers: true, locations: false, existing: 'update' });
  useEffect(() => {
    if (!open) return;
    setFromCode('');
    setOpts({ levels: true, suppliers: true, locations: false, existing: 'update' });
  }, [open]);

  const from = warehouses.find(w => w.code === fromCode);
  const source = from ? itemsOf(from) : [];
  const fresh = source.filter(i => !hereIds.has(i.id)).length;
  const already = source.length - fresh;
  // Items already here only change when something besides the list is copied
  const updating = opts.existing === 'update' && (opts.levels || opts.suppliers || opts.locations) ? already : 0;
  const n = (count: number, one: string) => `${count.toLocaleString('en-US')} ${one}${count === 1 ? '' : 's'}`;
  const preview = !from
    ? null
    : fresh === 0 && updating === 0
      ? `${warehouseName} already carries every item in ${from.name}, so there’s nothing to copy.`
      : [
          fresh ? `${n(fresh, 'item')} will be added.` : 'No new items to add.',
          already
            ? updating
              ? `${already.toLocaleString('en-US')} already here will have their settings updated.`
              : `${already.toLocaleString('en-US')} already here will be left as they are.`
            : '',
        ]
          .filter(Boolean)
          .join(' ');
  const action = fresh ? `Copy ${n(fresh, 'Item')}` : updating ? `Update ${n(updating, 'Item')}` : 'Copy Items';

  const extras: { key: 'levels' | 'suppliers' | 'locations'; title: string; note: string }[] = [
    { key: 'levels', title: 'Min, reorder point and max', note: from ? `Stocking levels from ${from.name}.` : 'Stocking levels from that warehouse.' },
    { key: 'suppliers', title: 'Preferred suppliers', note: 'Each item’s preferred supplier for that warehouse.' },
    { key: 'locations', title: 'Default locations', note: 'Only where a location with the same code exists here.' },
  ];

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Copy Items from Another Warehouse"
      description={`Copies the item list to ${warehouseName}. Stock quantities are never copied.`}
      primaryAction={{ label: action, disabled: !from || (fresh === 0 && updating === 0), onClick: () => from && onCopy(from, opts) }}
    >
      <div className={styles.copyBody}>
        <Dropdown
          label="Copy from *"
          placeholder="Select a warehouse"
          options={warehouses.map(w => ({ value: w.code, label: `${w.name} (${w.code}) · ${n(itemsOf(w).length, 'item')}` }))}
          value={fromCode}
          onChange={v => setFromCode(v as string)}
        />
        <div className={styles.copyGroup}>
          <p className={`text-medium-regular ${styles.catalogMeta}`}>Also copy</p>
          {extras.map(x => (
            <div key={x.key} className={styles.copyOption}>
              <span className={styles.catalogCardText}>
                <span className="text-medium-bold">{x.title}</span>
                <span className={`text-tiny-regular ${styles.catalogMeta}`}>{x.note}</span>
              </span>
              <Toggle aria-label={x.title} checked={opts[x.key]} onChange={e => setOpts(o => ({ ...o, [x.key]: e.target.checked }))} />
            </div>
          ))}
        </div>
        <div className={styles.copyExisting}>
          <p className={`text-medium-regular ${styles.catalogMeta}`} id="copy-existing">
            Items already at {warehouseName}
            {from ? ` (${already.toLocaleString('en-US')})` : ''}
          </p>
          <div className={styles.catalogTypes} role="group" aria-labelledby="copy-existing">
            <Tag size="medium" selected={opts.existing === 'update'} onClick={() => setOpts(o => ({ ...o, existing: 'update' }))}>
              Update their settings
            </Tag>
            <Tag size="medium" selected={opts.existing === 'skip'} onClick={() => setOpts(o => ({ ...o, existing: 'skip' }))}>
              Skip them
            </Tag>
          </div>
        </div>
        {preview && (
          <p className={`text-medium-bold ${styles.copyPreview}`} aria-live="polite">
            <Icon name="information" size={20} color="currentColor" />
            <span>{preview}</span>
          </p>
        )}
      </div>
    </AppModal>
  );
}

/** Asks before items leave the warehouse; their stock records here go with them. */
export function RemoveItemsModal({
  items,
  stockCount,
  onClose,
  onConfirm,
}: {
  items: WarehouseItem[];
  stockCount: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const what = items.length === 1 ? items[0]!.name : `${items.length} items`;
  return (
    <AppModal
      open={items.length > 0}
      onClose={onClose}
      title={items.length === 1 ? 'Remove item?' : 'Remove items?'}
      description={`${what} will be removed from this warehouse${
        stockCount ? `, along with ${stockCount === 1 ? '1 stock record' : `${stockCount} stock records`}` : ''
      }. ${items.length === 1 ? 'It stays' : 'They stay'} in Items.`}
      primaryAction={{ label: items.length === 1 ? 'Remove Item' : 'Remove Items', danger: true, onClick: onConfirm }}
    />
  );
}

/** What Add Items' "Settings for the selected items" hands back: each is optional. */
export type AddItemSettings = { locationId?: string; min?: number; reorderPoint?: number; max?: number };

/** More than this many results scroll inside the Volt Scrollbar; each card is ADD_CARD_HEIGHT with 8px between. */
const ADD_VISIBLE_CARDS = 3;
const ADD_CARD_HEIGHT = 62;
// On a short window it gives way so the settings and the buttons stay on screen: the rest takes about 560px
const ADD_SCROLL_HEIGHT = `min(${ADD_VISIBLE_CARDS * ADD_CARD_HEIGHT + (ADD_VISIBLE_CARDS - 1) * 8}px, 100vh - 560px)`;
const TYPE_FILTERS: (ItemType | 'all')[] = ['all', 'Part', 'Kit', 'Assembly'];

/**
 * Add Items to {warehouse} (WAREHOUSE_RECORD.md Items; Figma "Add from Catalog (Improved)" 1167:62250), from the Items
 * tab's Add Item ▾ › Add Items. Search the catalog and filter by type, then check any number of items: a card is
 * checked by a click anywhere on it. Items this warehouse already carries are marked "Already stocked here" and can't
 * be picked again. Optional settings for everything checked: a default location and Min / Reorder Pt / Max.
 * "Add N Items" adds them. Replaces Figma's older "Modal- Add Item - Search" and its Add All Items button.
 */
export function AddFromCatalogModal({
  open,
  warehouseName,
  catalog,
  stockedIds,
  locations,
  onClose,
  onAdd,
}: {
  open: boolean;
  warehouseName: string;
  /** Every item in the company. */
  catalog: CatalogItem[];
  /** The items this warehouse already carries. */
  stockedIds: Set<string>;
  /** This warehouse's locations, for "Default location". */
  locations: WarehouseLocation[];
  onClose: () => void;
  onAdd: (items: CatalogItem[], settings: AddItemSettings) => void;
}) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<ItemType | 'all'>('all');
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [locationId, setLocationId] = useState('');
  const [levels, setLevels] = useState({ min: '', reorderPoint: '', max: '' });
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setType('all');
    setChecked(new Set());
    setLocationId('');
    setLevels({ min: '', reorderPoint: '', max: '' });
  }, [open]);

  const q = query.trim().toLowerCase();
  // The items that can be picked come first, as in Figma; the ones already stocked here follow
  const results = catalog
    .filter(i => (type === 'all' || i.type === type) && (!q || `${i.name} ${i.number} ${i.type} ${i.category} ${i.subCategory}`.toLowerCase().includes(q)))
    .sort((a, b) => Number(stockedIds.has(a.id)) - Number(stockedIds.has(b.id)));
  const picked = catalog.filter(i => checked.has(i.id));
  const toggle = (id: string) =>
    setChecked(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Min / Reorder Pt / Max: whole numbers, 0 or more; Max can't be under Min
  const num = (v: string) => (v.trim() === '' ? undefined : Number(v));
  const bad = (v: string) => v.trim() !== '' && (!Number.isInteger(Number(v)) || Number(v) < 0);
  const errors = {
    min: bad(levels.min) ? 'Enter a whole number' : undefined,
    reorderPoint: bad(levels.reorderPoint) ? 'Enter a whole number' : undefined,
    max: bad(levels.max)
      ? 'Enter a whole number'
      : num(levels.max) !== undefined && num(levels.min) !== undefined && num(levels.max)! < num(levels.min)!
        ? 'Can’t be under Min'
        : undefined,
  };
  const valid = !errors.min && !errors.reorderPoint && !errors.max;

  const plural = (n: number, one: string) => `${n.toLocaleString('en-US')} ${one}${n === 1 ? '' : 's'}`;
  const count = q ? `${plural(results.length, 'item')} match “${query.trim()}”` : plural(results.length, 'item');
  const activeLocations = locations.filter(l => l.active);

  const cards = (
    <div className={styles.catalogCards}>
      {results.map(i => {
        const stocked = stockedIds.has(i.id);
        const on = checked.has(i.id);
        const where = [i.category, i.subCategory].filter(Boolean).join(' › ');
        return (
          // A click anywhere on the card checks it; the checkbox inside is what the keyboard and screen readers use
          <div
            key={i.id}
            className={styles.catalogCard}
            data-checked={on || undefined}
            data-stocked={stocked || undefined}
            onClick={stocked ? undefined : () => toggle(i.id)}
          >
            <span onClick={e => e.stopPropagation()}>
              <Checkbox
                size="small"
                label=""
                aria-label={`${stocked ? 'Already stocked here: ' : 'Add '}${i.number} · ${i.name}`}
                checked={stocked || on}
                disabled={stocked}
                onChange={() => toggle(i.id)}
              />
            </span>
            <span className={styles.catalogCardText}>
              <span className="text-medium-bold">
                {i.number} · {i.name}
              </span>
              <span className={`text-tiny-regular ${styles.catalogMeta}`}>{[i.type, where].filter(Boolean).join(' · ')}</span>
            </span>
            {/* A static Volt Tag (Small, 24px) marks the items this warehouse already carries */}
            {stocked && <Tag size="small">Already stocked here</Tag>}
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
      title={`Add Items to ${warehouseName}`}
      description="Select items from the catalog. Items already stocked here are marked."
      footerNote={`${checked.size} selected`}
      primaryAction={{
        label: checked.size ? `Add ${checked.size} Item${checked.size === 1 ? '' : 's'}` : 'Add Items',
        disabled: checked.size === 0 || !valid,
        onClick: () =>
          onAdd(picked, {
            locationId: locationId || undefined,
            min: num(levels.min),
            reorderPoint: num(levels.reorderPoint),
            max: num(levels.max),
          }),
      }}
    >
      <div className={styles.catalogBody}>
        <SearchInput aria-label="Search the catalog" placeholder="Search by name, item # or category" value={query} onChange={e => setQuery(e.target.value)} autoFocus />
        <div className={styles.catalogTypes} role="group" aria-label="Item type">
          {TYPE_FILTERS.map(t => (
            <Tag key={t} size="medium" selected={type === t} onClick={() => setType(t)}>
              {t === 'all' ? 'All types' : t}
            </Tag>
          ))}
        </div>
        <div className={styles.catalogResults}>
          <p className={`text-tiny-semi-bold ${styles.catalogMeta}`}>
            {count} · {checked.size} selected
          </p>
          {results.length === 0 ? (
            <p className={`text-medium-regular ${styles.noResults}`}>No items match. Try another word or type.</p>
          ) : results.length > ADD_VISIBLE_CARDS ? (
            <Scrollbar label="Catalog items" height={ADD_SCROLL_HEIGHT}>
              {cards}
            </Scrollbar>
          ) : (
            cards
          )}
        </div>
        <div className={styles.catalogSettings}>
          <p className="text-medium-bold">Settings for the selected items (optional, can change later)</p>
          <div className={styles.catalogSettingsRow}>
            <Dropdown
              label="Default location"
              placeholder="None"
              options={[{ value: '', label: 'None' }, ...activeLocations.map(l => ({ value: l.id, label: `${codeOf(locations, l.id)} · ${l.name}` }))]}
              value={locationId}
              onChange={v => setLocationId(v as string)}
            />
            <TextInput label="Min" inputMode="numeric" placeholder="0" value={levels.min} error={errors.min} onChange={e => setLevels(l => ({ ...l, min: e.target.value }))} />
            <TextInput
              label="Reorder Pt"
              inputMode="numeric"
              placeholder="0"
              value={levels.reorderPoint}
              error={errors.reorderPoint}
              onChange={e => setLevels(l => ({ ...l, reorderPoint: e.target.value }))}
            />
            <TextInput label="Max" inputMode="numeric" placeholder="0" value={levels.max} error={errors.max} onChange={e => setLevels(l => ({ ...l, max: e.target.value }))} />
          </div>
        </div>
      </div>
    </AppModal>
  );
}
