import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type DataColumn } from '../../../../../components/DataTable/DataTable';
import { HelperToggle, PrototypeHelper } from '../../../../shell/PrototypeHelper';
import { useHelperFlag } from '../../../../shell/helperFlags';
import type { Warehouse } from '../warehouseData';
import type { CatalogItem, ItemType, WarehouseItem } from '../warehouseRecordData';
import {
  addCatalogItem,
  findWarehouse,
  getWarehouseItems,
  setStock,
  setWarehouseItems,
  useCatalog,
  useStock,
  useWarehouseItems,
  useWarehouses,
} from '../warehouseStore';
import { CloneWarehouseModal, ConfirmCloneModal, ItemFormModal, RemoveItemsModal, SearchItemsModal } from './ItemModals';
import { RowMenu } from './RowMenu';
import { MenuButton, Pager, StatusPill, TableToolbar, useColumns, useTableControls, viewInItems } from './tableKit';
import styles from '../record.module.css';
import { Toast } from '../../../../../components/Toast/Toast';

// 578 fixed + checkbox 28 + ••• 44 + 7 gaps × 16 + 40 padding = 802, leaving Name (the fill column) about 270px at 1440px
// On a narrow card the columns shrink to their minWidth (text wraps to 2 lines); nothing hides
const COLUMNS: DataColumn[] = [
  // Wide enough for the longest item number on one line ("0004-5896-4521": 115px + the cell's 16px padding)
  { key: 'number', label: 'Item #', width: 136, minWidth: 132 },
  { key: 'name', label: 'Name', width: 'fill', minWidth: 120 },
  { key: 'type', label: 'Type', width: 84 },
  { key: 'category', label: 'Category', width: 116, minWidth: 100 },
  { key: 'subCategory', label: 'Sub Category', width: 140, minWidth: 110 },
  // Figma: the status pill has no header, and sits right before the ••• button
  { key: 'status', label: 'Status', width: 108, align: 'end', labelHidden: true, sortable: false },
];

const VIEWS = [
  { value: 'all', label: 'All' },
  { value: 'Part', label: 'Parts' },
  { value: 'Assembly', label: 'Assemblies' },
  { value: 'Kit', label: 'Kits' },
];

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * Warehouse record › Items (Figma 571:24397): the items this warehouse carries. Add Item ▾ searches every item (6a),
 * creates a new Part / Assembly / Kit (6b) or copies another warehouse's items (6c, Clone Warehouse).
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
  const warehouses = useWarehouses();
  const [view, setView] = useState('all');
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState<ItemType | null>(null);
  const [cloning, setCloning] = useState(false);
  const [cloneFrom, setCloneFrom] = useState<Warehouse | null>(null);
  const [removing, setRemoving] = useState<WarehouseItem[]>([]);
  const [info, setInfo] = useState<string | null>(null);
  const cols = useColumns(COLUMNS);
  const here = findWarehouse(code);

  const t = useTableControls(items, {
    search: i => `${i.number} ${i.name} ${i.type} ${i.category} ${i.subCategory}`,
    sortValue: (i, key) => String(i[key as keyof WarehouseItem] ?? ''),
    filter: i => view === 'all' || i.type === view,
  });

  const update = (next: (list: WarehouseItem[]) => WarehouseItem[]) => setWarehouseItems(code, next);
  function add(list: CatalogItem[]) {
    const ids = new Set(stored.map(i => i.id));
    const fresh = list.filter(i => !ids.has(i.id));
    update(current => [...current, ...fresh.map(i => ({ ...i, active: true }))]);
    return fresh.length;
  }
  const missingFrom = (w: Warehouse) => {
    const ids = new Set(stored.map(i => i.id));
    return getWarehouseItems(w.code).filter(i => !ids.has(i.id));
  };
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
              { value: 'activate', label: 'Activate', disabled: t.selectedRows.length === 0 },
              { value: 'deactivate', label: 'Deactivate', disabled: t.selectedRows.length === 0 },
              { value: 'remove', label: 'Remove', disabled: t.selectedRows.length === 0 },
              { value: 'export', label: 'Export to CSV' },
            ],
            onAction: v => {
              if (v === 'export') return onNotice(`Exported ${plural(t.rows.length, 'item')} to CSV.`);
              if (v === 'remove') return setRemoving(t.selectedRows);
              setActive(
                t.selectedRows.map(i => i.id),
                v === 'activate',
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
                { label: 'Add Item', onSelect: () => setSearching(true) },
                { label: 'Clone Warehouse', onSelect: () => setCloning(true) },
              ]}
            />
          }
        />
        {/* Volt Data Table (Figma "Data Table" page), as on Locations, Stock and Contacts */}
        <DataTable
          aria-label="Warehouse items"
          className={styles.statusStart}
          columns={cols.columns}
          rows={t.pageRows}
          rowLabel={i => i.name}
          sort={t.headerProps.sort}
          onSortChange={t.headerProps.onSortChange}
          {...t.selectProps}
          inactive={i => !i.active}
          empty={items.length === 0 ? 'No items yet. Use Add Item to add some, or clone another warehouse.' : 'No items match your search or view.'}
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
        <Pager table={t} label="Item pages" />
      </section>

      {cols.modal}
      <SearchItemsModal
        open={searching}
        items={catalog.filter(c => !stored.some(i => i.id === c.id))}
        onClose={() => setSearching(false)}
        onPick={item => {
          add([item]);
          onNotice(`${item.name} added to this warehouse.`);
          setSearching(false);
        }}
        onPickAll={list => {
          const n = add(list);
          onNotice(`${plural(n, 'item')} added to this warehouse.`);
          setSearching(false);
        }}
        onAddNew={type => {
          setSearching(false);
          setCreating(type);
        }}
      />
      <ItemFormModal
        type={creating}
        existingNumbers={catalog.map(c => c.number)}
        onClose={() => setCreating(null)}
        onCreate={({ number, name, type }) => {
          const item: CatalogItem = { id: `it-${Date.now()}`, number, name, type, category: '', subCategory: '', description: '' };
          addCatalogItem(item);
          update(list => [...list, { ...item, active: true }]);
          onNotice(`${type} ${name} (# ${number}) created and added to this warehouse.`);
          setCreating(null);
        }}
      />
      <CloneWarehouseModal
        open={cloning}
        warehouses={warehouses.filter(w => w.code !== code)}
        newCount={w => missingFrom(w).length}
        onClose={() => setCloning(false)}
        onPick={w => {
          setCloning(false);
          setCloneFrom(w);
        }}
      />
      <ConfirmCloneModal
        from={cloneFrom}
        to={here?.name ?? 'This warehouse'}
        count={cloneFrom ? missingFrom(cloneFrom).length : 0}
        onClose={() => setCloneFrom(null)}
        onConfirm={() => {
          if (cloneFrom) {
            const n = add(missingFrom(cloneFrom));
            onNotice(`${plural(n, 'item')} copied from ${cloneFrom.name}.`);
          }
          setCloneFrom(null);
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
