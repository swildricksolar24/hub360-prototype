import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Status } from '../../../../../components/Status/Status';
import { Button } from '../../../../../components/Button/Button';
import { DataHeader, type DataColumn, type DataSort } from '../../../../../components/DataHeader/DataHeader';
import { DataRow } from '../../../../../components/DataRow/DataRow';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { NumericInput } from '../../../../../components/NumericInput/NumericInput';
import { PageTracker } from '../../../../../components/PageTracker/PageTracker';
import { SearchInput } from '../../../../../components/SearchBar/SearchBar';
import { AppModal } from '../../../../components/AppModal';
import { RowMenu } from '../record/RowMenu';
import { AddItemsModal } from './AddItemsModal';
import { ITEMS, LOCATIONS, STOCK, count, moveLineErrors, newLineId, stockById, type MoveLine, type OrderStatus } from './orderData';
import record from '../record.module.css';
import table from '../table.module.css';
import styles from './orders.module.css';

const PAGE_SIZE = 10;

const COLUMNS: DataColumn[] = [
  { key: 'item', label: 'Item #', width: 170 },
  { key: 'description', label: 'Description', width: 'fill' },
  { key: 'location', label: 'Location', width: 140 },
  { key: 'onHand', label: 'On Hand', width: 100, align: 'end' },
  { key: 'moveQty', label: 'Move Quantity', width: 150, align: 'end' },
  { key: 'newLocation', label: 'New Location', width: 150 },
  { key: 'newOnHand', label: 'New On Hand', width: 130, align: 'end' },
  // Figma: the status pill has no header, and sits right before the ••• button
  { key: 'status', label: 'Status', width: 130, align: 'end', labelHidden: true, sortable: false },
];

/** An inline field fills its column: the column's width less the cell's 8px padding on each side. */
const fieldWidth = (key: string) => (COLUMNS.find(c => c.key === key)!.width as number) - 16;

type Row = { line: MoveLine; itemNo: string; description: string; location: string; onHand: number; newOnHand: number | null };

const toRow = (line: MoveLine): Row => {
  const s = stockById(line.stockId);
  const onHand = s?.onHand ?? 0;
  return {
    line,
    itemNo: s?.itemNo ?? '—',
    description: s?.name ?? '—',
    location: s?.location ?? '—',
    onHand,
    newOnHand: line.moveQty === null ? null : onHand - line.moveQty,
  };
};

const SORT_VALUE: Record<string, (r: Row) => string | number> = {
  item: r => r.itemNo,
  description: r => r.description,
  location: r => r.location,
  onHand: r => r.onHand,
  moveQty: r => r.line.moveQty ?? -1,
  newLocation: r => r.line.newLocation ?? '',
  newOnHand: r => r.newOnHand ?? -1,
};

/**
 * Move Request › line items (Figma 296:52864): search, Bulk Edit and Add, then the lines. A line switches to inline
 * editing (Item #, Location, Move Quantity, New Location); New On Hand = On Hand − Move Quantity. ••• has Edit,
 * Split (Figma note "split item": a second line with half the quantity) and Remove. Bulk Edit puts every checked line
 * into editing. 10 lines per page.
 */
export function MoveItemsTable({
  lines,
  onLinesChange,
  status,
  validateSignal,
  onNotice,
}: {
  lines: MoveLine[];
  onLinesChange: (next: MoveLine[]) => void;
  status: OrderStatus;
  /** Goes up when Process Move finds unfinished lines: their errors show and they open for editing. */
  validateSignal: number;
  onNotice: (text: string, type?: 'success' | 'info' | 'error') => void;
}) {
  const readOnly = status !== 'In Process';
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<DataSort | undefined>();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Set<string>>(new Set());
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Row | null>(null);
  const [picking, setPicking] = useState(false);
  const [showAllErrors, setShowAllErrors] = useState(false);

  useEffect(() => {
    if (validateSignal === 0) return;
    setShowAllErrors(true);
    setEditing(e => new Set([...e, ...lines.filter(l => Object.keys(moveLineErrors(l)).length > 0).map(l => l.id)]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validateSignal]);

  // A finished order can't be edited
  useEffect(() => {
    if (readOnly) setEditing(new Set());
  }, [readOnly]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = lines
      .map(toRow)
      .filter(r => !q || `${r.itemNo} ${r.description} ${r.location} ${r.line.newLocation ?? ''}`.toLowerCase().includes(q));
    if (!sort) return list;
    const value = SORT_VALUE[sort.key];
    const dir = sort.direction === 'ascending' ? 1 : -1;
    return [...list].sort((a, b) => {
      const x = value(a);
      const y = value(b);
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * dir;
    });
  }, [lines, query, sort]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageRows = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const pageIds = pageRows.map(r => r.line.id);
  const allOnPage = pageIds.length > 0 && pageIds.every(id => selected.has(id));

  const update = (id: string, patch: Partial<MoveLine>) => onLinesChange(lines.map(l => (l.id === id ? { ...l, ...patch } : l)));
  const setEdit = (id: string, on: boolean) =>
    setEditing(e => {
      const next = new Set(e);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  function split(row: Row) {
    const q = row.line.moveQty ?? 0;
    if (!Number.isInteger(q) || q < 2) return onNotice('Set a Move Quantity of 2 or more before splitting this line.', 'info');
    const half = Math.floor(q / 2);
    const copy: MoveLine = { id: newLineId(), stockId: row.line.stockId, moveQty: half, newLocation: null };
    const at = lines.findIndex(l => l.id === row.line.id);
    onLinesChange([...lines.slice(0, at), { ...row.line, moveQty: q - half }, copy, ...lines.slice(at + 1)]);
    setEdit(copy.id, true);
    onNotice(`${row.itemNo} split into two lines (${count(q - half)} + ${count(half)}). Choose the new line’s New Location.`, 'info');
  }

  function bulkEdit() {
    const ids = lines.filter(l => selected.has(l.id)).map(l => l.id);
    if (ids.length === 0) return onNotice('Check the lines to edit first, then choose Bulk Edit.', 'info');
    setEditing(e => new Set([...e, ...ids]));
  }

  function doneEditing() {
    const open = lines.filter(l => editing.has(l.id));
    const unfinished = open.filter(l => Object.keys(moveLineErrors(l)).length > 0);
    setEditing(new Set());
    if (unfinished.length) {
      onNotice(
        `${unfinished.length === 1 ? '1 line still needs' : `${unfinished.length} lines still need`} a Move Quantity or New Location before you process the move.`,
        'info',
      );
    }
  }

  const itemOptions = ITEMS.map(i => ({ value: i.itemNo, label: i.itemNo }));

  function cells(row: Row): Record<string, ReactNode> {
    const { line } = row;
    const errors = moveLineErrors(line);
    const ready = Object.keys(errors).length === 0;
    const statusPill = (
      <Status active={status === 'In Process' && ready} data-status>
        {status === 'Completed' ? 'Moved' : status === 'Cancelled' ? 'Cancelled' : ready ? 'Ready' : 'Incomplete'}
      </Status>
    );
    const shown = {
      item: row.itemNo,
      description: row.description,
      location: row.location,
      onHand: count(row.onHand),
      moveQty: line.moveQty === null ? <span className={styles.muted}>—</span> : count(line.moveQty),
      newLocation: line.newLocation ?? <span className={styles.muted}>—</span>,
      newOnHand: row.newOnHand === null ? <span className={styles.muted}>—</span> : count(row.newOnHand),
      status: statusPill,
    };
    if (!editing.has(line.id)) return shown;

    // Errors show once a value is entered, or after Process Move found the line unfinished
    const qtyError = errors.moveQty && (line.moveQty !== null || showAllErrors) ? errors.moveQty : undefined;
    const locError = errors.newLocation && (line.newLocation !== null || showAllErrors) ? errors.newLocation : undefined;
    const sameItem = STOCK.filter(s => s.itemNo === row.itemNo);
    return {
      ...shown,
      item: (
        <div className={styles.cellField} style={{ width: fieldWidth('item') }}>
          <Dropdown
            label={`Item # for line ${row.itemNo}`}
            hideLabel
            options={itemOptions}
            value={row.itemNo}
            onChange={v => {
              // A new item starts at its first location (or the same location, if the item is stocked there)
              const options = STOCK.filter(s => s.itemNo === v);
              const pick = options.find(s => s.location === row.location) ?? options[0];
              if (pick) update(line.id, { stockId: pick.id });
            }}
          />
        </div>
      ),
      location: (
        <div className={styles.cellField} style={{ width: fieldWidth('location') }}>
          <Dropdown
            label={`Location for ${row.itemNo}`}
            hideLabel
            options={sameItem.map(s => ({ value: s.id, label: s.location, disabled: s.frozen }))}
            value={line.stockId}
            onChange={v => update(line.id, { stockId: v as string })}
          />
        </div>
      ),
      moveQty: (
        <div className={styles.cellField} style={{ width: fieldWidth('moveQty') }}>
          <NumericInput
            label={`Move Quantity for ${row.itemNo}`}
            required
            min={1}
            max={row.onHand}
            value={line.moveQty}
            onValueChange={v => update(line.id, { moveQty: v })}
            error={qtyError}
          />
        </div>
      ),
      newLocation: (
        <div className={styles.cellField} style={{ width: fieldWidth('newLocation') }}>
          <Dropdown
            label={`New Location for ${row.itemNo}`}
            hideLabel
            required
            placeholder="Select"
            options={LOCATIONS.filter(l => l !== row.location).map(l => ({ value: l, label: l }))}
            value={line.newLocation}
            onChange={v => update(line.id, { newLocation: v as string })}
            error={locError}
          />
        </div>
      ),
    };
  }

  return (
    <div className={record.tab}>
      <section className={record.card} aria-label="Items to move">
        <div className={styles.cardToolbar} role="toolbar" aria-label="Move items">
          <SearchInput
            className={styles.search}
            aria-label="Search lines"
            placeholder="Search"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
          {editing.size > 0 && (
            <Button size="small" variant="outline" icon="check" onClick={doneEditing}>
              Done Editing
            </Button>
          )}
          <Button size="small" variant="brand" icon="table" onClick={bulkEdit} disabled={readOnly}>
            {selected.size ? `Bulk Edit (${selected.size})` : 'Bulk Edit'}
          </Button>
          <Button size="small" variant="brand" icon="plus" onClick={() => setPicking(true)} disabled={readOnly}>
            Add
          </Button>
        </div>

        <div className={table.tableScroll}>
          <div role="table" aria-label="Move lines" className={table.table}>
            <DataHeader
              className={table.head}
              corners="none"
              columns={COLUMNS}
              leading="checkbox"
              actions={!readOnly}
              sort={sort}
              onSortChange={key =>
                setSort(s => (s?.key === key ? { key, direction: s.direction === 'ascending' ? 'descending' : 'ascending' } : { key, direction: 'ascending' }))
              }
              allSelected={allOnPage}
              onSelectAllChange={on =>
                setSelected(s => {
                  const next = new Set(s);
                  pageIds.forEach(id => (on ? next.add(id) : next.delete(id)));
                  return next;
                })
              }
            />
            {pageRows.length === 0 && (
              <p className={`text-medium-regular ${record.emptyRow}`}>
                {lines.length === 0 ? 'No items yet. Use Add to pick the items to move.' : 'No lines match your search.'}
              </p>
            )}
            {pageRows.map((row, i) => {
              const id = row.line.id;
              const isEditing = editing.has(id);
              return (
                <div key={id} className={table.rowWrap} data-stripe={i % 2 === 0 || undefined}>
                  <DataRow
                    className={table.row}
                    columns={COLUMNS}
                    leading="checkbox"
                    actions={!readOnly}
                    cells={cells(row)}
                    selected={selected.has(id)}
                    onSelectedChange={on =>
                      setSelected(s => {
                        const next = new Set(s);
                        if (on) next.add(id);
                        else next.delete(id);
                        return next;
                      })
                    }
                    selectLabel={`Select ${row.itemNo} at ${row.location}`}
                    moreLabel={`More actions for ${row.itemNo} at ${row.location}`}
                    onMore={() => setMenuFor(m => (m === id ? null : id))}
                  />
                  {menuFor === id && (
                    <RowMenu
                      label={`${row.itemNo} at ${row.location}`}
                      onClose={() => setMenuFor(null)}
                      items={[
                        isEditing
                          ? { label: 'Done', onSelect: () => setEdit(id, false) }
                          : { label: 'Edit', onSelect: () => setEdit(id, true) },
                        { label: 'Split', onSelect: () => split(row) },
                        { label: 'Remove', onSelect: () => setRemoving(row) },
                      ]}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <PageTracker
          page={current}
          pageCount={pageCount}
          onPageChange={setPage}
          pageSize={PAGE_SIZE}
          pageSizeOptions={[]}
          maxPageButtons={5}
          label="Move line pages"
        />
      </section>

      <AddItemsModal
        open={picking}
        onClose={() => setPicking(false)}
        onAdd={stock => {
          const added: MoveLine[] = stock.map(s => ({ id: newLineId(), stockId: s.id, moveQty: null, newLocation: null }));
          onLinesChange([...lines, ...added]);
          setEditing(e => new Set([...e, ...added.map(l => l.id)]));
          // Show the new lines: they're at the end of the unsorted, unsearched list
          setSort(undefined);
          setQuery('');
          setPage(Math.ceil((lines.length + added.length) / PAGE_SIZE));
          setPicking(false);
          onNotice(
            `${added.length === 1 ? '1 item' : `${added.length} items`} added. Set each new line’s Move Quantity and New Location.`,
            'success',
          );
        }}
      />

      <AppModal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove line?"
        description={
          removing &&
          `${removing.itemNo} ${removing.description} (${removing.location}) will be removed from this move. Save the order to keep the change.`
        }
        primaryAction={{
          label: 'Remove Line',
          danger: true,
          onClick: () => {
            if (removing) {
              onLinesChange(lines.filter(l => l.id !== removing.line.id));
              setSelected(s => {
                const next = new Set(s);
                next.delete(removing.line.id);
                return next;
              });
              setEdit(removing.line.id, false);
            }
            setRemoving(null);
          },
        }}
      />
    </div>
  );
}
