import { useEffect, useState, type ReactNode } from 'react';
import { Icon } from '../../../../../components/Icon/Icon';
import { SearchInput } from '../../../../../components/SearchBar/SearchBar';
import { TextInput } from '../../../../../components/TextInput/TextInput';
import { AppModal } from '../../../../components/AppModal';
import type { Warehouse } from '../warehouseData';
import { ITEM_TYPES, ITEM_TYPE_SUBTITLES, type CatalogItem, type ItemType, type WarehouseItem } from '../warehouseRecordData';
import { MenuButton } from './tableKit';
import styles from '../record.module.css';

const required = (text: string): ReactNode => (
  <>
    {text} <span className={styles.requiredMark}>*</span>
  </>
);

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

/**
 * Figma "Modal Screen" Add Part / Add Assembly / Add Kit (571:53644, 571:53661, 571:53678): the item's custom # and
 * name. Figma draws these without an X; AppModal adds it (general note 1).
 */
export function ItemFormModal({
  type,
  existingNumbers,
  onClose,
  onCreate,
}: {
  /** The type being added; null keeps the modal closed. */
  type: ItemType | null;
  existingNumbers: string[];
  onClose: () => void;
  onCreate: (fields: { number: string; name: string; type: ItemType }) => void;
}) {
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (!type) return;
    setNumber('');
    setName('');
    setTried(false);
  }, [type]);

  const errors = {
    number: !number.trim()
      ? `Enter the custom ${type?.toLowerCase()} #`
      : existingNumbers.some(n => n.toLowerCase() === number.trim().toLowerCase())
        ? `An item with # ${number.trim()} already exists`
        : undefined,
    name: !name.trim() ? `Enter the ${type?.toLowerCase()} name` : undefined,
  };
  function save() {
    setTried(true);
    if (!type || errors.number || errors.name) return;
    onCreate({ number: number.trim(), name: name.trim(), type });
  }

  return (
    <AppModal
      open={type !== null}
      onClose={onClose}
      title={`Add ${type ?? 'Part'}`}
      description={
        <>
          {type && ITEM_TYPE_SUBTITLES[type]}{' '}
          <span className="text-small-regular">
            <span className={styles.requiredMark}>*</span>Indicates required field
          </span>
        </>
      }
      primaryAction={{ label: `Create ${type ?? 'Part'}`, onClick: save }}
    >
      <form
        className={styles.form}
        noValidate
        onSubmit={e => {
          e.preventDefault();
          save();
        }}
      >
        <div className={styles.halves}>
          <TextInput
            label={required(`Custom ${type ?? 'Part'} #`)}
            value={number}
            onChange={e => setNumber(e.target.value)}
            error={tried ? errors.number : undefined}
            autoComplete="off"
            required
          />
          <TextInput
            label={required(`${type ?? 'Part'} Name`)}
            value={name}
            onChange={e => setName(e.target.value)}
            error={tried ? errors.name : undefined}
            autoComplete="off"
            required
          />
        </div>
        <button type="submit" hidden />
      </form>
    </AppModal>
  );
}

/**
 * Figma "Modal- Add Warehouse / Search" (571:54749, 571:54762), titled Clone Warehouse: search for another warehouse
 * and pick it; each result shows its name and system ID. Cancel is the only button.
 */
export function CloneWarehouseModal({
  open,
  warehouses,
  newCount,
  onClose,
  onPick,
}: {
  open: boolean;
  /** The other warehouses. */
  warehouses: Warehouse[];
  /** How many of a warehouse's items this one doesn't have yet. */
  newCount: (w: Warehouse) => number;
  onClose: () => void;
  onPick: (w: Warehouse) => void;
}) {
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (open) setQuery('');
  }, [open]);
  const q = query.trim().toLowerCase();
  const results = q ? warehouses.filter(w => `${w.name} ${w.code} ${w.city}`.toLowerCase().includes(q)) : [];

  return (
    <AppModal open={open} onClose={onClose} title="Clone Warehouse" description="Copy another warehouse’s items into this one.">
      <SearchInput aria-label="Search warehouses" placeholder="Search Warehouse" value={query} onChange={e => setQuery(e.target.value)} autoFocus />
      {q && results.length === 0 && <p className={`text-medium-regular ${styles.noResults}`}>No warehouses match “{query}”.</p>}
      {results.length > 0 && (
        <ul className={styles.results} aria-label="Warehouses">
          {results.map(w => {
            const n = newCount(w);
            return (
              <li key={w.code}>
                <button type="button" className={styles.result} onClick={() => onPick(w)}>
                  <span className={styles.resultIcon}>
                    <Icon name="warehouse" size={24} color="currentColor" />
                  </span>
                  <span className={styles.resultText}>
                    <span className={styles.resultName}>{w.name}</span>
                    <span className={styles.resultSub}>{n === 0 ? 'No new items' : `${n} new item${n === 1 ? '' : 's'}`}</span>
                  </span>
                  <span className={styles.resultSide}>
                    System ID
                    <br />
                    <strong>{w.code}</strong>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </AppModal>
  );
}

/** Confirms Clone Warehouse before the items are copied. */
export function ConfirmCloneModal({
  from,
  to,
  count,
  onClose,
  onConfirm,
}: {
  from: Warehouse | null;
  to: string;
  count: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AppModal
      open={from !== null}
      onClose={onClose}
      title="Clone Warehouse"
      description={
        from &&
        (count === 0
          ? `${to} already carries every item in ${from.name} (${from.code}), so there’s nothing to copy.`
          : `Copy ${count} item${count === 1 ? '' : 's'} from ${from.name} (${from.code}) into ${to}? Items ${to} already carries are skipped. Stock isn’t copied.`)
      }
      primaryAction={count === 0 ? undefined : { label: `Copy ${count} Item${count === 1 ? '' : 's'}`, onClick: onConfirm }}
      secondaryAction={count === 0 ? { label: 'Close', onClick: onClose } : undefined}
    />
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
