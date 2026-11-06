import { useState } from 'react';
import { Button } from '../../../../../components/Button/Button';
import { Checkbox } from '../../../../../components/Checkbox/Checkbox';
import { DataHeader, type DataColumn } from '../../../../../components/DataHeader/DataHeader';
import { DataRow } from '../../../../../components/DataRow/DataRow';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { NumericInput } from '../../../../../components/NumericInput/NumericInput';
import { TextInput } from '../../../../../components/TextInput/TextInput';
import {
  ALLOCATE_WHEN,
  COMMIT_WHEN,
  DAYS_ENTRY,
  FULFILLMENT_RULES,
  PACKING_FORMATS,
  PICKING_FORMATS,
  PRINTERS,
  PRINT_ORDERS,
  labelSizeText,
  type PickLabel,
  type PickPackSettings,
} from '../warehouseRecordData';
import { setLabels, setPickPack, useLabels, usePickPack } from '../warehouseStore';
import { DeleteLabelModal, LabelModal } from './LabelModal';
import { RowMenu } from './RowMenu';
import { useTableControls } from './tableKit';
import styles from '../record.module.css';
import table from '../table.module.css';

const options = (list: readonly string[]) => list.map(v => ({ value: v, label: v }));
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailError = (value: string) => (value.trim() && !EMAIL.test(value.trim()) ? 'Enter an email address like name@example.com' : undefined);

// The card is half the record's width: Name and Printer share what's left after Size (both wrap)
const LABEL_COLUMNS: DataColumn[] = [
  { key: 'name', label: 'Name', width: 'fill' },
  { key: 'printer', label: 'Printer', width: 'fill' },
  { key: 'size', label: 'Size', width: 86 },
];

/**
 * Warehouse record › Pick / Pack (Figma "Inventory / Warehouse / Pick - Pack", 84:11914): two columns of cards.
 * Left: Pick Ticket Setup, Packing List Defaults and the Label Defaults table (Add / Edit Label, 3a). Right:
 * Allocations and Commit Timing, and the Fulfillment and Optimization checkbox groups.
 *
 * The settings save as they change (to the warehouse's store), so the header's Save has nothing extra to do here.
 */
export function PickPackTab({
  warehouse,
  onNotice,
}: {
  warehouse: { code: string; name: string };
  onNotice: (text: string) => void;
}) {
  const { code } = warehouse;
  const settings = usePickPack(code);
  const set =
    <K extends keyof PickPackSettings>(key: K) =>
    (value: PickPackSettings[K]) =>
      setPickPack(code, s => ({ ...s, [key]: value }));

  return (
    <div className={styles.tab}>
      <div className={styles.columns}>
        <div className={styles.column}>
          <section className={styles.card} aria-labelledby="pp-ticket-title">
            <div className={styles.cardHead}>
              <h2 id="pp-ticket-title" className={styles.cardTitle}>
                Pick Ticket Setup
              </h2>
            </div>
            <div className={styles.form}>
              <Dropdown
                label="Picking Format"
                placeholder="Select format…"
                options={options(PICKING_FORMATS)}
                value={settings.pickingFormat}
                onChange={v => set('pickingFormat')(v as string)}
              />
              <Dropdown label="Print Order" options={options(PRINT_ORDERS)} value={settings.printOrder} onChange={v => set('printOrder')(v as string)} />
              <Dropdown label="Default Printer" options={options(PRINTERS)} value={settings.defaultPrinter} onChange={v => set('defaultPrinter')(v as string)} />
              <TextInput
                label="Notification Email Address"
                type="email"
                autoComplete="off"
                value={settings.pickEmail}
                onChange={e => set('pickEmail')(e.target.value)}
                error={emailError(settings.pickEmail)}
              />
              <Checkbox size="small" label="Auto Print Tickets to Warehouse" checked={settings.autoPrint} onChange={e => set('autoPrint')(e.target.checked)} />
            </div>
          </section>

          <section className={styles.card} aria-labelledby="pp-packing-title">
            <div className={styles.cardHead}>
              <h2 id="pp-packing-title" className={styles.cardTitle}>
                Packing List Defaults
              </h2>
            </div>
            <div className={styles.form}>
              <Dropdown label="Packing Format" options={options(PACKING_FORMATS)} value={settings.packingFormat} onChange={v => set('packingFormat')(v as string)} />
              <Dropdown label="Packing Slip Printer" options={options(PRINTERS)} value={settings.packingPrinter} onChange={v => set('packingPrinter')(v as string)} />
              <TextInput
                label="Notification Email Address"
                type="email"
                autoComplete="off"
                value={settings.packEmail}
                onChange={e => set('packEmail')(e.target.value)}
                error={emailError(settings.packEmail)}
              />
              <Checkbox size="small" label="Show Pricing on Packing Slip" checked={settings.showPricing} onChange={e => set('showPricing')(e.target.checked)} />
            </div>
          </section>

          <LabelDefaults warehouse={warehouse} onNotice={onNotice} />
        </div>

        <div className={styles.column}>
          <section className={styles.card} aria-labelledby="pp-allocation-title">
            <div className={styles.cardHead}>
              <h2 id="pp-allocation-title" className={styles.cardTitle}>
                Allocations and Commit Timing
              </h2>
            </div>
            <div className={styles.form}>
              <Dropdown label="Allocate Stock When" options={options(ALLOCATE_WHEN)} value={settings.allocateWhen} onChange={v => set('allocateWhen')(v as string)} />
              <Dropdown label="Commit Stock When" options={options(COMMIT_WHEN)} value={settings.commitWhen} onChange={v => set('commitWhen')(v as string)} />
              {/* Figma draws # of Days as a select; it's a number here */}
              <div className={styles.halves}>
                <NumericInput
                  label="# of Days Before / After"
                  value={settings.days}
                  onValueChange={set('days')}
                  min={0}
                  max={90}
                  decrementLabel="One day fewer"
                  incrementLabel="One day more"
                />
                <Dropdown label="Entry" options={options(DAYS_ENTRY)} value={settings.daysEntry} onChange={v => set('daysEntry')(v as string)} />
              </div>
            </div>
          </section>

          <section className={styles.card} aria-labelledby="pp-fulfillment-title">
            <div className={styles.cardHead}>
              <h2 id="pp-fulfillment-title" className={styles.cardTitle}>
                Fulfillment and Optimization
              </h2>
            </div>
            <div className={styles.groups}>
              {FULFILLMENT_RULES.map(group => (
                <fieldset key={group.title} className={styles.checkGroup}>
                  <legend className={styles.subHeading}>{group.title}</legend>
                  <div className={styles.checkList}>
                    {group.rules.map(rule => (
                      <Checkbox
                        key={rule.key}
                        size="small"
                        label={rule.label}
                        checked={settings.rules[rule.key]}
                        onChange={e => setPickPack(code, s => ({ ...s, rules: { ...s.rules, [rule.key]: e.target.checked } }))}
                      />
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/**
 * Label Defaults: the labels this warehouse prints, with ☐ · Name · Printer · Size · •••. A label's name (or its
 * ••• › Edit) opens Edit Label; Figma's magnifier row action is the standard ••• menu here.
 */
function LabelDefaults({ warehouse, onNotice }: { warehouse: { code: string; name: string }; onNotice: (text: string) => void }) {
  const { code } = warehouse;
  const labels = useLabels(code);
  const [editing, setEditing] = useState<PickLabel | 'new' | null>(null);
  const [deleting, setDeleting] = useState<PickLabel | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const t = useTableControls(labels, {
    search: l => `${l.name} ${l.printer}`,
    sortValue: (l, key) => (key === 'size' ? labelSizeText(l) : key === 'printer' ? l.printer : l.name),
    paged: false,
  });

  return (
    <section className={styles.card} aria-labelledby="pp-labels-title">
      <div className={styles.cardHead}>
        <h2 id="pp-labels-title" className={styles.cardTitle}>
          Label Defaults
        </h2>
        <Button size="small" variant="brand" icon="plus" onClick={() => setEditing('new')}>
          Add Label
        </Button>
      </div>
      <div className={table.tableScroll}>
        <div role="table" aria-label="Label defaults" className={`${table.table} ${table.fillNarrow}`}>
          <DataHeader className={table.head} corners="none" columns={LABEL_COLUMNS} leading="checkbox" {...t.headerProps} />
          {t.pageRows.length === 0 && <p className={`text-medium-regular ${styles.emptyRow}`}>No label defaults yet. Use Add Label to add one.</p>}
          {t.pageRows.map((l, i) => (
            <div key={l.id} className={table.rowWrap} data-stripe={i % 2 === 0 || undefined}>
              <DataRow
                className={table.row}
                columns={LABEL_COLUMNS}
                leading="checkbox"
                cells={{
                  name: (
                    <button type="button" className={styles.cellLink} onClick={() => setEditing(l)}>
                      {l.name}
                    </button>
                  ),
                  printer: l.printer,
                  size: labelSizeText(l),
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
                    { label: 'Edit', onSelect: () => setEditing(l) },
                    { label: 'Delete', onSelect: () => setDeleting(l) },
                  ]}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <LabelModal
        open={editing !== null}
        label={editing === 'new' ? null : editing}
        warehouse={warehouse}
        onClose={() => setEditing(null)}
        onSave={label => {
          if (editing === 'new') {
            setLabels(code, list => [...list, { ...label, id: `l${Date.now()}` }]);
            onNotice(`${label.name} added to the label defaults.`);
          } else if (editing) {
            setLabels(code, list => list.map(x => (x.id === editing.id ? { ...label, id: editing.id } : x)));
            onNotice(`${label.name} updated.`);
          }
          setEditing(null);
        }}
        onDelete={() => {
          if (editing && editing !== 'new') setDeleting(editing);
          setEditing(null);
        }}
      />
      <DeleteLabelModal
        label={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            setLabels(code, list => list.filter(x => x.id !== deleting.id));
            onNotice(`${deleting.name} removed from the label defaults.`);
          }
          t.clearSelection();
          setDeleting(null);
        }}
      />
    </section>
  );
}
