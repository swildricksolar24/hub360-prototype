import { Fragment, type ReactNode } from 'react';
import { DataTable, type DataColumn } from '../../../../../components/DataTable/DataTable';
import { AppLink } from '../../../../components/AppLink';
import { HelperToggle, PrototypeHelper } from '../../../../shell/PrototypeHelper';
import { useHelperFlag } from '../../../../shell/helperFlags';
import { historyDate, type CatalogItem, type HistoryEntry, type HistoryPart, type WarehouseLocation } from '../warehouseRecordData';
import { locationPath, useCatalog, useHistory, useLocations } from '../warehouseStore';
import { Pager, TableToolbar, useColumns, useTableControls } from './tableKit';
import styles from '../record.module.css';

// Action Performed fills; the rest hug their content (fixed at the widest of their values and their header label + the
// 24px sort icon, + the cell's 16px padding), so the sentence gets the room and stays on one or two lines
const COLUMNS: DataColumn[] = [
  // The widest badge ("Stock Order", 94px) + 16
  { key: 'type', label: 'Action Type', width: 114, fixed: true },
  { key: 'action', label: 'Action Performed', width: 'fill', minWidth: 260, sortable: false },
  // The longest name ("Roman Sionis", 93px) + 16
  { key: 'by', label: 'Created By', width: 110, fixed: true },
  // The header: "Date Created" (77px) + 2px gap + the sort icon (24px) + 16
  { key: 'date', label: 'Date Created', width: 120, fixed: true },
];

// Orders and the item records aren't built yet; their links go to the Orders and Items sections for now
const ORDERS_PATH = '/app/inventory/orders';
const ITEMS_PATH = '/app/inventory/items';

/** The words of a sentence part (for search). */
function partText(part: HistoryPart, catalog: CatalogItem[], locations: WarehouseLocation[]) {
  if (typeof part === 'string') return part;
  if ('order' in part) return part.order;
  if ('item' in part) {
    const item = catalog.find(i => i.id === part.item);
    return item ? `${item.name} (${item.number})` : 'an item';
  }
  return locations.find(l => l.id === part.location)?.name ?? 'a removed location';
}

/**
 * Warehouse record › History (Figma 571:57601, named ".../Items" in Figma): what happened in the warehouse, on the Volt
 * Data Table with no checkboxes or •••; a teal Action Type badge; the sentence links to its order, items and locations.
 */
export function HistoryTab({ code }: { code: string }) {
  const stored = useHistory(code);
  // Helper switch: no history, so the table shows "Nothing has happened here yet" (the view only; the store keeps its rows)
  const empty = useHelperFlag('warehouseHistory.empty');
  const history = empty ? [] : stored;
  const catalog = useCatalog();
  const locations = useLocations(code);
  const cols = useColumns(COLUMNS);
  const sentence = (h: HistoryEntry) => h.parts.map(p => partText(p, catalog, locations)).join('');
  const t = useTableControls(history, {
    search: h => `${h.type} ${sentence(h)} ${h.by} ${historyDate(h.date).day}`,
    sortValue: (h, key) => (key === 'date' ? h.date : key === 'by' ? h.by : h.type),
  });

  function render(part: HistoryPart, i: number): ReactNode {
    if (typeof part === 'string') return <Fragment key={i}>{part}</Fragment>;
    if ('order' in part)
      return (
        <AppLink key={i} to={ORDERS_PATH} size="small">
          {part.order}
        </AppLink>
      );
    if ('item' in part)
      return (
        <AppLink key={i} to={ITEMS_PATH} size="small">
          {partText(part, catalog, locations)}
        </AppLink>
      );
    const location = locations.find(l => l.id === part.location);
    return location ? (
      <AppLink key={i} to={locationPath(code, location.id)} size="small">
        {location.name}
      </AppLink>
    ) : (
      <Fragment key={i}>a removed location</Fragment>
    );
  }

  return (
    <div className={styles.tab}>
      <PrototypeHelper title="History">
        <HelperToggle flag="warehouseHistory.empty" label="No history" />
      </PrototypeHelper>
      <section className={styles.card} aria-label="History">
        <TableToolbar label="History" onColumns={() => cols.setOpen(true)} search={{ value: t.query, onChange: t.setQuery, label: 'Search history' }} />
        {/* Volt Data Table (Figma "Data Table" page), as on the warehouse's other tabs; no checkboxes or ••• (Figma) */}
        <DataTable
          aria-label="Warehouse history"
          columns={cols.columns}
          rows={t.pageRows}
          rowLabel={h => `${h.type} ${historyDate(h.date).day}`}
          sort={t.headerProps.sort}
          onSortChange={t.headerProps.onSortChange}
          empty={history.length === 0 ? 'Nothing has happened here yet.' : 'No history matches your search.'}
          cells={h => {
            const { day, time } = historyDate(h.date);
            return {
              type: <span className={styles.actionBadge}>{h.type}</span>,
              action: <span className={styles.sentence}>{h.parts.map(render)}</span>,
              by: h.by,
              date: (
                <span className={styles.twoLines}>
                  <span>{day}</span>
                  <span className={styles.weak}>{time}</span>
                </span>
              ),
            };
          }}
        />
        <Pager table={t} label="History pages" />
      </section>
      {cols.modal}
    </div>
  );
}
