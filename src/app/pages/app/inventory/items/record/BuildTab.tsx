import { useState } from 'react';
import { DataHeader, type DataColumn, type DataSort } from '../../../../../../components/DataHeader/DataHeader';
import { DataRow } from '../../../../../../components/DataRow/DataRow';
import { NumericInput } from '../../../../../../components/NumericInput/NumericInput';
import { AppLink } from '../../../../../components/AppLink';
import { AppModal } from '../../../../../components/AppModal';
import { money, type BuildLine, type Item } from '../itemData';
import { buildCandidates, itemPath, unitCostOf, updateItem, useItems } from '../itemStore';
import { Card, ItemPicker, nextSort, sortRows, TrashButton } from '../shared';
import record from '../../record.module.css';
import table from '../../table.module.css';
import styles from '../items.module.css';

/** The columns: full size on the Build tab; `compact` inside an 800px modal. */
function buildColumns(costs: boolean, editable: boolean, removable: boolean, compact: boolean): DataColumn[] {
  const columns: DataColumn[] = [
    { key: 'type', label: 'Item Type', width: compact ? 96 : 110 },
    { key: 'number', label: 'Item #', width: compact ? 150 : 160 },
    { key: 'name', label: 'Item Name', width: 'fill' },
    { key: 'quantity', label: 'Quantity', width: editable ? QTY_WIDTH : compact ? 96 : 110, align: 'end' },
  ];
  if (costs)
    columns.push(
      { key: 'unitCost', label: 'Unit Cost', width: compact ? 100 : 110, align: 'end' },
      { key: 'netCost', label: 'Net Cost', width: compact ? 100 : 110, align: 'end' },
    );
  if (removable) columns.push({ key: 'remove', label: 'Remove', width: 40, align: 'center', labelHidden: true, sortable: false });
  return columns;
}

/** An editable Quantity column; its field fills it, less the cell's 8px padding on each side. */
const QTY_WIDTH = 130;
const QTY_FIELD_WIDTH = QTY_WIDTH - 16;

/** A build's Net Cost: the sum of Quantity × Unit Cost over its lines. */
export const buildTotal = (lines: BuildLine[], all: Item[]) =>
  lines.reduce((sum, line) => {
    const child = all.find(i => i.id === line.itemId);
    return sum + (child ? unitCostOf(child, all) * line.quantity : 0);
  }, 0);

/**
 * The lines of a build (Assembly / Kit Build tab, the Add Assembly / Add Kit build section, View Assembly / View Kit):
 * Item Type · Item # · Item Name · Quantity, with Unit Cost and Net Cost when `costs` is on. With `onQuantityChange`
 * the quantity is a NumericInput; with `onRemove` each line has a trash button.
 */
export function BuildTable({
  lines,
  all,
  label,
  empty,
  costs = true,
  link = false,
  compact = false,
  onQuantityChange,
  onRemove,
}: {
  lines: BuildLine[];
  all: Item[];
  label: string;
  /** Shown when there are no lines. */
  empty: string;
  costs?: boolean;
  /** Item # links to the item's record (not inside modals, where it would leave the dialog open behind the page). */
  link?: boolean;
  /** Narrower fixed columns, for the 800px modals. */
  compact?: boolean;
  onQuantityChange?: (itemId: string, quantity: number) => void;
  onRemove?: (line: BuildLine, item: Item | undefined) => void;
}) {
  const [sort, setSort] = useState<DataSort | undefined>();
  const columns = buildColumns(costs, !!onQuantityChange, !!onRemove, compact);
  const rows = lines.map(line => {
    const item = all.find(i => i.id === line.itemId);
    const unit = item ? unitCostOf(item, all) : 0;
    return { line, item, unit, net: unit * line.quantity };
  });
  const sorted = sortRows(rows, sort, (r, key) =>
    key === 'quantity'
      ? r.line.quantity
      : key === 'unitCost'
        ? r.unit
        : key === 'netCost'
          ? r.net
          : key === 'number'
            ? r.line.itemId
            : key === 'type'
              ? (r.item?.type ?? '')
              : (r.item?.name ?? ''),
  );

  return (
    <div className={table.tableScroll}>
      <div role="table" aria-label={label} className={table.table}>
        <DataHeader className={table.head} corners="none" columns={columns} leading="none" actions={false} sort={sort} onSortChange={k => setSort(nextSort(k))} />
        {rows.length === 0 && <p className={`text-medium-regular ${record.emptyRow}`}>{empty}</p>}
        {sorted.map(({ line, item, unit, net }, i) => (
          <div key={line.itemId} className={table.rowWrap} data-stripe={i % 2 === 0 || undefined} data-inactive={(item && !item.active) || undefined}>
            <DataRow
              className={table.row}
              columns={columns}
              leading="none"
              actions={false}
              cells={{
                type: item?.type ?? '—',
                number: link ? (
                  <AppLink to={itemPath(line.itemId)} size="small">
                    {line.itemId}
                  </AppLink>
                ) : (
                  line.itemId
                ),
                name: item?.name ?? 'A deleted item',
                quantity: onQuantityChange ? (
                  <div className={styles.cellField} style={{ width: QTY_FIELD_WIDTH }}>
                    <NumericInput
                      label={`Quantity of ${item?.name ?? line.itemId}`}
                      min={1}
                      step={1}
                      required
                      value={line.quantity || null}
                      onValueChange={v => onQuantityChange(line.itemId, Math.max(0, Math.round(v ?? 0)))}
                      error={line.quantity < 1 ? 'Enter at least 1' : undefined}
                    />
                  </div>
                ) : (
                  line.quantity.toLocaleString('en-US')
                ),
                unitCost: money(unit),
                netCost: money(net),
                remove: onRemove && <TrashButton label={`Remove ${item?.name ?? line.itemId}`} onClick={() => onRemove(line, item)} />,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Assembly / Kit record › Build (ITEMS.md §5; Figma Assembly 641:69761, Kit 641:70542): search to add parts and
 * assemblies, the Net Cost total, and the build's lines with their quantities and costs. Changes save as they're made,
 * like the Details tables; removing a line asks first.
 */
export function BuildTab({ item, onNotice }: { item: Item; onNotice: (text: string) => void }) {
  const all = useItems();
  const [removing, setRemoving] = useState<{ line: BuildLine; name: string } | null>(null);
  const word = item.type;
  const lower = word.toLowerCase();
  const setBuild = (fn: (lines: BuildLine[]) => BuildLine[]) => updateItem(item.id, i => ({ ...i, build: fn(i.build) }));
  const total = buildTotal(item.build, all);

  return (
    <div className={record.tab}>
      <Card id="item-build" title={`${word} Build`}>
        <div className={styles.buildHead}>
          <ItemPicker
            items={buildCandidates(item.id, item.build, all)}
            label={`Search to Add Items in ${word}`}
            placeholder={`Search to Add Items in ${word}`}
            side={i => money(unitCostOf(i, all))}
            onPick={picked => {
              setBuild(lines => [...lines, { itemId: picked.id, quantity: 1 }]);
              onNotice(`${picked.name} added to the ${lower} build.`);
            }}
          />
          <p className={styles.total} aria-live="polite">
            Net Cost <strong>{money(total)}</strong>
          </p>
        </div>
        <BuildTable
          lines={item.build}
          all={all}
          label={`${word} build`}
          empty={`This ${lower} has no items yet. Search above to add the parts and assemblies it’s built from.`}
          link
          onQuantityChange={(id, quantity) => setBuild(lines => lines.map(l => (l.itemId === id ? { ...l, quantity } : l)))}
          onRemove={(line, child) => setRemoving({ line, name: child?.name ?? line.itemId })}
        />
      </Card>

      <AppModal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove Item From Build"
        description={removing && `${removing.name} will be removed from the ${item.name} build, and its cost taken off the Net Cost.`}
        primaryAction={{
          label: 'Remove Item',
          danger: true,
          onClick: () => {
            if (removing) {
              setBuild(lines => lines.filter(l => l.itemId !== removing.line.itemId));
              onNotice(`${removing.name} removed from the ${lower} build.`);
            }
            setRemoving(null);
          },
        }}
      />
    </div>
  );
}
