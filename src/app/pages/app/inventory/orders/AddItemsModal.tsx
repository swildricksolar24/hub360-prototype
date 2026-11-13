import { useEffect, useMemo, useState } from 'react';
import { DataHeader, type DataColumn, type DataSort } from '../../../../../components/DataHeader/DataHeader';
import { DataRow } from '../../../../../components/DataRow/DataRow';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { Icon } from '../../../../../components/Icon/Icon';
import { SearchInput } from '../../../../../components/SearchBar/SearchBar';
import { AppModal } from '../../../../components/AppModal';
import { LOCATIONS, STOCK, count, type StockItem } from './orderData';
import record from '../record.module.css';
import table from '../table.module.css';
import styles from './orders.module.css';

const ALL = '__all';

const COLUMNS: DataColumn[] = [
  { key: 'itemNo', label: 'Item #', width: 130 },
  { key: 'name', label: 'Name', width: 'fill' },
  { key: 'location', label: 'Location', width: 110 },
  { key: 'onHand', label: 'OH', width: 80, align: 'end' },
  { key: 'avail', label: 'Avail', width: 80, align: 'end' },
  { key: 'flags', label: 'Status', width: 72, align: 'center', labelHidden: true, sortable: false },
];

/**
 * Move Request › Add Items (Figma 292:26783): search the stock, filter by location, check several rows and add
 * them as new lines. Figma leaves out the buttons; this adds Cancel and Add Items. Frozen stock can't be picked.
 */
export function AddItemsModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (stock: StockItem[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState<string>(ALL);
  const [sort, setSort] = useState<DataSort | undefined>();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setQuery('');
      setLocation(ALL);
      setSelected(new Set());
    }
  }, [open]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = STOCK.filter(
      s =>
        (location === ALL || s.location === location) &&
        (!q || `${s.itemNo} ${s.name} ${s.type} ${s.location}`.toLowerCase().includes(q)),
    );
    if (!sort) return list;
    const k = sort.key as 'itemNo' | 'name' | 'location' | 'onHand' | 'avail';
    const dir = sort.direction === 'ascending' ? 1 : -1;
    return [...list].sort((a, b) => (typeof a[k] === 'number' ? (a[k] as number) - (b[k] as number) : String(a[k]).localeCompare(String(b[k]))) * dir);
  }, [query, location, sort]);

  const pickable = rows.filter(s => !s.frozen);
  const picked = STOCK.filter(s => selected.has(s.id));

  return (
    <AppModal
      open={open}
      onClose={onClose}
      width={880}
      scrollable
      title="Add Items"
      description="Check the items to move. You set each line’s quantity and new location after adding them."
      primaryAction={{
        label: picked.length ? `Add Items (${picked.length})` : 'Add Items',
        disabled: picked.length === 0,
        onClick: () => onAdd(picked),
      }}
    >
      <div className={styles.pickerFilters}>
        <SearchInput
          className={styles.search}
          aria-label="Search items"
          placeholder="Search by part, assembly, kit name or location"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <Dropdown
          variant="small"
          label="Location"
          hideLabel
          options={[{ value: ALL, label: 'All locations' }, ...LOCATIONS.map(l => ({ value: l, label: l }))]}
          value={location}
          onChange={v => setLocation(v as string)}
          renderValue={sel => `Location: ${sel[0]?.value === ALL ? 'All' : sel[0]?.label}`}
        />
      </div>
      <div className={table.tableScroll}>
        <div role="table" aria-label="Items to add" className={table.table}>
          <DataHeader
            className={table.head}
            corners="none"
            stretched
            columns={COLUMNS}
            leading="checkbox"
            actions={false}
            sort={sort}
            onSortChange={key =>
              setSort(s => (s?.key === key ? { key, direction: s.direction === 'ascending' ? 'descending' : 'ascending' } : { key, direction: 'ascending' }))
            }
            allSelected={pickable.length > 0 && pickable.every(s => selected.has(s.id))}
            onSelectAllChange={on =>
              setSelected(sel => {
                const next = new Set(sel);
                pickable.forEach(s => (on ? next.add(s.id) : next.delete(s.id)));
                return next;
              })
            }
          />
          {rows.length === 0 && <p className={`text-medium-regular ${record.emptyRow}`}>No items match. Try a different word or location.</p>}
          {rows.map((s, i) => (
            <div key={s.id} className={table.rowWrap} data-stripe={i % 2 === 0 || undefined}>
              <DataRow
                className={table.row}
                columns={COLUMNS}
                leading="checkbox"
                actions={false}
                cells={{
                  itemNo: s.itemNo,
                  name: s.name,
                  location: s.location,
                  onHand: count(s.onHand),
                  avail: count(s.avail),
                  flags: (
                    <span className={styles.statusIcons}>
                      {s.frozen && <Icon name="freeze" size={20} color="currentColor" label="Frozen" />}
                      {s.hidden && <Icon name="visibility-off" size={20} color="currentColor" label="Hidden" />}
                    </span>
                  ),
                }}
                selected={selected.has(s.id)}
                // Frozen stock is locked (e.g. for a count), so its checkbox can't be checked
                onSelectedChange={
                  s.frozen
                    ? undefined
                    : on =>
                        setSelected(sel => {
                          const next = new Set(sel);
                          if (on) next.add(s.id);
                          else next.delete(s.id);
                          return next;
                        })
                }
                selectLabel={s.frozen ? `${s.itemNo} at ${s.location} is frozen` : `Select ${s.itemNo} at ${s.location}`}
              />
            </div>
          ))}
        </div>
      </div>
      <p className={styles.hint}>
        <Icon name="freeze" size={20} color="currentColor" /> Frozen stock can’t be moved. ·{' '}
        <Icon name="visibility-off" size={20} color="currentColor" /> Hidden from the catalog.
      </p>
    </AppModal>
  );
}
