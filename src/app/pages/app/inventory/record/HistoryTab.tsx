import { Fragment, type ReactNode } from 'react';
import { DataHeader, type DataColumn } from '../../../../../components/DataHeader/DataHeader';
import { DataRow } from '../../../../../components/DataRow/DataRow';
import { AppLink } from '../../../../components/AppLink';
import { historyDate, type CatalogItem, type HistoryEntry, type HistoryPart, type WarehouseLocation } from '../warehouseRecordData';
import { locationPath, useCatalog, useHistory, useLocations } from '../warehouseStore';
import { Pager, TableToolbar, useColumns, useTableControls } from './tableKit';
import styles from '../record.module.css';
import table from '../table.module.css';

const COLUMNS: DataColumn[] = [
  { key: 'type', label: 'Action Type', width: 190 },
  { key: 'action', label: 'Action Performed', width: 'fill', sortable: false },
  { key: 'by', label: 'Created By', width: 180 },
  { key: 'date', label: 'Date Created', width: 170 },
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
 * Warehouse record › History (Figma 571:57601, named ".../Items" in Figma): what happened in the warehouse. 80px rows
 * with no checkboxes or •••; a teal Action Type badge; the sentence links to its order, items and locations.
 */
export function HistoryTab({ code }: { code: string }) {
  const history = useHistory(code);
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
      <section className={styles.card} aria-label="History">
        <TableToolbar label="History" onColumns={() => cols.setOpen(true)} search={{ value: t.query, onChange: t.setQuery, label: 'Search history' }} />
        <div className={table.tableScroll}>
          <div role="table" aria-label="Warehouse history" className={table.table}>
            <DataHeader className={table.head} corners="none" columns={cols.columns} leading="none" actions={false} sort={t.headerProps.sort} onSortChange={t.headerProps.onSortChange} />
            {t.pageRows.length === 0 && (
              <p className={`text-medium-regular ${styles.emptyRow}`}>{history.length === 0 ? 'Nothing has happened here yet.' : 'No history matches your search.'}</p>
            )}
            {t.pageRows.map((h, i) => {
              const { day, time } = historyDate(h.date);
              return (
                <div key={h.id} className={table.rowWrap} data-stripe={i % 2 === 0 || undefined}>
                  <DataRow
                    className={`${table.row} ${styles.historyRow}`}
                    columns={cols.columns}
                    leading="none"
                    actions={false}
                    cells={{
                      type: <span className={styles.actionBadge}>{h.type}</span>,
                      action: <span className={styles.sentence}>{h.parts.map(render)}</span>,
                      by: h.by,
                      date: (
                        <span className={styles.twoLines}>
                          <span>{day}</span>
                          <span className={styles.weak}>{time}</span>
                        </span>
                      ),
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <Pager table={t} label="History pages" />
      </section>
      {cols.modal}
    </div>
  );
}
