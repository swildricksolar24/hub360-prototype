import { useState, type ReactNode } from 'react';
import { Button } from '../../../../../components/Button/Button';
import { Chip } from '../../../../../components/Chip/Chip';
import { Tag } from '../../../../../components/Tag/Tag';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { EditableCell } from '../../../../../components/EditableCell/EditableCell';
import { Icon } from '../../../../../components/Icon/Icon';
import { IconButton } from '../../../../../components/IconButton/IconButton';
import { TextInput } from '../../../../../components/TextInput/TextInput';
import { Toggle } from '../../../../../components/Toggle/Toggle';
import { HelperToggle, PrototypeHelper } from '../../../../shell/PrototypeHelper';
import { useHelperFlag } from '../../../../shell/helperFlags';
import { printerLabel } from '../printerData';
import {
  ORDER_DATES,
  ORDER_STAGES,
  PICK_RULES,
  PICK_TICKET_FORMATS,
  PRINTERS,
  ROTATIONS,
  SCAN_RULES,
  SLIP_FORMATS,
  SORT_BY,
  SORT_LATER,
  THEN_BY,
  labelSizeText,
  type PickLabel,
  type PickPackSettings,
  type PickRule,
} from '../warehouseRecordData';
import { setLabels, useLabels, usePickPack, usePrinters } from '../warehouseStore';
import { DeleteLabelModal, LabelModal } from './LabelModal';
import styles from '../record.module.css';
import pp from './pickPack.module.css';

const options = (list: readonly string[]) => list.map(v => ({ value: v, label: v }));
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const emailError = (value: string) => (value.trim() && !EMAIL.test(value.trim()) ? 'Enter an email address like name@example.com' : undefined);
/** Commit can't come before allocation (the stages are in order). */
export const commitError = (s: Pick<PickPackSettings, 'allocateWhen' | 'commitWhen'>) =>
  ORDER_STAGES.indexOf(s.commitWhen) < ORDER_STAGES.indexOf(s.allocateWhen) ? 'Commit stock at or after the stage it’s allocated' : undefined;

/**
 * Warehouse record › Pick / Pack (Figma 899:3331 view, 84:11914 edit): five numbered cards. Left: 1 · Allocation &
 * Commit and 2 · Picking (format, printer, sort, rotation, pick rules, scanning & validation). Right: 3 · Packing,
 * 4 · Labels (the label defaults) and 5 · Notifications. Read-only until the header's Edit; the edit banner above the
 * header saves or discards (`draft` lives in WarehouseRecordPage). Label defaults save as they change.
 */
export function PickPackTab({
  warehouse,
  draft,
  onDraftChange,
  onNotice,
}: {
  warehouse: { code: string; name: string };
  draft: PickPackSettings | null;
  onDraftChange: (draft: PickPackSettings) => void;
  onNotice: (text: string) => void;
}) {
  const saved = usePickPack(warehouse.code);
  const printers = usePrinters(warehouse.code);
  const s = draft ?? saved;
  const editing = draft !== null;
  const set = <K extends keyof PickPackSettings>(key: K) => (value: PickPackSettings[K]) => draft && onDraftChange({ ...draft, [key]: value });
  const setRule = (key: PickRule, on: boolean) => draft && onDraftChange({ ...draft, rules: { ...draft.rules, [key]: on } });
  // The Printers tab's printers, or the sample list for a warehouse that has none yet
  const printerOptions = (current: string) => {
    const list = printers.length ? printers.map(printerLabel) : PRINTERS;
    return options(list.includes(current) ? list : [current, ...list]);
  };

  return (
    <div className={`${styles.columns} ${pp.columns}`}>
      <PrototypeHelper title="Pick / Pack">
        <HelperToggle flag="pickPack.noLabels" label="No label defaults" />
      </PrototypeHelper>
      <div className={styles.column}>
        <Card n={1} title="Allocation & Commit" subtitle="When stock is reserved for an order, and when it’s taken out of inventory.">
          {editing ? (
            <>
              <div className={styles.halves}>
                <Dropdown label="Allocate stock when" options={options(ORDER_STAGES)} value={s.allocateWhen} onChange={v => set('allocateWhen')(v as string)} />
                <Dropdown label="Commit stock when" options={options(ORDER_STAGES)} value={s.commitWhen} onChange={v => set('commitWhen')(v as string)} error={commitError(s)} />
              </div>
              <p className={`text-tiny-regular ${pp.help}`}>
                Both lists use the order’s stages: Placed, Approved, Picking started, Picked, Packed, Shipped. Choose any stage for each; commit must come at or
                after allocation.
              </p>
              <div className={pp.sentence}>
                <span className="text-medium-regular">Start allocating</span>
                <span className={pp.days}>
                  <EditableCell
                    label="Days before the order’s date"
                    inputType="number"
                    value={s.startDays === null ? '' : String(s.startDays)}
                    onValueChange={v => set('startDays')(v === '' ? null : Math.max(0, Math.round(Number(v)) || 0))}
                  />
                </span>
                <span className="text-medium-regular">days before the order’s</span>
                <Dropdown
                  className={pp.dateField}
                  label="Date"
                  hideLabel
                  options={options(ORDER_DATES)}
                  value={s.startDate}
                  onChange={v => set('startDate')(v as string)}
                />
              </div>
              <p className={`text-tiny-regular ${pp.help}`}>
                The date list comes from the order date fields set up in settings (e.g. Due date, Ship date, Install date), so it can include any number of
                options.
              </p>
            </>
          ) : (
            <Fields>
              <Field label="Allocate stock when">{s.allocateWhen}</Field>
              <Field label="Commit stock when">{s.commitWhen}</Field>
              <Field label="Start allocating" wide>
                {s.startDays ? `${s.startDays} day${s.startDays === 1 ? '' : 's'} before the order’s ${s.startDate}` : `On the order’s ${s.startDate}`}
              </Field>
            </Fields>
          )}
        </Card>

        <Card n={2} title="Picking">
          {editing ? (
            <div className={styles.halves}>
              <Dropdown label="Pick ticket format" options={options(PICK_TICKET_FORMATS)} value={s.ticketFormat} onChange={v => set('ticketFormat')(v as string)} />
              <Dropdown label="Pick ticket printer" options={printerOptions(s.ticketPrinter)} value={s.ticketPrinter} onChange={v => set('ticketPrinter')(v as string)} />
            </div>
          ) : (
            <Fields>
              <Field label="Pick ticket format">{s.ticketFormat}</Field>
              <Field label="Pick ticket printer">{s.ticketPrinter}</Field>
            </Fields>
          )}
          <Switch label="Print pick tickets automatically" description="Prints to the pick ticket printer as soon as stock is allocated." on={s.autoPrint} editing={editing} onChange={set('autoPrint')} />
          {editing ? (
            <>
              <ChipChoice label="Sort pick list by" options={SORT_BY} later={SORT_LATER} value={s.sortBy} onChange={set('sortBy')} />
              <p className={`text-tiny-regular ${pp.help}`}>Choose one main sort. Walking path orders picks by aisle and bin to keep the route short.</p>
              <Dropdown label="Then by (optional, breaks ties)" options={options(THEN_BY)} value={s.thenBy} onChange={v => set('thenBy')(v as string)} />
              <ChipChoice label="Stock rotation" options={ROTATIONS} value={s.rotation} onChange={set('rotation')} />
            </>
          ) : (
            <Fields>
              <Field label="Sort pick list by" wide>
                {s.sortBy}
              </Field>
              <Field label="Then by (optional, breaks ties)" wide>
                {s.thenBy}
              </Field>
              <Field label="Stock rotation" wide>
                {s.rotation}
              </Field>
            </Fields>
          )}
          <RuleGroup title="Pick rules" rules={PICK_RULES} s={s} editing={editing} onChange={setRule} />
          <RuleGroup title="Scanning & validation" rules={SCAN_RULES} s={s} editing={editing} onChange={setRule} />
        </Card>
      </div>

      <div className={styles.column}>
        <Card n={3} title="Packing">
          {editing ? (
            <div className={styles.halves}>
              <Dropdown label="Packing slip format" options={options(SLIP_FORMATS)} value={s.slipFormat} onChange={v => set('slipFormat')(v as string)} />
              <Dropdown label="Packing slip printer" options={printerOptions(s.slipPrinter)} value={s.slipPrinter} onChange={v => set('slipPrinter')(v as string)} />
            </div>
          ) : (
            <Fields>
              <Field label="Packing slip format">{s.slipFormat}</Field>
              <Field label="Packing slip printer">{s.slipPrinter}</Field>
            </Fields>
          )}
          <Switch label="Show prices on packing slip" description="Automatically turns off for drop-ship or gift orders." on={s.showPrices} editing={editing} onChange={set('showPrices')} />
        </Card>

        <LabelDefaults warehouse={warehouse} editing={editing} onNotice={onNotice} />

        <Card n={5} title="Notifications">
          {editing ? (
            <>
              <TextInput label="Pick exceptions (shorts, substitutions)" type="email" value={s.exceptionsEmail} onChange={e => set('exceptionsEmail')(e.target.value)} error={emailError(s.exceptionsEmail)} />
              <TextInput label="Packing complete" type="email" value={s.packedEmail} onChange={e => set('packedEmail')(e.target.value)} error={emailError(s.packedEmail)} />
            </>
          ) : (
            <Fields>
              <Field label="Pick exceptions (shorts, substitutions)" wide>
                {s.exceptionsEmail || '—'}
              </Field>
              <Field label="Packing complete" wide>
                {s.packedEmail || '—'}
              </Field>
            </Fields>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ---------- Pieces ---------- */

/** A numbered card: "1 · Allocation & Commit", an optional line under it, and a divider. */
function Card({ n, title, subtitle, action, children }: { n: number; title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  const id = `pp-card-${n}`;
  return (
    <section className={styles.card} aria-labelledby={id}>
      <div className={`${styles.cardHead} ${pp.head}`}>
        <div>
          <h2 id={id} className={styles.cardTitle}>
            {n} · {title}
          </h2>
          {subtitle && <p className={`text-tiny-regular ${pp.subtitle}`}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Fields({ children }: { children: ReactNode }) {
  return <dl className={pp.fields}>{children}</dl>;
}
function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={pp.field} data-wide={wide || undefined}>
      <dt className="text-tiny-regular">{label}</dt>
      <dd className="text-medium-regular">{children}</dd>
    </div>
  );
}

/** A setting row: bold title, a line under it, and its on / off (a Toggle while editing, ✓ On or × Off otherwise). */
function Switch({ label, description, on, editing, onChange }: { label: string; description: string; on: boolean; editing: boolean; onChange: (on: boolean) => void }) {
  return (
    <div className={pp.switch}>
      <div>
        <p className="text-small-bold">{label}</p>
        <p className={`text-tiny-regular ${pp.subtitle}`}>{description}</p>
      </div>
      {editing ? (
        <Toggle aria-label={label} checked={on} onChange={e => onChange(e.target.checked)} />
      ) : (
        <span className={`text-small-regular ${pp.state}`} data-on={on || undefined}>
          <span className={pp.stateBox} aria-hidden>
            <Icon name={on ? 'check' : 'close'} size={20} />
          </span>
          {on ? 'On' : 'Off'}
        </span>
      )}
    </div>
  );
}

function RuleGroup({
  title,
  rules,
  s,
  editing,
  onChange,
}: {
  title: string;
  rules: readonly { key: PickRule; label: string; description: string }[];
  s: PickPackSettings;
  editing: boolean;
  onChange: (key: PickRule, on: boolean) => void;
}) {
  return (
    <div className={pp.group} role="group" aria-label={title}>
      <p className={`text-tiny-semi-bold ${pp.groupTitle}`}>{title.toUpperCase()}</p>
      {rules.map(r => (
        <Switch key={r.key} label={r.label} description={r.description} on={s.rules[r.key]} editing={editing} onChange={on => onChange(r.key, on)} />
      ))}
    </div>
  );
}

/** One-of-several chips (Sort pick list by, Stock rotation); `later` adds a disabled chip for an option still to come. */
function ChipChoice({ label, options: list, later, value, onChange }: { label: string; options: readonly string[]; later?: string; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset className={pp.chipField}>
      <legend className="text-medium-regular">{label}</legend>
      <div className={pp.chips}>
        {list.map(o => (
          <Tag key={o} size="small" selected={value === o} onClick={() => onChange(o)}>
            {o}
          </Tag>
        ))}
        {later && (
          <Chip variant="secondary" disabled>
            {later}
          </Chip>
        )}
      </div>
    </fieldset>
  );
}

/* ---------- 4 · Labels (the label defaults) ---------- */

/**
 * The warehouse's label defaults: label, printer and size. Editing adds the edit and delete buttons per row and
 * Add Label Default (Add / Edit Label, 3a). They save as they change.
 */
function LabelDefaults({ warehouse, editing, onNotice }: { warehouse: { code: string; name: string }; editing: boolean; onNotice: (text: string) => void }) {
  const { code } = warehouse;
  const stored = useLabels(code);
  // Helper switch: no label defaults, so the card's empty line shows (the view only; the store keeps its rows)
  const noLabels = useHelperFlag('pickPack.noLabels');
  const labels = noLabels ? [] : stored;
  const [open, setOpen] = useState<PickLabel | 'new' | null>(null);
  const [deleting, setDeleting] = useState<PickLabel | null>(null);

  return (
    <Card n={4} title="Labels">
      <div role="table" aria-label="Label defaults" className={pp.labels}>
        <div role="row" className={`text-tiny-regular ${pp.labelHead}`}>
          <span role="columnheader">Label</span>
          <span role="columnheader">Printer</span>
          <span role="columnheader">Size</span>
          {editing && (
            <span role="columnheader" className={pp.srOnly}>
              Actions
            </span>
          )}
        </div>
        {labels.length === 0 && <p className={`text-small-regular ${pp.subtitle}`}>No label defaults yet.</p>}
        {labels.map(l => (
          <div key={l.id} role="row" className={`text-small-regular ${pp.labelRow}`} data-editing={editing || undefined}>
            <span role="cell">{l.name}</span>
            <span role="cell">{l.printer}</span>
            <span role="cell">{labelSizeText(l)}</span>
            {editing && (
              <span role="cell" className={pp.rowActions}>
                <IconButton size="compact" icon="edit" label={`Edit ${l.name}`} onClick={() => setOpen(l)} />
                <IconButton size="compact" icon="delete" label={`Delete ${l.name}`} onClick={() => setDeleting(l)} />
              </span>
            )}
          </div>
        ))}
      </div>
      {editing && (
        <div>
          <Button size="small" variant="primary" icon="plus" onClick={() => setOpen('new')}>
            Add Label Default
          </Button>
        </div>
      )}

      <LabelModal
        open={open !== null}
        label={open === 'new' ? null : open}
        warehouse={warehouse}
        onClose={() => setOpen(null)}
        onSave={label => {
          if (open === 'new') {
            setLabels(code, list => [...list, { ...label, id: `l${Date.now()}` }]);
            onNotice(`${label.name} added to the label defaults.`);
          } else if (open) {
            setLabels(code, list => list.map(x => (x.id === open.id ? { ...label, id: open.id } : x)));
            onNotice(`${label.name} updated.`);
          }
          setOpen(null);
        }}
        onDelete={() => {
          if (open && open !== 'new') setDeleting(open);
          setOpen(null);
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
          setDeleting(null);
        }}
      />
    </Card>
  );
}
