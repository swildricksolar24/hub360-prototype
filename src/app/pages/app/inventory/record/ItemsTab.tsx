import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type DataColumn } from '../../../../../components/DataTable/DataTable';
import { HelperToggle, PrototypeHelper } from '../../../../shell/PrototypeHelper';
import { useHelperFlag } from '../../../../shell/helperFlags';
import type { Warehouse } from '../warehouseData';
import type { CatalogItem, WarehouseItem } from '../warehouseRecordData';
import {
  findWarehouse,
  getLocations,
  getStock,
  getWarehouseItems,
  setStock,
  setWarehouseItems,
  useCatalog,
  useLocations,
  useStock,
  useWarehouseItems,
  useWarehouses,
} from '../warehouseStore';
import { AddFromCatalogModal, CopyItemsModal, RemoveItemsModal, type AddItemSettings, type CopyOptions } from './ItemModals';
import { codeOf } from './locationTree';
import { RowMenu } from './RowMenu';
import { changing, checkFirst, FilterBox, MenuButton, Pager, StatusPill, statusActions, TableToolbar, useColumns, useTableControls, viewInItems } from './tableKit';
import styles from '../record.module.css';
import { Toast } from '../../../../../components/Toast/Toast';

// 578 fixed + checkbox 28 + ••• 44 + 7 gaps × 16 + 40 padding = 802, leaving Name (the fill column) about 270px at 1440px
// On a narrow card the columns shrink to their minWidth (text wraps to 2 lines); nothing hides
const COLUMNS: DataColumn[] = [
  // Wide enough for the longest item number on one line ("0004-5896-4521": 115px + the cell's 16px padding)
  { key: 'number', label: 'Item #', width: 136, minWidth: 132 },
  { key: 'name', label: 'Name', width: 'fill', minWidth: 120 },
  // Type, Category, Sub Category and Status repeat across items, so they filter (a checkbox list of their values)
  { key: 'type', label: 'Type', width: 84, filterable: true },
  { key: 'category', label: 'Category', width: 116, minWidth: 100, filterable: true },
  { key: 'subCategory', label: 'Sub Category', width: 140, minWidth: 110, filterable: true },
  // Figma's status pill has no header; with its filter it gets one ("Status"), and sorts. It sits right before the •••
  { key: 'status', label: 'Status', width: 108, filterable: true },
];

/** A cell's text as it shows: what the Status column sorts and filters by, and each filter's values. */
const cellText = (i: WarehouseItem, key: string) => (key === 'status' ? (i.active ? 'Active' : 'Inactive') : String(i[key as keyof WarehouseItem] ?? ''));

const VIEWS = [
  { value: 'all', label: 'All' },
  { value: 'Part', label: 'Parts' },
  { value: 'Assembly', label: 'Assemblies' },
  { value: 'Kit', label: 'Kits' },
];

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * Warehouse record › Items (Figma 571:24397): the items this warehouse carries. Add Item ▾ searches every item (6a),
 * or copies another warehouse's items (6c, Clone Warehouse).
 */
export function ItemsTab({ code, onNotice }: { code: string; onNotice: (text: string) => void }) {
  const navigate = useNavigate();
  const stored = useWarehouseItems(code);
  // Helper switch: no items, so the table's "No items yet" shows (the view only; the store keeps its rows, and the
  // duplicate checks in Add Item and Clone Warehouse still read it)
  const empty = useHelperFlag('warehouseItems.empty');
  const items = empty ? [] : stored;
  const catalog = useCatalog();
  const stock = useStock(code);
  const locations = useLocations(code);
  const warehouses = useWarehouses();
  const [view, setView] = useState('all');
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [removing, setRemoving] = useState<WarehouseItem[]>([]);
  const [info, setInfo] = useState<string | null>(null);
  const cols = useColumns(COLUMNS);
  const here = findWarehouse(code);

  const t = useTableControls(items, {
    search: i => `${i.number} ${i.name} ${i.type} ${i.category} ${i.subCategory}`,
    sortValue: cellText,
    filter: i => view === 'all' || i.type === view,
    filterText: cellText,
  });

  const update = (next: (list: WarehouseItem[]) => WarehouseItem[]) => setWarehouseItems(code, next);
  function add(list: CatalogItem[], settings: AddItemSettings = {}) {
    const ids = new Set(stored.map(i => i.id));
    const fresh = list.filter(i => !ids.has(i.id));
    const { locationId, min, reorderPoint, max } = settings;
    update(current => [...current, ...fresh.map(i => ({ ...i, active: true, min, reorderPoint, max }))]);
    // A default location starts each item there with no stock yet, carrying the reorder point (Stock › Below Reorder)
    if (locationId)
      setStock(code, current => [
        ...current,
        ...fresh.map(i => ({ id: `st-${i.id}-${Date.now()}`, itemId: i.id, locationId, onHand: 0, allocated: 0, committed: 0, frozen: 0, reorderPoint })),
      ]);
    return fresh.length;
  }
  /**
   * Copy Items from Another Warehouse: the source's item list (never its stock), with its stocking levels and preferred
   * suppliers when those are on. Items already here are updated or skipped. Default locations: each copied item gets an
   * empty stock record here at the location with the same code as one it's stocked at there, where such a location exists.
   */
  function copyFrom(w: Warehouse, o: CopyOptions) {
    const source = getWarehouseItems(w.code);
    const hereIds = new Set(stored.map(i => i.id));
    const fresh = source.filter(i => !hereIds.has(i.id));
    const overlap = o.existing === 'update' ? source.filter(i => hereIds.has(i.id)) : [];
    const extras = (i: WarehouseItem) => ({
      ...(o.levels ? { min: i.min, reorderPoint: i.reorderPoint, max: i.max } : {}),
      ...(o.suppliers ? { preferredSupplier: i.preferredSupplier } : {}),
    });
    update(current => [
      ...current.map(i => {
        const src = overlap.find(s => s.id === i.id);
        return src ? { ...i, ...extras(src) } : i;
      }),
      ...fresh.map(({ id, number, name, type, category, subCategory, description, ...rest }) => ({
        id, number, name, type, category, subCategory, description, active: true, ...extras({ ...rest, id, number, name, type, category, subCategory, description }),
      })),
    ]);
    let placed = 0;
    if (o.locations) {
      const theirLocations = getLocations(w.code);
      const byCode = new Map(locations.map(l => [codeOf(locations, l.id), l.id]));
      const copied = new Set([...fresh, ...overlap].map(i => i.id));
      const have = new Set(stock.map(s => `${s.itemId}@${s.locationId}`));
      const rows = getStock(w.code).flatMap(s => {
        const here = byCode.get(codeOf(theirLocations, s.locationId));
        const key = `${s.itemId}@${here}`;
        if (!copied.has(s.itemId) || !here || have.has(key)) return [];
        have.add(key);
        return [{ id: `st-${s.itemId}-${here}-${Date.now()}`, itemId: s.itemId, locationId: here, onHand: 0, allocated: 0, committed: 0, frozen: 0, reorderPoint: o.levels ? s.reorderPoint : undefined }];
      });
      placed = rows.length;
      if (rows.length) setStock(code, current => [...current, ...rows]);
    }
    return { added: fresh.length, updated: overlap.length, placed };
  }
  const setActive = (ids: string[], active: boolean) => {
    update(list => list.map(i => (ids.includes(i.id) ? { ...i, active } : i)));
    onNotice(`${ids.length === 1 ? (items.find(i => i.id === ids[0])?.name ?? '1 item') : plural(ids.length, 'item')} ${active ? 'activated' : 'deactivated'}.`);
  };
  const removingIds = new Set(removing.map(i => i.id));

  return (
    <div className={styles.tab}>
      {info && <Toast type="info" title={info} onClose={() => setInfo(null)} />}
      <PrototypeHelper title="Items">
        <HelperToggle flag="warehouseItems.empty" label="No items" />
      </PrototypeHelper>
      <section className={styles.card} aria-label="Items">
        <TableToolbar
          label="Items"
          view={{ options: VIEWS, value: view, onChange: setView }}
          onColumns={() => cols.setOpen(true)}
          onUpload={() => setInfo('Uploading items from a spreadsheet isn’t part of this prototype yet.')}
          actions={{
            selectedCount: t.selectedRows.length,
            options: [
              ...statusActions(t.selectedRows, i => i.active),
              { value: 'remove', label: 'Remove', ...checkFirst(t.selectedRows.length) },
              { value: 'export', label: 'Export to CSV' },
            ],
            onAction: v => {
              // The checked rows when there are any, otherwise the whole list
              if (v === 'export') return onNotice(`Exported ${plural(t.selectedRows.length || t.rows.length, 'item')} to CSV.`);
              if (v === 'remove') return setRemoving(t.selectedRows);
              const active = v === 'activate';
              setActive(
                changing(t.selectedRows, i => i.active, active).map(i => i.id),
                active,
              );
              t.clearSelection();
            },
          }}
          search={{ value: t.query, onChange: t.setQuery, label: 'Search items' }}
          trailing={
            <MenuButton
              label="Add Item"
              icon="plus"
              items={[
                { label: 'Add Items', onSelect: () => setSearching(true) },
                { label: 'Clone Warehouse', onSelect: () => setCloning(true) },
              ]}
            />
          }
        />
        {/* Volt Data Table (Figma "Data Table" page), as on Locations, Stock and Contacts */}
        <FilterBox table={t} columns={cols.columns}>
          <DataTable
            aria-label="Warehouse items"
            className={styles.statusStart}
            columns={cols.columns}
            rows={t.pageRows}
            rowLabel={i => i.name}
            sort={t.headerProps.sort}
            onSortChange={t.headerProps.onSortChange}
            {...t.selectProps}
            {...t.filterProps}
            inactive={i => !i.active}
            empty={items.length === 0 ? 'No items yet. Use Add Item to add some, or clone another warehouse.' : 'No items match your search, view or filters.'}
            onMore={i => setMenuFor(m => (m === i.id ? null : i.id))}
            renderAfterRow={i =>
              menuFor === i.id && (
                <RowMenu
                  label={i.name}
                  onClose={() => setMenuFor(null)}
                  items={[
                    // The item's record in Items, when it has one
                    ...viewInItems(i.name, navigate),
                    { label: i.active ? 'Deactivate' : 'Activate', onSelect: () => setActive([i.id], !i.active) },
                    { label: 'Remove', onSelect: () => setRemoving([i]) },
                  ]}
                />
              )
            }
            cells={i => ({
              number: i.number,
              name: i.name,
              type: i.type,
              category: i.category || '—',
              subCategory: i.subCategory || '—',
              status: <StatusPill active={i.active} />,
            })}
          />
        </FilterBox>
        <Pager table={t} label="Item pages" />
      </section>

      {cols.modal}
      <AddFromCatalogModal
        open={searching}
        warehouseName={here?.name ?? code}
        catalog={catalog}
        stockedIds={new Set(stored.map(i => i.id))}
        locations={locations}
        onClose={() => setSearching(false)}
        onAdd={(list, settings) => {
          const n = add(list, settings);
          const where = settings.locationId ? ` at ${locations.find(l => l.id === settings.locationId)?.name ?? 'the default location'}` : '';
          onNotice(`${n === 1 ? list[0].name : plural(n, 'item')} added to this warehouse${where}.`);
          setSearching(false);
        }}
      />
      <CopyItemsModal
        open={cloning}
        warehouseName={here?.name ?? code}
        warehouses={warehouses.filter(w => w.code !== code)}
        itemsOf={w => getWarehouseItems(w.code)}
        hereIds={new Set(stored.map(i => i.id))}
        onClose={() => setCloning(false)}
        onCopy={(w, o) => {
          const { added, updated, placed } = copyFrom(w, o);
          onNotice(
            [
              added ? `${plural(added, 'item')} copied from ${w.name}.` : '',
              updated ? `${plural(updated, 'item')} already here updated.` : '',
              placed ? `${placed} placed at matching locations.` : '',
            ]
              .filter(Boolean)
              .join(' '),
          );
          setCloning(false);
        }}
      />
      <RemoveItemsModal
        items={removing}
        stockCount={stock.filter(s => removingIds.has(s.itemId)).length}
        onClose={() => setRemoving([])}
        onConfirm={() => {
          update(list => list.filter(i => !removingIds.has(i.id)));
          setStock(code, list => list.filter(s => !removingIds.has(s.itemId)));
          onNotice(`${removing.length === 1 ? removing[0]!.name : plural(removing.length, 'item')} removed from this warehouse.`);
          t.clearSelection();
          setRemoving([]);
        }}
      />
    </div>
  );
}
