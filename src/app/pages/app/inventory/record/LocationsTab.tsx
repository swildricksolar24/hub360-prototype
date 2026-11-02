import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataHeader, type DataColumn } from '../../../../../components/DataHeader/DataHeader';
import { DataRow } from '../../../../../components/DataRow/DataRow';
import type { WarehouseLocation } from '../warehouseRecordData';
import { locationPath, setLocations, setStock, useLocations, useStock } from '../warehouseStore';
import { LocationFormModal, RemoveLocationModal, type LocationFields } from './LocationModals';
import { LocationTree } from './LocationStructure';
import { childrenOf, depthOf, descendantIds, flattenTree } from './locationTree';
import { RowMenu } from './RowMenu';
import { MenuButton, Pager, Segmented, StatusPill, TableToolbar, useColumns, useTableControls } from './tableKit';
import { MAX_LOCATION_DEPTH } from '../warehouseRecordData';
import styles from '../record.module.css';
import table from '../table.module.css';
import { Toast } from '../../../../components/Toast';

// Fixed widths fit the record card (~1070px at a 1440px window): 708 + checkbox 28 + ••• 44 + 9 gaps × 16 + 40
// padding = 964, leaving Description (the fill column, which wraps) about 110px. To make room, the three Yes / No
// columns are centered and have no sort icon (the View filter and search cover them).
const COLUMNS: DataColumn[] = [
  { key: 'name', label: 'Location', width: 96 },
  { key: 'description', label: 'Description', width: 'fill' },
  { key: 'type', label: 'Type', width: 84 },
  { key: 'frozen', label: 'Frozen', width: 66, align: 'center', sortable: false },
  { key: 'nonPickable', label: 'Non-Pickable', width: 108, align: 'center', sortable: false },
  { key: 'empty', label: 'Empty', width: 62, align: 'center', sortable: false },
  { key: 'subs', label: '# of Sublocations', width: 150, align: 'center' },
  // Figma: the status pill has no header, and sits right before the ••• button
  { key: 'status', label: 'Status', width: 108, align: 'end', labelHidden: true, sortable: false },
];

const yesNo = (on: boolean) => (on ? 'Yes' : 'No');
const VIEWS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

/** Who adds what: a new top-level location, or a sublocation (optionally under a given parent). */
export type AddingLocation = { sublocation: boolean; parentId?: string | null } | null;

/** Creates a location from the Add Location / Add Sublocation fields and returns it. */
export function createLocation(code: string, fields: LocationFields): WarehouseLocation {
  const location: WarehouseLocation = { ...fields, id: `loc-${Date.now()}`, active: true };
  setLocations(code, list => [...list, location]);
  return location;
}

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
 * Warehouse record › Locations (Figma 80:10030 Overview, 562:4260 Structure). Overview is the standard table with a
 * pager; Structure is the location tree. Add New ▾ adds a location or a sublocation; a location's name (or its
 * ••• › Edit) opens Location Details.
 */
export function LocationsTab({ code, onNotice }: { code: string; onNotice: (text: string) => void }) {
  const navigate = useNavigate();
  const locations = useLocations(code);
  const stock = useStock(code);
  const [mode, setMode] = useState<'overview' | 'structure'>('overview');
  const [view, setView] = useState('all');
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [adding, setAdding] = useState<AddingLocation>(null);
  const [removing, setRemoving] = useState<WarehouseLocation | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const cols = useColumns(COLUMNS);

  // Overview lists every location in tree order (a location, then its sublocations)
  const ordered = flattenTree(locations).map(r => r.location);
  const subs = (l: WarehouseLocation) => childrenOf(locations, l.id).length;
  const t = useTableControls(ordered, {
    search: l => `${l.name} ${l.description} ${l.type}`,
    sortValue: (l, key) =>
      key === 'subs' ? subs(l) : key === 'frozen' || key === 'nonPickable' || key === 'empty' ? yesNo(l[key]) : String(l[key as keyof WarehouseLocation] ?? ''),
    filter: l => view === 'all' || l.active === (view === 'active'),
  });

  const open = (l: WarehouseLocation) => navigate(locationPath(code, l.id));
  const setActive = (ids: string[], active: boolean) => {
    setLocations(code, list => list.map(l => (ids.includes(l.id) ? { ...l, active } : l)));
    onNotice(`${ids.length === 1 ? (locations.find(l => l.id === ids[0])?.name ?? '1 location') : `${ids.length} locations`} ${active ? 'activated' : 'deactivated'}.`);
  };

  return (
    <div className={styles.tab}>
      {info && <Toast type="info" title={info} onClose={() => setInfo(null)} />}
      <section className={styles.card} aria-label="Locations">
        <TableToolbar
          label="Locations"
          lead={
            <Segmented
              label="Locations view"
              options={[
                { value: 'overview', label: 'Overview' },
                { value: 'structure', label: 'Structure' },
              ]}
              value={mode}
              onChange={setMode}
            />
          }
          // View filters the Overview table; Structure always shows the whole tree
          view={mode === 'overview' ? { options: VIEWS, value: view, onChange: setView } : undefined}
          onColumns={mode === 'overview' ? () => cols.setOpen(true) : undefined}
          onUpload={() => setInfo('Uploading locations from a spreadsheet isn’t part of this prototype yet.')}
          actions={{
            selectedCount: t.selectedRows.length,
            options: [
              { value: 'activate', label: 'Activate selected', disabled: t.selectedRows.length === 0 },
              { value: 'deactivate', label: 'Deactivate selected', disabled: t.selectedRows.length === 0 },
              { value: 'export', label: 'Export to CSV' },
            ],
            onAction: v => {
              if (v === 'export') return onNotice(`Exported ${locations.length} locations to CSV.`);
              setActive(
                t.selectedRows.map(l => l.id),
                v === 'activate',
              );
              t.clearSelection();
            },
          }}
          search={{ value: t.query, onChange: t.setQuery, label: 'Search locations' }}
          trailing={
            <MenuButton
              label="Add New"
              items={[
                { label: 'Add Location', icon: 'location', onSelect: () => setAdding({ sublocation: false }) },
                { label: 'Add Sublocation', icon: 'sub-directory', onSelect: () => setAdding({ sublocation: true }) },
              ]}
            />
          }
        />

        {mode === 'structure' ? (
          <LocationTree
            locations={locations}
            query={t.query}
            onChange={next => setLocations(code, () => next)}
            onAddChild={parentId => setAdding({ sublocation: true, parentId })}
            onEdit={open}
          />
        ) : (
          <>
            <div className={table.tableScroll}>
              <div role="table" aria-label="Warehouse locations" className={`${table.table} ${table.fillNarrow}`}>
                <DataHeader className={table.head} corners="none" columns={cols.columns} leading="checkbox" {...t.headerProps} />
                {t.pageRows.length === 0 && (
                  <p className={`text-medium-regular ${styles.emptyRow}`}>
                    {locations.length === 0 ? 'No locations yet. Use Add New to add one.' : 'No locations match your search or view.'}
                  </p>
                )}
                {t.pageRows.map((l, i) => (
                  <div key={l.id} className={table.rowWrap} data-stripe={i % 2 === 0 || undefined} data-inactive={!l.active || undefined}>
                    <DataRow
                      className={table.row}
                      columns={cols.columns}
                      leading="checkbox"
                      cells={{
                        name: (
                          <button type="button" className={styles.cellLink} onClick={() => open(l)}>
                            {l.name}
                          </button>
                        ),
                        description: l.description || '—',
                        type: l.type || '—',
                        frozen: yesNo(l.frozen),
                        nonPickable: yesNo(l.nonPickable),
                        empty: yesNo(l.empty),
                        subs: String(subs(l)),
                        status: <StatusPill active={l.active} />,
                      }}
                      {...t.rowSelect(l.id)}
                      selectLabel={`Select ${l.name}`}
                      moreLabel={`More actions for ${l.name}`}
                      onMore={() => setMenuFor(m => (m === l.id ? null : l.id))}
                    />
                    {menuFor === l.id && (
                      <RowMenu
                        label={l.name}
                        onClose={() => setMenuFor(null)}
                        items={[
                          { label: 'Edit', icon: 'edit', onSelect: () => open(l) },
                          ...(depthOf(locations, l.id) < MAX_LOCATION_DEPTH
                            ? [{ label: 'Add Sublocation', icon: 'sub-directory', onSelect: () => setAdding({ sublocation: true, parentId: l.id }) }]
                            : []),
                          {
                            label: l.active ? 'Deactivate' : 'Activate',
                            icon: l.active ? 'visibility-off' : 'check',
                            onSelect: () => setActive([l.id], !l.active),
                          },
                          { label: 'Remove', icon: 'delete', onSelect: () => setRemoving(l) },
                        ]}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Pager table={t} label="Location pages" />
          </>
        )}
      </section>

      {cols.modal}
      <LocationFormModal
        open={adding !== null}
        sublocation={adding?.sublocation ?? false}
        parentId={adding?.parentId}
        locations={locations}
        onClose={() => setAdding(null)}
        onCreate={fields => {
          const l = createLocation(code, fields);
          onNotice(`${l.name} added${fields.parentId ? ` to ${locations.find(p => p.id === fields.parentId)?.name}` : ''}.`);
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
