import { useState, type ReactNode } from 'react';
import { Avatar } from '../../../../../components/Avatar/Avatar';
import { Badge, type BadgeColor } from '../../../../../components/Badge/Badge';
import { Button } from '../../../../../components/Button/Button';
import { Tag } from '../../../../../components/Tag/Tag';
import { DataTable, type DataColumn } from '../../../../../components/DataTable/DataTable';
import { EditableCell } from '../../../../../components/EditableCell/EditableCell';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { Icon } from '../../../../../components/Icon/Icon';
import { SearchInput } from '../../../../../components/SearchBar/SearchBar';
import { Tabs } from '../../../../../components/Tabs/Tabs';
import { TextInput } from '../../../../../components/TextInput/TextInput';
import { Toggle } from '../../../../../components/Toggle/Toggle';
import { AppModal } from '../../../../components/AppModal';
import {
  AREAS,
  DARKNESS,
  DOCUMENT_SIZES,
  LABEL_SIZE_CHOICES,
  MEDIA,
  NOTIFY,
  PRINTER_TYPES,
  PRINT_ROLES,
  RESOLUTIONS,
  SPEEDS,
  TRIGGERS,
  printerLabel,
  type PrintAgent,
  type PrintDefault,
  type PrintJob,
  type PrintJobStatus,
  type Printer,
  type PrinterType,
} from '../printerData';
import type { Warehouse } from '../warehouseData';
import { setPrintJobs, usePrintJobs } from '../warehouseStore';
import { RowMenu } from './RowMenu';
import { nextSort } from './tableKit';
import styles from './printers.module.css';
import type { DataSort } from '../../../../../components/DataHeader/DataHeader';

const options = (list: readonly string[]) => list.map(v => ({ value: v, label: v }));

/** What the header's Edit changes on a printer: its settings and the warehouse's document defaults. */
export type PrinterDraft = { printer: Printer; defaults: PrintDefault[] };

/** How many fields differ between the draft and what's saved ("2 unsaved changes"). */
export function changeCount(draft: PrinterDraft, printer: Printer, defaults: PrintDefault[]) {
  const differs = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b);
  let n = (Object.keys(printer) as (keyof Printer)[]).filter(k => differs(draft.printer[k], printer[k])).length;
  for (const d of draft.defaults) {
    const saved = defaults.find(x => x.id === d.id);
    if (!saved) n++;
    else n += (Object.keys(d) as (keyof PrintDefault)[]).filter(k => differs(d[k], saved[k])).length;
  }
  return n;
}

export const statusBadge = (p: Pick<Printer, 'online' | 'paused'>) =>
  p.paused ? (
    <Badge shape="pill" color="amber">
      Paused
    </Badge>
  ) : (
    <Badge shape="pill" color={p.online ? 'green' : 'red'}>
      {p.online ? 'Online' : 'Offline'}
    </Badge>
  );

const VIEWS = [
  { id: 'settings', label: 'Settings' },
  { id: 'default-use', label: 'Default Use' },
  { id: 'jobs', label: 'Print Jobs' },
];

/**
 * One printer (Figma "Printer Details", 901:24728 …): its name, status and connection, the test / pause / remove
 * actions, and three views: Settings, Default Use and Print Jobs. The record header's Edit edits Settings and Default
 * Use together (`draft`); the edit banner above the header saves or discards them.
 */
export function PrinterDetails({
  warehouse,
  printer,
  printers,
  agents,
  defaults,
  draft,
  onDraftChange,
  view,
  onViewChange,
  onBack,
  onPrinterChange,
  onRemove,
  onNotice,
}: {
  warehouse: Warehouse;
  printer: Printer;
  /** Every printer at the warehouse (Default Printer and "send its jobs to" choices). */
  printers: Printer[];
  agents: PrintAgent[];
  defaults: PrintDefault[];
  draft: PrinterDraft | null;
  onDraftChange: (draft: PrinterDraft) => void;
  view: string;
  onViewChange: (view: string) => void;
  onBack: () => void;
  /** Saves a change made outside edit mode (pause, test page, calibration). */
  onPrinterChange: (patch: Partial<Printer>) => void;
  onRemove: () => void;
  onNotice: (text: string) => void;
}) {
  const p = draft?.printer ?? printer;
  const agent = agents.find(a => a.id === p.agentId);
  const jobs = usePrintJobs(warehouse.code);
  const editing = draft !== null;
  const set = (patch: Partial<Printer>) => draft && onDraftChange({ ...draft, printer: { ...draft.printer, ...patch } });

  function addJob(document: string, record: string) {
    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    setPrintJobs(warehouse.code, list => [
      { id: `j${Date.now()}`, printerId: printer.id, time, document, record, sentBy: 'You', copies: 1, size: printer.labelSizes[0]?.replace(' in', '') ?? 'Letter', status: printer.online && !printer.paused ? 'Printed' : 'Held' },
      ...list,
    ]);
  }

  const trail = `${p.name} · ${p.model} ${p.type.toLowerCase()} · ${p.connection === 'usb' ? 'USB' : `Network ${p.ip}:${p.port ?? 9100}`} via ${agent?.computer ?? 'no agent'}`;

  return (
    <div className={styles.tab}>
      <div className={styles.detailHead}>
        <div className={styles.detailTitle}>
          <h2 className="text-heading-2-bold">
            {printerLabel(printer)} {statusBadge(printer)}
          </h2>
          <p className={`text-tiny-regular ${styles.trail}`}>
            <button type="button" onClick={onBack}>
              Printers
            </button>{' '}
            › {trail}
          </p>
        </div>
        <div className={styles.detailActions}>
          <Button
            size="small"
            variant="outline"
            onClick={() => {
              addJob('Test page', '—');
              onNotice(printer.online && !printer.paused ? `Test page sent to ${printerLabel(printer)}.` : `${printerLabel(printer)} is ${printer.paused ? 'paused' : 'offline'}: the test page is held until it prints again.`);
            }}
          >
            Print Test Page
          </Button>
          <Button
            size="small"
            variant="outline"
            onClick={() => {
              onPrinterChange({ paused: !printer.paused });
              onNotice(printer.paused ? `${printerLabel(printer)} is printing again.` : `${printerLabel(printer)} is paused. New jobs wait until you resume it.`);
            }}
          >
            {printer.paused ? 'Resume Printing' : 'Pause Printing'}
          </Button>
          {/* Figma: the red outline (Clear / Red); it asks before removing */}
          <Button size="small" variant="red-outline" onClick={onRemove}>
            Remove from Warehouse
          </Button>
        </div>
      </div>

      <Tabs
        aria-label="Printer views"
        value={view}
        onChange={onViewChange}
        items={VIEWS.map(v => ({
          ...v,
          content:
            v.id === 'settings' ? (
              <SettingsView warehouse={warehouse} p={p} printer={printer} agents={agents} editing={editing} set={set} onPrinterChange={onPrinterChange} onNotice={onNotice} addJob={addJob} />
            ) : v.id === 'default-use' ? (
              <DefaultUseView warehouse={warehouse} p={p} printers={printers} defaults={draft?.defaults ?? defaults} draft={draft} onDraftChange={onDraftChange} set={set} />
            ) : (
              <PrintJobsView warehouse={warehouse} printer={printer} printers={printers} jobs={jobs.filter(j => j.printerId === printer.id)} onNotice={onNotice} />
            ),
        }))}
      />
    </div>
  );
}

/* ---------- Read-only fields ---------- */

function Fields({ cols = 2, children }: { cols?: 2 | 3; children: ReactNode }) {
  return (
    <dl className={styles.fields} data-cols={cols}>
      {children}
    </dl>
  );
}
function Field({ label, span, children }: { label: string; span?: boolean; children: ReactNode }) {
  return (
    <div className={styles.field} data-span={span || undefined}>
      <dt className="text-tiny-regular">{label}</dt>
      <dd className="text-medium-regular">{children}</dd>
    </div>
  );
}
/** Figma's read-only yes / no: a check (or ×) in a gray box, then the sentence. */
function YesNo({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <p className={`text-medium-regular ${styles.yesNo}`}>
      <span className={styles.box} aria-hidden>
        <Icon name={on ? 'check' : 'close'} size={20} />
      </span>
      {children}
    </p>
  );
}
function Panel({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  const id = `panel-${title.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <section className={styles.panel} aria-labelledby={id}>
      <div className={styles.panelHead}>
        <h3 id={id} className="text-large-bold">
          {title}
        </h3>
        {actions && <div className={styles.panelActions}>{actions}</div>}
      </div>
      {children}
    </section>
  );
}
const req = (text: string) => (
  <>
    {text} <span aria-hidden>*</span>
  </>
);

/* ---------- Settings (901:24728 view, 891:12852 edit) ---------- */

function SettingsView({
  warehouse,
  p,
  printer,
  agents,
  editing,
  set,
  onPrinterChange,
  onNotice,
  addJob,
}: {
  warehouse: Warehouse;
  p: Printer;
  printer: Printer;
  agents: PrintAgent[];
  editing: boolean;
  set: (patch: Partial<Printer>) => void;
  onPrinterChange: (patch: Partial<Printer>) => void;
  onNotice: (text: string) => void;
  addJob: (document: string, record: string) => void;
}) {
  const agent = agents.find(a => a.id === p.agentId);
  const sizes = p.labelSizes.length ? p.labelSizes.join(', ') : '—';
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className={styles.twoColumns}>
      <div className={styles.column}>
        <Panel title="Printer">
          {editing ? (
            <>
              <div className={styles.formGrid}>
                <TextInput label={req('Printer name')} value={p.name} onChange={e => set({ name: e.target.value })} error={!p.name.trim() ? 'Enter a printer name' : undefined} required />
                <Dropdown label="Area / location" options={options(AREAS)} value={p.area} onChange={v => set({ area: v as string })} />
                <Dropdown label="Type *" options={options(PRINTER_TYPES)} value={p.type} onChange={v => set({ type: v as PrinterType })} required />
                <div className={styles.field}>
                  <span className={`text-tiny-regular ${styles.muted}`}>Model</span>
                  <span className="text-medium-regular">
                    {p.model} · SN {p.serial}
                  </span>
                </div>
              </div>
              <Toggle label={`Active (shows in printer lists at ${warehouse.name})`} checked={p.active} onChange={e => set({ active: e.target.checked })} />
            </>
          ) : (
            <>
              <Fields>
                <Field label="Printer name">{p.name}</Field>
                <Field label="Area / location">{p.area}</Field>
                <Field label="Type">{p.type}</Field>
                <Field label="Model">
                  {p.model} · SN {p.serial}
                </Field>
              </Fields>
              <YesNo on={p.active}>{p.active ? `Yes · Active (shows in printer lists at ${warehouse.name})` : `No · Inactive (hidden from printer lists at ${warehouse.name})`}</YesNo>
            </>
          )}
        </Panel>
        <Panel
          title="Connection"
          actions={
            <Button
              size="small"
              variant="outline"
              onClick={() => {
                onPrinterChange({ lastChecked: printer.online ? 'Just now · responded in 36 ms' : 'Just now · no response' });
                onNotice(printer.online ? `${printerLabel(printer)} responded in 36 ms.` : `${printerLabel(printer)} didn’t respond. Check that it’s on and connected.`);
              }}
            >
              Test Connection
            </Button>
          }
        >
          {editing ? (
            <>
              <div className={styles.formGrid} data-cols="3">
                <Dropdown
                  label="Connection"
                  options={[
                    { value: 'network', label: 'Network (IP address)' },
                    { value: 'usb', label: 'USB via Print Agent' },
                  ]}
                  value={p.connection}
                  onChange={v => set({ connection: v as Printer['connection'] })}
                />
                {p.connection === 'network' && (
                  <>
                    <TextInput label={req('IP address')} value={p.ip ?? ''} onChange={e => set({ ip: e.target.value })} error={!/^(\d{1,3}\.){3}\d{1,3}$/.test(p.ip ?? '') ? 'Enter an IP address like 10.0.4.30' : undefined} required />
                    <TextInput label="Port" value={String(p.port ?? '')} inputMode="numeric" onChange={e => set({ port: Number(e.target.value.replace(/\D/g, '')) || undefined })} />
                  </>
                )}
              </div>
              <div className={styles.formGrid}>
                <Dropdown label="Print agent" options={agents.filter(a => a.warehouse === warehouse.code).map(a => ({ value: a.id, label: `${a.computer} · ${a.status === 'offline' ? 'Offline' : 'Online'}` }))} value={p.agentId} onChange={v => set({ agentId: v as string })} />
                <div className={styles.field}>
                  <span className={`text-tiny-regular ${styles.muted}`}>Last checked</span>
                  <span className="text-medium-regular">{p.lastChecked}</span>
                </div>
              </div>
            </>
          ) : (
            <Fields cols={3}>
              <Field label="Connection">{p.connection === 'usb' ? 'USB via Print Agent' : 'Network (IP address)'}</Field>
              <Field label="IP address">{p.ip ?? '—'}</Field>
              <Field label="Port">{p.port ?? '—'}</Field>
              <Field label="Print agent">{agent ? `${agent.computer} · ${agent.status === 'offline' ? 'Offline' : 'Online'}` : '—'}</Field>
              <Field label="Last checked">{p.lastChecked}</Field>
            </Fields>
          )}
        </Panel>
      </div>
      <div className={styles.column}>
        <Panel title="Labels & Print Quality">
          {editing ? (
            <>
              <fieldset className={styles.chipGroup}>
                <legend>Label sizes loaded</legend>
                <div className={styles.chips}>
                  {LABEL_SIZE_CHOICES.map(s => (
                    <Tag key={s} size="small" selected={p.labelSizes.includes(s)} onClick={() => set({ labelSizes: toggle(p.labelSizes, s) })}>
                      {s}
                    </Tag>
                  ))}
                </div>
              </fieldset>
              <div className={styles.formGrid} data-cols="3">
                <Dropdown label="Media" options={options(MEDIA)} value={p.media} onChange={v => set({ media: v as string })} />
                <Dropdown label="Resolution" options={options(RESOLUTIONS)} value={p.resolution} onChange={v => set({ resolution: v as string })} />
                <Dropdown label="Print speed" options={options(SPEEDS.includes(p.speed) ? SPEEDS : [p.speed, ...SPEEDS])} value={p.speed} onChange={v => set({ speed: v as string })} />
                <Dropdown label="Darkness" options={options(DARKNESS.includes(p.darkness) ? DARKNESS : [p.darkness, ...DARKNESS])} value={p.darkness} onChange={v => set({ darkness: v as string })} />
                <TextInput label="Top offset" value={p.topOffset} onChange={e => set({ topOffset: e.target.value })} />
                <TextInput label="Left offset" value={p.leftOffset} onChange={e => set({ leftOffset: e.target.value })} />
              </div>
            </>
          ) : (
            <Fields cols={3}>
              <Field label="Label sizes loaded" span>
                {sizes}
              </Field>
              <Field label="Media">{p.media}</Field>
              <Field label="Resolution">{p.resolution}</Field>
              <Field label="Print speed">{p.speed}</Field>
              <Field label="Darkness">{p.darkness}</Field>
              <Field label="Top offset">{p.topOffset}</Field>
              <Field label="Left offset">{p.leftOffset}</Field>
            </Fields>
          )}
        </Panel>
        <Panel
          title="Maintenance"
          actions={
            <>
              <Button
                size="small"
                variant="outline"
                onClick={() => {
                  onPrinterChange({ lastCalibrated: `${today} · You` });
                  onNotice(`${printerLabel(printer)} calibrated its labels.`);
                }}
              >
                Calibrate Labels
              </Button>
              <Button
                size="small"
                variant="outline"
                onClick={() => {
                  addJob('Configuration label', '—');
                  onNotice(`Configuration label sent to ${printerLabel(printer)}.`);
                }}
              >
                Print Config Label
              </Button>
            </>
          }
        >
          <Fields cols={3}>
            <Field label="Labels printed">
              {p.labelsPrinted.toLocaleString('en-US')} (this roll: {p.rollPrinted.toLocaleString('en-US')})
            </Field>
            <Field label="Last calibrated">{p.lastCalibrated}</Field>
            <Field label="Firmware">{p.firmware}</Field>
          </Fields>
        </Panel>
      </div>
    </div>
  );
}

/* ---------- Default Use (901:25215 view, 901:25764 edit) ---------- */

const DEFAULT_COLUMNS: DataColumn[] = [
  { key: 'document', label: 'Document', width: 'fill', filterable: true },
  { key: 'printer', label: 'Default Printer', width: 'fill', filterable: true },
  { key: 'size', label: 'Size', width: 110, filterable: true },
  { key: 'copies', label: 'Copies', width: 120, filterable: true },
  { key: 'trigger', label: 'Prints Automatically When', width: 'fill', filterable: true },
  { key: 'here', label: 'Default Here', width: 170, filterable: true },
];

function DefaultUseView({
  warehouse,
  p,
  printers,
  defaults,
  draft,
  onDraftChange,
  set,
}: {
  warehouse: Warehouse;
  p: Printer;
  printers: Printer[];
  defaults: PrintDefault[];
  draft: PrinterDraft | null;
  onDraftChange: (draft: PrinterDraft) => void;
  set: (patch: Partial<Printer>) => void;
}) {
  const [sort, setSort] = useState<DataSort | undefined>();
  const editing = draft !== null;
  const nameOf = (id: string) => {
    const pr = printers.find(x => x.id === id);
    if (!pr) return 'Not assigned';
    return pr.id === p.id ? `${pr.name} (this printer)` : printerLabel(pr);
  };
  const setRow = (id: string, patch: Partial<PrintDefault>) =>
    draft && onDraftChange({ ...draft, defaults: draft.defaults.map(d => (d.id === id ? { ...d, ...patch } : d)) });
  const others = printers.filter(x => x.id !== p.id);
  const rows = sort
    ? [...defaults].sort((a, b) => {
        const v = (d: PrintDefault) => (sort.key === 'printer' ? nameOf(d.printerId) : sort.key === 'here' ? String(d.printerId === p.id) : String(d[sort.key as keyof PrintDefault]));
        return v(a).localeCompare(v(b), 'en', { numeric: true }) * (sort.direction === 'ascending' ? 1 : -1);
      })
    : defaults;
  const sameSizes = (x: Printer) => x.labelSizes.join() === p.labelSizes.join();
  const sendTo = printers.find(x => x.id === p.offlineSendTo);

  return (
    <div className={styles.tab}>
      {editing && (
        <p className={`text-medium-regular ${styles.intro}`}>
          Choose which documents this printer prints by default at {warehouse.name}. These are the warehouse’s document defaults, shared by every printer, so
          changing one here changes it for all of them.
        </p>
      )}
      <DataTable
        aria-label="Default use"
        columns={DEFAULT_COLUMNS}
        rows={rows}
        rowLabel={d => d.document}
        sort={sort}
        onSortChange={key => setSort(s => nextSort(s, key))}
        empty={<p className={`text-medium-regular ${styles.muted}`}>No document defaults yet. Add printers, then choose what each one prints.</p>}
        cells={d =>
          editing
            ? {
                document: <strong>{d.document}</strong>,
                // Figma: Editable Cells (selects with the ⇕ icon, a text cell for copies) and a Toggle
                printer: (
                  <EditableCell
                    label={`Default printer for ${d.document}`}
                    type="select"
                    options={[...(d.printerId ? [] : [{ value: '', label: 'Not assigned' }]), ...printers.map(x => ({ value: x.id, label: x.id === p.id ? `${x.name} (this printer)` : printerLabel(x) }))]}
                    value={d.printerId}
                    onValueChange={v => setRow(d.id, { printerId: v })}
                  />
                ),
                size: <EditableCell label={`Size for ${d.document}`} type="select" options={[...DOCUMENT_SIZES]} value={d.size} onValueChange={v => setRow(d.id, { size: v })} />,
                copies: <EditableCell label={`Copies of ${d.document}`} value={d.copies} onValueChange={v => setRow(d.id, { copies: v })} />,
                trigger: <EditableCell label={`When ${d.document} print`} type="select" options={[...TRIGGERS]} value={d.trigger} onValueChange={v => setRow(d.id, { trigger: v })} />,
                here: (
                  <Toggle
                    aria-label={`${d.document}: default here`}
                    checked={d.printerId === p.id}
                    // Off hands the document to the first other printer, which can then be changed in Default Printer
                    onChange={e => setRow(d.id, { printerId: e.target.checked ? p.id : (others[0]?.id ?? '') })}
                  />
                ),
              }
            : {
                document: <strong>{d.document}</strong>,
                printer: <span className={d.printerId ? undefined : styles.muted}>{nameOf(d.printerId)}</span>,
                size: d.size,
                copies: d.copies,
                trigger: d.trigger,
                here: d.printerId === p.id ? (
                  <span className={styles.yesNo}>
                    <span className={styles.box} aria-hidden>
                      <Icon name="check" size={20} />
                    </span>
                    Default
                  </span>
                ) : (
                  <span aria-label="Not the default here">—</span>
                ),
              }
        }
      />

      <Panel title="If this printer is offline">
        {editing ? (
          <>
            <div className={styles.formGrid}>
              <Dropdown
                label="Send its jobs to"
                options={others.map(x => ({ value: x.id, label: `${printerLabel(x)}${sameSizes(x) ? ' (same label sizes)' : ''}` }))}
                value={p.offlineSendTo}
                placeholder="Choose a printer"
                disabled={p.offlineHold}
                onChange={v => set({ offlineSendTo: v as string })}
              />
              <Dropdown label="Notify" options={options(NOTIFY)} value={p.offlineNotify} onChange={v => set({ offlineNotify: v as string })} />
            </div>
            <Toggle label="Hold jobs and print them when it’s back instead" checked={p.offlineHold} onChange={e => set({ offlineHold: e.target.checked })} />
          </>
        ) : (
          <>
            <Fields>
              <Field label="Send its jobs to">{p.offlineHold ? 'Held until it’s back' : sendTo ? `${printerLabel(sendTo)}${sameSizes(sendTo) ? ' (same label sizes)' : ''}` : '—'}</Field>
              <Field label="Notify">{p.offlineNotify}</Field>
            </Fields>
            <YesNo on={p.offlineHold}>{p.offlineHold ? 'Yes · Hold jobs and print them when it’s back' : 'No · Hold jobs and print them when it’s back instead'}</YesNo>
          </>
        )}
      </Panel>

      <Panel title="Who can print here">
        {editing ? (
          <fieldset className={styles.chipGroup}>
            <legend>Roles</legend>
            <div className={styles.chips}>
              {PRINT_ROLES.map(r => (
                <Tag key={r} size="small" selected={p.roles.includes(r)} onClick={() => set({ roles: p.roles.includes(r) ? p.roles.filter(x => x !== r) : [...p.roles, r] })}>
                  {r}
                </Tag>
              ))}
            </div>
          </fieldset>
        ) : (
          <Fields>
            <Field label="Roles" span>
              {p.roles.length ? p.roles.join(', ') : 'Nobody yet'}
            </Field>
          </Fields>
        )}
        <p className={`text-tiny-regular ${styles.muted}`} style={{ margin: 0 }}>
          Everyone at {warehouse.name} can see the printer; only these roles get it in their print menus.
        </p>
      </Panel>
    </div>
  );
}

/* ---------- Print Jobs (901:26381) ---------- */

const JOB_COLUMNS: DataColumn[] = [
  { key: 'time', label: 'Time', width: 120, filterable: true },
  { key: 'document', label: 'Document', width: 'fill', filterable: true },
  { key: 'record', label: 'Order / Record', width: 'fill', filterable: true },
  { key: 'sentBy', label: 'Sent By', width: 150, filterable: true },
  { key: 'copies', label: 'Copies', width: 130, filterable: true },
  { key: 'size', label: 'Size', width: 110, filterable: true },
  { key: 'status', label: 'Status', width: 110, filterable: true },
];
const JOB_COLOR: Record<PrintJobStatus, BadgeColor> = { Printed: 'green', Failed: 'red', Held: 'amber', Queued: 'blue', Cancelled: 'black' };
const initials = (name: string) =>
  name
    .split(/[\s.]+/)
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

function PrintJobsView({
  warehouse,
  printer,
  printers,
  jobs,
  onNotice,
}: {
  warehouse: Warehouse;
  printer: Printer;
  printers: Printer[];
  jobs: PrintJob[];
  onNotice: (text: string) => void;
}) {
  const [day, setDay] = useState('Today');
  const [status, setStatus] = useState('All');
  const [doc, setDoc] = useState('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<DataSort | undefined>();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [moveTo, setMoveTo] = useState<string | null>(null);

  const failed = jobs.find(j => j.status === 'Failed');
  const update = (fn: (j: PrintJob) => PrintJob) => setPrintJobs(warehouse.code, list => list.map(j => (j.printerId === printer.id ? fn(j) : j)));
  const docs = [...new Set(jobs.map(j => j.document))];
  const q = query.trim().toLowerCase();
  let rows = jobs.filter(
    j => (status === 'All' || j.status === status) && (doc === 'All' || j.document === doc) && (!q || `${j.record} ${j.document}`.toLowerCase().includes(q)),
  );
  // Every sample job is from today; other days show none
  if (day !== 'Today') rows = [];
  if (sort) {
    const dir = sort.direction === 'ascending' ? 1 : -1;
    rows = [...rows].sort((a, b) => String(a[sort.key as keyof PrintJob]).localeCompare(String(b[sort.key as keyof PrintJob]), 'en', { numeric: true }) * dir);
  }

  function retry() {
    if (!failed) return;
    update(j => (j.status === 'Failed' || j.status === 'Held' ? { ...j, status: 'Printed', error: undefined } : j));
    onNotice(`${failed.document} for ${failed.record} printed. Held jobs printed after it.`);
  }

  return (
    <div className={styles.tab}>
      {failed && (
        <div className={styles.alert} role="alert">
          <div>
            <p className="text-large-bold">1 job failed · {failed.error}</p>
            <p className="text-medium-regular">
              {failed.document} for {failed.record} failed at {failed.time}.{' '}
              {failed.error === 'out of labels' ? `Load a new roll of ${failed.size} labels, then retry. ` : ''}
              Jobs waiting behind it are held so they print in order.
            </p>
          </div>
          <div className={styles.buttonRow}>
            <Button
              size="small"
              variant="outline"
              onClick={() => {
                setMoveTo(printers.find(x => x.id !== printer.id && x.labelSizes.includes(`${failed.size} in`))?.id ?? printers.find(x => x.id !== printer.id)?.id ?? null);
                setMoving(true);
              }}
            >
              Send to Another Printer
            </Button>
            <Button size="small" variant="brand" onClick={retry}>
              Retry Job
            </Button>
          </div>
        </div>
      )}

      <div className={styles.toolbar} role="toolbar" aria-label="Print job filters">
        <Dropdown variant="small" label="Day" hideLabel options={options(['Today', 'Yesterday', 'Last 7 days'])} value={day} onChange={v => setDay(v as string)} />
        <Dropdown variant="small" label="Status" hideLabel options={options(['All', 'Printed', 'Failed', 'Held', 'Queued', 'Cancelled'])} value={status} onChange={v => setStatus(v as string)} renderValue={s => `Status: ${s[0]?.label}`} />
        <Dropdown variant="small" label="Document" hideLabel options={options(['All', ...docs])} value={doc} onChange={v => setDoc(v as string)} renderValue={s => `Document: ${s[0]?.label}`} />
        <SearchInput className={styles.toolbarSearch} aria-label="Search order # or document" placeholder="Search order # or document" value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      <DataTable
        aria-label={`Print jobs on ${printerLabel(printer)}`}
        columns={JOB_COLUMNS}
        rows={rows}
        rowLabel={j => `${j.document} ${j.time}`}
        sort={sort}
        onSortChange={key => setSort(s => nextSort(s, key))}
        empty={<p className={`text-medium-regular ${styles.muted}`}>No print jobs match. Try another day, status or document.</p>}
        onMore={j => setMenuFor(m => (m === j.id ? null : j.id))}
        renderAfterRow={j =>
          menuFor === j.id && (
            <RowMenu
              label={`${j.document} ${j.time}`}
              onClose={() => setMenuFor(null)}
              items={[
                {
                  label: j.status === 'Failed' ? 'Retry' : 'Reprint',
                  disabled: j.status === 'Held' || j.status === 'Queued',
                  onSelect: () => {
                    if (j.status === 'Failed') retry();
                    else {
                      setPrintJobs(warehouse.code, list => [{ ...j, id: `j${Date.now()}`, time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }), sentBy: 'You', status: 'Printed' }, ...list]);
                      onNotice(`${j.document} for ${j.record} reprinted.`);
                    }
                  },
                },
                {
                  label: 'Cancel',
                  disabled: !(j.status === 'Held' || j.status === 'Queued' || j.status === 'Failed'),
                  onSelect: () => {
                    update(x => (x.id === j.id ? { ...x, status: 'Cancelled', error: undefined } : x));
                    onNotice(`${j.document} for ${j.record} was cancelled.`);
                  },
                },
              ]}
            />
          )
        }
        cells={j => ({
          time: j.time,
          document: <strong>{j.document}</strong>,
          record: j.record,
          sentBy: (
            <span className={styles.sender}>
              <Avatar size="small" type="initial" initials={initials(j.sentBy)} label={j.sentBy} />
              {j.sentBy}
            </span>
          ),
          copies: j.copies,
          size: j.size,
          status: (
            <Badge shape="pill" color={JOB_COLOR[j.status]}>
              {j.status}
            </Badge>
          ),
        })}
      />

      <AppModal
        open={moving}
        onClose={() => setMoving(false)}
        title="Send to another printer"
        description={failed && `${failed.document} for ${failed.record}, and the jobs held behind it, print on the printer you choose.`}
        primaryAction={{
          label: 'Send',
          disabled: !moveTo,
          onClick: () => {
            const to = printers.find(x => x.id === moveTo);
            if (!to || !failed) return;
            setPrintJobs(warehouse.code, list =>
              list.map(j => (j.printerId === printer.id && (j.status === 'Failed' || j.status === 'Held') ? { ...j, printerId: to.id, status: 'Printed', error: undefined } : j)),
            );
            setMoving(false);
            onNotice(`${failed.document} for ${failed.record} printed on ${printerLabel(to)}.`);
          },
        }}
      >
        <Dropdown
          label="Printer"
          options={printers.filter(x => x.id !== printer.id).map(x => ({ value: x.id, label: `${printerLabel(x)}${x.online ? '' : ' (offline)'}` }))}
          value={moveTo}
          onChange={v => setMoveTo(v as string)}
        />
      </AppModal>
    </div>
  );
}
