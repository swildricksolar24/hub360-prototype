import { useState } from 'react';
import { AutocompleteInput } from '../../../../../components/AutocompleteInput/AutocompleteInput';
import { DataHeader, type DataColumn, type DataSort } from '../../../../../components/DataHeader/DataHeader';
import { DataRow } from '../../../../../components/DataRow/DataRow';
import { IconButton } from '../../../../../components/IconButton/IconButton';
import { NumericInput } from '../../../../../components/NumericInput/NumericInput';
import { AppModal } from '../../../../components/AppModal';
import { ITEMS, adjustLineError, count, itemByNo, money, newLineId, type AdjustLine, type OrderStatus } from './orderData';
import record from '../record.module.css';
import table from '../table.module.css';
import styles from './orders.module.css';

const COLUMNS: DataColumn[] = [
  { key: 'type', label: 'Item Type', width: 130 },
  { key: 'itemNo', label: 'Item #', width: 150 },
  { key: 'name', label: 'Item Name', width: 'fill' },
  { key: 'qty', label: 'Quantity', width: 160, align: 'end' },
  { key: 'unitCost', label: 'Unit Cost', width: 120, align: 'end' },
  { key: 'netCost', label: 'Net Cost', width: 120, align: 'end' },
  { key: 'remove', label: 'Remove', width: 64, align: 'center', labelHidden: true, sortable: false },
];

/** The Quantity field fills its column: the column's width less the cell's 8px padding on each side. */
const QTY_FIELD_WIDTH = (COLUMNS.find(c => c.key === 'qty')!.width as number) - 16;

/** "1234567 · Hex Bolt": one search suggestion per item. */
const optionFor = (i: (typeof ITEMS)[number]) => `${i.itemNo} · ${i.name}`;
const OPTIONS = ITEMS.map(optionFor);

/** A line's net cost: quantity × unit cost (negative for stock taken away). */
export const netCost = (line: AdjustLine) => (line.qty ?? 0) * (itemByNo(line.itemNo)?.unitCost ?? 0);

/**
 * Adjustment › line items (Figma 705:167001): "Search to Add Items", the running Net Cost total, then one line per
 * item with its quantity (negative takes stock away), unit cost, net cost (quantity × unit cost) and a trash button.
 */
export function AdjustmentTable({
  lines,
  onLinesChange,
  status,
  validateSignal,
  onNotice,
}: {
  lines: AdjustLine[];
  onLinesChange: (next: AdjustLine[]) => void;
  status: OrderStatus;
  /** Goes up when Post Adjustment finds unfinished lines, so their errors show. */
  validateSignal: number;
  onNotice: (text: string, type?: 'success' | 'info' | 'error') => void;
}) {
  const readOnly = status !== 'In Process';
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<DataSort | undefined>();
  const [removing, setRemoving] = useState<AdjustLine | null>(null);

  const total = lines.reduce((sum, l) => sum + netCost(l), 0);

  const rows = sort
    ? [...lines].sort((a, b) => {
        const value = (l: AdjustLine): string | number => {
          const item = itemByNo(l.itemNo);
          if (sort.key === 'qty') return l.qty ?? 0;
          if (sort.key === 'unitCost') return item?.unitCost ?? 0;
          if (sort.key === 'netCost') return netCost(l);
          if (sort.key === 'type') return item?.type ?? '';
          if (sort.key === 'name') return item?.name ?? '';
          return l.itemNo;
        };
        const x = value(a);
        const y = value(b);
        return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * (sort.direction === 'ascending' ? 1 : -1);
      })
    : lines;

  function add(option: string) {
    const item = ITEMS.find(i => optionFor(i) === option);
    setSearch('');
    if (!item) return;
    if (lines.some(l => l.itemNo === item.itemNo)) return onNotice(`${item.itemNo} ${item.name} is already on this adjustment. Change its quantity instead.`, 'info');
    onLinesChange([...lines, { id: newLineId(), itemNo: item.itemNo, qty: null }]);
  }

  return (
    <div className={record.tab}>
      <section className={record.card} aria-label="Items to adjust">
        <div className={styles.cardToolbar}>
          {!readOnly && (
            <div className={styles.search}>
              <AutocompleteInput
                label="Search to Add Items"
                placeholder="Search to Add Items"
                options={OPTIONS}
                inlineComplete={false}
                filter={(option, q) => option.toLowerCase().includes(q.toLowerCase())}
                value={search}
                onValueChange={setSearch}
                onSelect={add}
              />
            </div>
          )}
          <p className={styles.total} aria-live="polite">
            Net Cost <strong className={total < 0 ? styles.negative : undefined}>{money(total)}</strong>
          </p>
        </div>

        <div className={table.tableScroll}>
          <div role="table" aria-label="Adjustment lines" className={table.table}>
            <DataHeader
              className={table.head}
              corners="none"
              stretched
              columns={COLUMNS}
              leading="none"
              actions={false}
              sort={sort}
              onSortChange={key =>
                setSort(s => (s?.key === key ? { key, direction: s.direction === 'ascending' ? 'descending' : 'ascending' } : { key, direction: 'ascending' }))
              }
            />
            {rows.length === 0 && (
              <p className={`text-medium-regular ${record.emptyRow}`}>No items yet. Search above to add the items to adjust.</p>
            )}
            {rows.map((line, i) => {
              const item = itemByNo(line.itemNo);
              const error = adjustLineError(line);
              const shownError = error && (line.qty !== null || validateSignal > 0) ? error : undefined;
              const net = netCost(line);
              return (
                <div key={line.id} className={table.rowWrap} data-stripe={i % 2 === 0 || undefined}>
                  <DataRow
                    className={table.row}
                    columns={COLUMNS}
                    leading="none"
                    actions={false}
                    cells={{
                      type: item?.type ?? '—',
                      itemNo: <span className={styles.linkText}>{line.itemNo}</span>,
                      name: item?.name ?? '—',
                      qty: readOnly ? (
                        count(line.qty ?? 0)
                      ) : (
                        <div className={styles.cellField} style={{ width: QTY_FIELD_WIDTH }}>
                          <NumericInput
                            label={`Quantity for ${line.itemNo}`}
                            required
                            value={line.qty}
                            onValueChange={v => onLinesChange(lines.map(l => (l.id === line.id ? { ...l, qty: v } : l)))}
                            error={shownError}
                          />
                        </div>
                      ),
                      unitCost: money(item?.unitCost ?? 0),
                      netCost: <span className={net < 0 ? styles.negative : undefined}>{money(net)}</span>,
                      remove: readOnly ? null : (
                        <IconButton size="compact" icon="delete" label={`Remove ${line.itemNo} ${item?.name ?? ''}`} onClick={() => setRemoving(line)} />
                      ),
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <AppModal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove line?"
        description={
          removing && `${removing.itemNo} ${itemByNo(removing.itemNo)?.name ?? ''} will be removed from this adjustment. Save the order to keep the change.`
        }
        primaryAction={{
          label: 'Remove Line',
          danger: true,
          onClick: () => {
            if (removing) onLinesChange(lines.filter(l => l.id !== removing.id));
            setRemoving(null);
          },
        }}
      />
    </div>
  );
}
