import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../../../../components/Badge/Badge';
import { Button } from '../../../../../components/Button/Button';
import { DataTable, type DataColumn } from '../../../../../components/DataTable/DataTable';
import { Icon } from '../../../../../components/Icon/Icon';
import { IconButton } from '../../../../../components/IconButton/IconButton';
import { HelperToggle, PrototypeHelper } from '../../../../shell/PrototypeHelper';
import { useHelperFlag } from '../../../../shell/helperFlags';
import type { WarehouseLocation } from '../warehouseRecordData';
import { locationPath, setLocations, setStock, useLocations, useStock } from '../warehouseStore';
import { AddLocationsModal, RemoveLocationModal, type LocationFields } from './LocationModals';
import { canMoveUnder, childrenOf, codeOf, depthOf, descendantIds, flattenTree, itemsIn, moveUnder, pathOf, slotsOf, usedOf, utilizationText } from './locationTree';
import { RowMenu } from './RowMenu';
import { Pager, Segmented, StatusPill, TableToolbar, useColumns, useTableControls } from './tableKit';
import { MAX_LOCATION_DEPTH } from '../warehouseRecordData';
import styles from '../record.module.css';
import table from '../table.module.css';
import { Toast } from '../../../../../components/Toast/Toast';

// On a narrow card the columns shrink to their minWidth, then hide by priority (useFittingColumns): Rules, then Code,
// then Type
const TREE_COLUMNS: DataColumn[] = [
  { key: 'name', label: 'Location Name', width: 'fill', minWidth: 160, filterable: true },
  { key: 'code', label: 'Code', width: 130, minWidth: 100, priority: 2, filterable: true },
  { key: 'type', label: 'Type', width: 116, minWidth: 90, priority: 1, filterable: true },
  { key: 'items', label: 'Items', width: 116, minWidth: 90, filterable: true },
  { key: 'utilization', label: 'Utilization', width: 140, minWidth: 120, filterable: true },
  { key: 'rules', label: 'Rules', width: 180, minWidth: 120, priority: 3, filterable: true },
  { key: 'status', label: 'Status', width: 110, filterable: true },
  // Figma: a + to add a location inside this one, before the •••
  { key: 'add', label: 'Add location inside', width: 40, labelHidden: true, sortable: false },
];
const FLAT_COLUMNS: DataColumn[] = [
  { key: 'name', label: 'Location', width: 130, minWidth: 100, filterable: true },
  { key: 'parent', label: 'Parent', width: 'fill', minWidth: 120, filterable: true },
  { key: 'code', label: 'Code', width: 130, minWidth: 100, priority: 2, filterable: true },
  { key: 'type', label: 'Type', width: 116, minWidth: 90, priority: 1, filterable: true },
  { key: 'items', label: 'Items', width: 116, minWidth: 90, filterable: true },
  { key: 'utilization', label: 'Utilization', width: 140, minWidth: 120, filterable: true },
  { key: 'rules', label: 'Rules', width: 160, minWidth: 120, priority: 3, filterable: true },
  { key: 'status', label: 'Status', width: 110, filterable: true },
];

const VIEWS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'nonPickable', label: 'Non-pickable' },
  { value: 'empty', label: 'Empty' },
];
const inView = (l: WarehouseLocation, view: string) =>
  view === 'all' || (view === 'active' ? l.active : view === 'inactive' ? !l.active : view === 'frozen' ? l.frozen : view === 'nonPickable' ? l.nonPickable : l.empty);

/** Creates locations from Add Location and returns them. */
export function createLocations(code: string, list: LocationFields[]): WarehouseLocation[] {
  const created = list.map((fields, i) => ({ ...fields, id: `loc-${Date.now()}-${i}`, active: true }));
  setLocations(code, all => [...all, ...created]);
  return created;
}
/** One location (Location Details' Add Sublocation). */
export const createLocation = (code: string, fields: LocationFields) => createLocations(code, [fields])[0]!;

/**
 * Removes a location with its sublocations and their stock records. Returns how many locations went.
 */
export function removeLocation(code: string, locations: WarehouseLocation[], location: WarehouseLocation) {
  const ids = new Set([location.id, ...descendantIds(locations, location.id)]);
  setLocations(code, list => list.filter(l => !ids.has(l.id)));
  setStock(code, list => list.filter(s => !ids.has(s.locationId)));
  return ids.size;
}

/**
 * Warehouse record › Locations (Figma 857:28319 tree, 872:53895 flat list): the warehouse's totals, then the locations
 * as a tree (expand / collapse, + to add a location inside one, drag a row onto another to move it) or a flat list
 * with each one's parent. A location's name opens Location Details.
 */
export function LocationsTab({ code, warehouseName, onNotice }: { code: string; warehouseName: string; onNotice: (text: string) => void }) {
  const navigate = useNavigate();
  const stored = useLocations(code);
  // Helper switch: no locations, so the totals read 0 and the table shows "No locations yet" (the view only; the
  // store keeps its rows)
  const empty = useHelperFlag('locations.empty');
  const locations = empty ? [] : stored;
  const stock = useStock(code);
  const [mode, setMode] = useState<'tree' | 'flat'>('tree');
  const [view, setView] = useState('all');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [adding, setAdding] = useState<{ parentId: string | null } | null>(null);
  const [removing, setRemoving] = useState<WarehouseLocation | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropOn, setDropOn] = useState<string | null>(null);
  const cols = useColumns(mode === 'tree' ? TREE_COLUMNS : FLAT_COLUMNS);

  const items = (l: WarehouseLocation) => itemsIn(stock, locations, l.id);
  const rows = flattenTree(locations);
  const depth = new Map(rows.map(r => [r.location.id, r.depth]));
  const hasChildren = (l: WarehouseLocation) => childrenOf(locations, l.id).length > 0;
  // Tree mode hides the sublocations of a collapsed location (searching expands them all; a view shows every match)
  const hiddenByCollapse = (l: WarehouseLocation) => {
    let p = l.parentId;
    while (p) {
      if (collapsed.has(p)) return true;
      p = locations.find(x => x.id === p)?.parentId ?? null;
    }
    return false;
  };
  const t = useTableControls(
    rows.map(r => r.location),
    {
      search: l => `${l.name} ${codeOf(locations, l.id)} ${l.description} ${l.type}`,
      sortValue: (l, key) =>
        key === 'code'
          ? codeOf(locations, l.id)
          : key === 'items'
            ? items(l)
            : key === 'utilization'
              ? usedOf(l) / slotsOf(l)
              : key === 'parent'
                ? l.parentId
                  ? pathOf(locations, l.parentId)
                  : ''
                : key === 'rules'
                  ? `${l.frozen ? 'Frozen' : ''}${l.nonPickable ? 'Non-pickable' : ''}`
                  : key === 'status'
                    ? String(l.active)
                    : String(l[key as keyof WarehouseLocation] ?? ''),
      // A view other than All lists every match, collapsed or not
      filter: l => inView(l, view) && (mode === 'flat' || view !== 'all' || !hiddenByCollapse(l)),
    },
  );

  // The warehouse's totals (Figma: Locations · In use · Empty · Utilization · Frozen · Non-pickable)
  const used = locations.reduce((n, l) => n + usedOf(l), 0);
  const slots = locations.reduce((n, l) => n + slotsOf(l), 0);
  const totals = [
    ['Locations', locations.length],
    ['In use', locations.filter(l => !l.empty).length],
    ['Empty', locations.filter(l => l.empty).length],
    ['Utilization', `${slots ? Math.round((used / slots) * 100) : 0}%`],
    ['Frozen', locations.filter(l => l.frozen).length],
    ['Non-pickable', locations.filter(l => l.nonPickable).length],
  ] as const;

  const open = (l: WarehouseLocation) => navigate(locationPath(code, l.id));
  const setActive = (ids: string[], active: boolean) => {
    setLocations(code, list => list.map(l => (ids.includes(l.id) ? { ...l, active } : l)));
    onNotice(`${ids.length === 1 ? (locations.find(l => l.id === ids[0])?.name ?? '1 location') : `${ids.length} locations`} ${active ? 'activated' : 'deactivated'}.`);
  };
  const toggleRule = (l: WarehouseLocation, rule: 'frozen' | 'nonPickable') => {
    setLocations(code, list => list.map(x => (x.id === l.id ? { ...x, [rule]: !l[rule] } : x)));
    onNotice(`${l.name} is ${l[rule] ? 'no longer ' : ''}${rule === 'frozen' ? 'frozen' : 'non-pickable'}.`);
  };
  function move(id: string, target: string | null) {
    const l = locations.find(x => x.id === id);
    if (!l || l.parentId === target) return;
    if (!canMoveUnder(locations, id, target)) {
      setInfo(target && descendantIds(locations, id).includes(target) ? 'A location can’t move inside itself.' : `That would make the tree deeper than ${MAX_LOCATION_DEPTH} levels.`);
      return;
    }
    setLocations(code, list => moveUnder(list, id, target));
    if (target) setCollapsed(c => new Set([...c].filter(x => x !== target)));
    onNotice(`${l.name} moved ${target ? `into ${locations.find(x => x.id === target)?.name}` : 'to the top level'}.`);
  }

  const rules = (l: WarehouseLocation) =>
    l.frozen || l.nonPickable ? (
      <span className={styles.badges}>
        {l.frozen && (
          <Badge shape="pill" color="blue">
            Frozen
          </Badge>
        )}
        {l.nonPickable && (
          <Badge shape="pill" color="amber">
            Non-pickable
          </Badge>
        )}
      </span>
    ) : (
      '—'
    );
  // The app's table status: a dot and the word (orange Active, gray Inactive)
  const status = (l: WarehouseLocation) => <StatusPill active={l.active} />;
  const canAddInside = (l: WarehouseLocation) => depthOf(locations, l.id) < MAX_LOCATION_DEPTH;
  // The name: in the tree, indented by depth with a chevron on a location that has sublocations; it opens the location
  const nameCell = (l: WarehouseLocation) => {
    const link = (
      <button type="button" className={styles.cellLink} onClick={() => open(l)}>
        {l.name}
      </button>
    );
    if (mode !== 'tree') return link;
    const parent = hasChildren(l);
    return (
      <span className={styles.treeName} data-parent={parent || undefined} style={{ ['--depth' as string]: depth.get(l.id) ?? 1 }}>
        {parent ? (
          <button
            type="button"
            className={styles.chevron}
            aria-expanded={!collapsed.has(l.id)}
            aria-label={`${collapsed.has(l.id) ? 'Expand' : 'Collapse'} ${l.name}`}
            onClick={() =>
              setCollapsed(c => {
                const next = new Set(c);
                if (next.has(l.id)) next.delete(l.id);
                else next.add(l.id);
                return next;
              })
            }
          >
            <Icon name="chevron-down" size={20} color="currentColor" />
          </button>
        ) : (
          <span className={styles.chevronSpacer} aria-hidden />
        )}
        {link}
      </span>
    );
  };

  return (
    <div className={styles.tab}>
      {info && <Toast type="info" title={info} onClose={() => setInfo(null)} />}
      <PrototypeHelper title="Locations">
        <HelperToggle flag="locations.empty" label="No locations" />
      </PrototypeHelper>
      <section className={styles.card} aria-label="Locations">
        <p className={`text-small-regular ${styles.summary}`}>
          {totals.map(([label, value]) => (
            <span key={label}>
              {label}: <strong>{value}</strong>
            </span>
          ))}
        </p>
        <TableToolbar
          label="Locations"
          lead={
            <Segmented
              label="Locations view"
              options={[
                { value: 'tree', label: 'Tree' },
                { value: 'flat', label: 'Flat List' },
              ]}
              value={mode}
              onChange={setMode}
            />
          }
          view={{ options: VIEWS, value: view, onChange: setView }}
          onColumns={() => cols.setOpen(true)}
          onUpload={() => setInfo('Uploading locations from a spreadsheet isn’t part of this prototype yet.')}
          actions={{
            selectedCount: t.selectedRows.length,
            options: [
              { value: 'activate', label: 'Activate', disabled: t.selectedRows.length === 0 },
              { value: 'deactivate', label: 'Deactivate', disabled: t.selectedRows.length === 0 },
              { value: 'labels', label: 'Print barcode labels', disabled: t.selectedRows.length === 0 },
              { value: 'export', label: 'Export to CSV' },
            ],
            onAction: v => {
              if (v === 'export') return onNotice(`Exported ${locations.length} locations to CSV.`);
              if (v === 'labels') {
                onNotice(`Sent ${t.selectedRows.length} barcode label${t.selectedRows.length === 1 ? '' : 's'} to the label printer.`);
                return t.clearSelection();
              }
              setActive(
                t.selectedRows.map(l => l.id),
                v === 'activate',
              );
              t.clearSelection();
            },
          }}
          search={{
            value: t.query,
            onChange: q => {
              t.setQuery(q);
              if (q.trim()) setCollapsed(new Set());
            },
            label: 'Search by name or code (e.g. A-01-02)',
          }}
          trailing={
            <Button size="small" variant="brand" icon="plus" onClick={() => setAdding({ parentId: null })}>
              Add Location
            </Button>
          }
        />
        {mode === 'tree' && (
          <p className={`text-tiny-regular ${styles.hint}`}>
            Drag a row onto another location to move it. + adds a child location. Rules: Frozen blocks stock movement (e.g. during a count); Non-pickable
            keeps stock out of pick lists (e.g. returns or QC).
          </p>
        )}

        {/* Top-level drop zone while dragging in the tree: drop here to move a location to the top level */}
        {dragging && mode === 'tree' && (
          <div
            className={`text-small-regular ${styles.emptyRow}`}
            data-drop={dropOn === 'top' || undefined}
            onDragOver={e => {
              e.preventDefault();
              setDropOn('top');
            }}
            onDragLeave={() => setDropOn(null)}
            onDrop={e => {
              e.preventDefault();
              move(dragging, null);
              setDragging(null);
              setDropOn(null);
            }}
          >
            Drop here to move to the top level
          </div>
        )}
        {/* Volt Data Table (Figma "Data Table" page), as on Contacts and Printers. In the tree, a row drags onto another
            (rowProps); the ••• shows on every row, as in Figma's Locations screens. */}
        <DataTable
          aria-label="Warehouse locations"
          className={table.fillNarrow}
          columns={cols.columns}
          rows={t.pageRows}
          rowLabel={l => l.name}
          sort={t.headerProps.sort}
          onSortChange={t.headerProps.onSortChange}
          {...t.selectProps}
          inactive={l => !l.active}
          actionsVisible
          empty={locations.length === 0 ? 'No locations yet. Use Add Location to add one.' : 'No locations match your search or view.'}
          onMore={l => setMenuFor(m => (m === l.id ? null : l.id))}
          rowProps={l =>
            mode === 'tree'
              ? {
                  draggable: true,
                  'data-drop': dropOn === l.id || undefined,
                  onDragStart: e => {
                    e.dataTransfer.setData('text/plain', l.id);
                    e.dataTransfer.effectAllowed = 'move';
                    setDragging(l.id);
                  },
                  onDragEnd: () => {
                    setDragging(null);
                    setDropOn(null);
                  },
                  onDragOver: e => {
                    if (!dragging || dragging === l.id || !canMoveUnder(locations, dragging, l.id)) return;
                    e.preventDefault();
                    setDropOn(l.id);
                  },
                  onDragLeave: () => setDropOn(d2 => (d2 === l.id ? null : d2)),
                  onDrop: e => {
                    e.preventDefault();
                    if (dragging) move(dragging, l.id);
                    setDragging(null);
                    setDropOn(null);
                  },
                }
              : {}
          }
          renderAfterRow={l =>
            menuFor === l.id && (
              <RowMenu
                label={l.name}
                onClose={() => setMenuFor(null)}
                items={[
                  { label: 'View', onSelect: () => open(l) },
                  ...(canAddInside(l) ? [{ label: 'Add Location Inside', onSelect: () => setAdding({ parentId: l.id }) }] : []),
                  ...(l.parentId ? [{ label: 'Move to Top Level', onSelect: () => move(l.id, null) }] : []),
                  { label: l.frozen ? 'Unfreeze' : 'Freeze', onSelect: () => toggleRule(l, 'frozen') },
                  { label: l.nonPickable ? 'Make Pickable' : 'Make Non-pickable', onSelect: () => toggleRule(l, 'nonPickable') },
                  { label: l.active ? 'Deactivate' : 'Activate', onSelect: () => setActive([l.id], !l.active) },
                  { label: 'Remove', onSelect: () => setRemoving(l) },
                ]}
              />
            )
          }
          cells={l => ({
            name: nameCell(l),
            parent: l.parentId ? pathOf(locations, l.parentId) : '—',
            code: codeOf(locations, l.id),
            type: l.type || '—',
            items: items(l).toLocaleString('en-US'),
            utilization: utilizationText(l),
            rules: rules(l),
            status: status(l),
            add: canAddInside(l) ? <IconButton size="compact" icon="plus" label={`Add a location inside ${l.name}`} onClick={() => setAdding({ parentId: l.id })} /> : null,
          })}
        />
        <Pager table={t} label="Location pages" />
      </section>

      {cols.modal}
      <AddLocationsModal
        open={adding !== null}
        parentId={adding?.parentId}
        locations={stored}
        warehouseName={warehouseName}
        onClose={() => setAdding(null)}
        onCreate={(list, printLabels) => {
          const created = createLocations(code, list);
          const where = list[0]?.parentId ? ` to ${locations.find(p => p.id === list[0]!.parentId)?.name}` : '';
          const what = created.length === 1 ? created[0]!.name : `${created.length} locations`;
          onNotice(`${what} added${where}.${printLabels ? ` ${created.length === 1 ? 'Its barcode label was' : 'Their barcode labels were'} sent to the label printer.` : ''}`);
          if (list[0]?.parentId) setCollapsed(c => new Set([...c].filter(x => x !== list[0]!.parentId)));
          setAdding(null);
        }}
      />
      <RemoveLocationModal
        location={removing}
        locations={locations}
        stockCount={removing ? stock.filter(s => [removing.id, ...descendantIds(locations, removing.id)].includes(s.locationId)).length : 0}
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) {
            const n = removeLocation(code, locations, removing);
            onNotice(`${removing.name} removed${n > 1 ? ` with ${n - 1} sublocation${n === 2 ? '' : 's'}` : ''}.`);
          }
          setRemoving(null);
        }}
      />
    </div>
  );
}
