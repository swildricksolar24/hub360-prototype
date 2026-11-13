import { useEffect, useState } from 'react';
import { Badge } from '../../../../../components/Badge/Badge';
import { Button } from '../../../../../components/Button/Button';
import { Tag } from '../../../../../components/Tag/Tag';
import { DataTable, type DataColumn } from '../../../../../components/DataTable/DataTable';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { Icon } from '../../../../../components/Icon/Icon';
import { RadioButton } from '../../../../../components/RadioButton/RadioButton';
import { TextInput } from '../../../../../components/TextInput/TextInput';
import { AppModal } from '../../../../components/AppModal';
import {
  AREAS,
  DARKNESS,
  DEFAULT_FOR,
  FOUND_ON_NETWORK,
  FOUND_ON_USB,
  LABEL_SIZE_CHOICES,
  PRINTER_TYPES,
  RESOLUTIONS,
  SPEEDS,
  pairingCode,
  printerLabel,
  type FoundPrinter,
  type PrintAgent,
  type Printer,
  type PrinterType,
} from '../printerData';
import type { Warehouse } from '../warehouseData';
import styles from './printers.module.css';

const options = (list: readonly string[]) => list.map(v => ({ value: v, label: v }));

/** Figma's stepper: done steps are filled teal with a check, the current one has a teal ring and dot. */
export function Steps({ steps, current, label }: { steps: string[]; current: number; label: string }) {
  return (
    <div className={styles.stepper}>
      <div className={styles.track} aria-hidden>
        {steps.map((s, i) => (
          <span key={s} style={{ display: 'contents' }}>
            {i > 0 && <span className={styles.line} />}
            <span className={styles.dot} data-state={i < current ? 'done' : i === current ? 'current' : 'todo'}>
              {i < current && <Icon name="check" size={20} color="currentColor" />}
            </span>
          </span>
        ))}
      </div>
      <ol className={`text-medium-regular ${styles.stepLabels}`} aria-label={label}>
        {steps.map((s, i) => (
          <li key={s} aria-current={i === current ? 'step' : undefined} data-done={i < current || undefined}>
            {s}
            {i < current && <span className={styles.srOnly}> (done)</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------- Set Up Print Agent (891:3722) ---------- */

/**
 * Hub360 prints through a small app on a warehouse computer. Download it, install it, then enter the pairing code in
 * it. In the prototype the agent "connects" a few seconds after a download is picked.
 */
export function SetUpAgentModal({
  open,
  warehouse,
  agentCount,
  onClose,
  onPaired,
}: {
  open: boolean;
  warehouse: Warehouse;
  /** How many agents the warehouse has, to name the new one (SHIP-PC-03). */
  agentCount: number;
  onClose: () => void;
  onPaired: (agent: Omit<PrintAgent, 'id'>) => void;
}) {
  const [code, setCode] = useState('');
  const [os, setOs] = useState<string | null>(null);
  const [paired, setPaired] = useState(false);
  const [seconds, setSeconds] = useState(600);
  const computer = `${warehouse.code.split('-')[0]}-PC-${String(agentCount + 1).padStart(2, '0')}`;

  useEffect(() => {
    if (!open) return;
    setCode(pairingCode());
    setOs(null);
    setPaired(false);
    setSeconds(600);
    const tick = window.setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(tick);
  }, [open]);

  // The prototype's stand-in for the agent: it pairs a few seconds after the download
  useEffect(() => {
    if (!open || !os || paired) return;
    const t = window.setTimeout(() => setPaired(true), 4000);
    return () => window.clearTimeout(t);
  }, [open, os, paired]);

  const step = paired ? 3 : os ? 2 : 0;
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      width={760}
      title="Set up the print agent"
      description="Hub360 runs in the cloud, so it prints through a small app on a computer at the warehouse."
      primaryAction={{
        label: 'Done',
        disabled: !paired,
        onClick: () => onPaired({ computer, warehouse: warehouse.code, version: '2.4.1', lastSeen: 'Just now', status: 'online' }),
      }}
    >
      <div className={styles.modalBody}>
        <Steps steps={['Download', 'Install', 'Pair']} current={step} label="Print agent setup" />
        <section className={styles.box} aria-labelledby="agent-download">
          <h3 id="agent-download" className="text-large-bold">
            1 · Download and install
          </h3>
          <div className={styles.buttonRow}>
            {['Windows', 'macOS'].map(o => (
              <Button key={o} variant="outline" icon="export-download" selected={os === o} onClick={() => setOs(o)}>
                {o}
              </Button>
            ))}
          </div>
          <p className="text-small-regular">
            {os
              ? `Downloading HUB360 Print Agent for ${os}. Install it, then enter the code below in it.`
              : 'Install it on a computer that stays on and is on the same network as the printers. One agent can serve every printer at the warehouse.'}
          </p>
        </section>
        <section className={styles.box} aria-labelledby="agent-code">
          <h3 id="agent-code" className="text-large-bold">
            2 · Enter this code in the agent
          </h3>
          <p className={`text-heading-2-bold ${styles.code}`} aria-label={`Pairing code ${code.split('').join(' ')}`}>
            {code}
          </p>
          <p className="text-small-regular">
            Code expires in {time} · pairs the agent with {warehouse.name} ({warehouse.code})
          </p>
        </section>
        <div className={styles.waiting} role="status">
          {paired ? (
            <Icon name="success" size={24} color="var(--color-semantic-text-success)" />
          ) : (
            <Icon name="progress-activity" size={24} className={styles.spinner} />
          )}
          <div>
            <p className="text-medium-bold">{paired ? `${computer} is connected` : 'Waiting for the agent to connect…'}</p>
            <p className="text-small-regular">{paired ? 'Choose Done, then add your printers.' : 'This window updates by itself when pairing finishes.'}</p>
          </div>
        </div>
      </div>
    </AppModal>
  );
}

/* ---------- Add Printer (891:3801, 891:3882, 891:4036) ---------- */

type Connection = 'network' | 'ip' | 'usb';
const CONNECTIONS: { value: Connection; label: string; description: (agent: string) => string }[] = [
  { value: 'network', label: 'Find it on the network', description: () => 'Recommended. The agent scans the network and lists printers it can reach.' },
  { value: 'ip', label: 'Enter an IP address', description: () => 'For printers with a fixed IP, or on another network segment.' },
  { value: 'usb', label: 'USB to the agent’s computer', description: agent => `Lists printers plugged into ${agent || 'the agent’s computer'} or installed on it.` },
];

// A short list with no filters wired; Model, Type and Already Added are the columns whose values repeat
const FOUND_COLUMNS: DataColumn[] = [
  { key: 'name', label: 'Printer', width: 'fill' },
  { key: 'model', label: 'Model', width: 'fill', filterable: true },
  { key: 'ip', label: 'IP Address', width: 130 },
  { key: 'type', label: 'Type', width: 130, filterable: true },
  { key: 'added', label: 'Already Added', width: 150, filterable: true },
];

export type NewPrinter = Omit<Printer, 'id'>;

/**
 * Add Printer, in three steps: how the printer connects (through which agent), which printer (the agent's scan, an IP
 * address or USB), then its settings with a label preview and a test print. Saving can also make it the default
 * printer for some documents.
 */
export function AddPrinterModal({
  open,
  warehouse,
  agents,
  printers,
  onClose,
  onSave,
}: {
  open: boolean;
  warehouse: Warehouse;
  /** This warehouse's agents. */
  agents: PrintAgent[];
  /** Printers already at the warehouse (they can't be added twice). */
  printers: Printer[];
  onClose: () => void;
  onSave: (printer: NewPrinter, defaultFor: string[]) => void;
}) {
  const [step, setStep] = useState(0);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [connection, setConnection] = useState<Connection>('network');
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('9100');
  const [chosen, setChosen] = useState<FoundPrinter | null>(null);
  const [scans, setScans] = useState(1);
  const [form, setForm] = useState({ name: '', area: AREAS[4]!, type: 'Thermal label' as PrinterType, sizes: ['4 × 6 in'], resolution: '203 dpi', speed: '4 in/s', darkness: 'Default (15)' });
  const [defaultFor, setDefaultFor] = useState<string[]>([]);
  const [tested, setTested] = useState<'no' | 'printed' | 'ok'>('no');
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setAgentId(agents.find(a => a.status === 'online')?.id ?? agents[0]?.id ?? null);
    setConnection('network');
    setIp('');
    setPort('9100');
    setChosen(null);
    setScans(1);
    setDefaultFor([]);
    setTested('no');
    setTried(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const agent = agents.find(a => a.id === agentId);
  const isAdded = (f: FoundPrinter) => printers.some(p => p.name === f.name && (f.ip === 'USB' || p.ip === f.ip));
  const found: FoundPrinter[] =
    connection === 'usb'
      ? FOUND_ON_USB
      : connection === 'ip'
        ? [{ id: 'ip', name: `PRN-${ip.split('.').at(-1) || 'NEW'}`, model: 'Generic network printer', ip, type: 'Laser' }]
        : FOUND_ON_NETWORK;
  const ipValid = /^(\d{1,3}\.){3}\d{1,3}$/.test(ip.trim());

  function choose(f: FoundPrinter) {
    setChosen(f);
    setForm(x => ({ ...x, name: f.name, type: f.type, sizes: f.type === 'Thermal label' ? ['4 × 6 in'] : [] }));
  }
  function next() {
    if (step === 0) {
      if (connection === 'ip' && !ipValid) {
        setTried(true);
        return;
      }
      setTried(false);
      if (connection === 'ip') choose(found[0]!);
      else setChosen(null);
      setStep(1);
    } else if (step === 1 && chosen) {
      setStep(2);
    }
  }
  function save() {
    setTried(true);
    if (!form.name.trim() || !chosen || !agent) return;
    onSave(
      {
        name: form.name.trim(),
        area: form.area,
        type: form.type,
        model: chosen.model,
        serial: '—',
        connection: connection === 'usb' ? 'usb' : 'network',
        ip: connection === 'usb' ? undefined : chosen.ip,
        port: connection === 'usb' ? undefined : Number(port) || 9100,
        agentId: agent.id,
        labelSizes: form.sizes,
        media: form.type === 'Thermal label' ? 'Direct thermal' : 'Plain paper',
        resolution: form.resolution,
        speed: form.speed,
        darkness: form.darkness,
        topOffset: '0 dots',
        leftOffset: '0 dots',
        active: true,
        online: true,
        paused: false,
        labelsPrinted: tested === 'no' ? 0 : 1,
        rollPrinted: tested === 'no' ? 0 : 1,
        lastCalibrated: 'Not yet',
        firmware: '—',
        lastChecked: 'Just now · responded in 41 ms',
        offlineSendTo: null,
        offlineNotify: 'Warehouse manager',
        offlineHold: true,
        roles: ['Shipping', 'Warehouse Staff', 'Warehouse Manager'],
      },
      defaultFor,
    );
  }

  const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  const subtitle = `${warehouse.name} · Step ${step + 1} of 3`;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      width={step === 0 ? 800 : step === 1 ? 940 : 1240}
      title="Add printer"
      description={subtitle}
      startAction={step === 1 && connection !== 'ip' ? { label: 'Scan Again', onClick: () => setScans(n => n + 1) } : undefined}
      secondaryAction={step === 0 ? undefined : { label: 'Back', onClick: () => setStep(s => s - 1) }}
      primaryAction={
        step === 2
          ? { label: 'Save Printer', onClick: save }
          : { label: 'Next', disabled: !agent || (step === 1 && !chosen), onClick: next }
      }
    >
      <div className={styles.modalBody}>
        <Steps steps={['Connection', 'Find printer', 'Settings & test']} current={step} label="Add printer steps" />

        {step === 0 && (
          <>
            <Dropdown
              label="Print agent"
              options={agents.map(a => ({ value: a.id, label: `${a.computer} · ${a.status === 'offline' ? 'Offline' : 'Online'}` }))}
              value={agentId}
              onChange={v => setAgentId(v as string)}
            />
            <fieldset className={styles.choices}>
              <legend className={styles.srOnly}>How the printer connects</legend>
              {CONNECTIONS.map(c => (
                // The whole card picks the option
                <div key={c.value} className={styles.choice} onClick={() => setConnection(c.value)}>
                  <RadioButton
                    name="printer-connection"
                    value={c.value}
                    checked={connection === c.value}
                    onChange={() => setConnection(c.value)}
                    label={<span className="text-medium-bold">{c.label}</span>}
                    description={c.description(agent?.computer ?? '')}
                  />
                </div>
              ))}
            </fieldset>
            {connection === 'ip' && (
              <div className={styles.formGrid}>
                <TextInput
                  label={<>IP address <span aria-hidden>*</span></>}
                  value={ip}
                  onChange={e => setIp(e.target.value)}
                  placeholder="10.0.4.50"
                  error={tried && !ipValid ? 'Enter an IP address like 10.0.4.50' : undefined}
                  required
                />
                <TextInput label="Port" value={port} onChange={e => setPort(e.target.value)} inputMode="numeric" />
              </div>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <div className={styles.found} role="status">
              <p className="text-large-bold">
                {connection === 'usb'
                  ? `Found ${found.length} printer on ${agent?.computer}`
                  : connection === 'ip'
                    ? `Found a printer at ${ip}`
                    : `Found ${found.length} printers on 10.0.4.x`}
              </p>
              <p className="text-medium-regular">
                {connection === 'ip'
                  ? `It answered on port ${port || 9100}.`
                  : `Scanned through ${agent?.computer} in ${scans === 1 ? 6 : 4} seconds. Printers already added to ${warehouse.name} can’t be added twice.`}
              </p>
            </div>
            <DataTable
              aria-label="Printers found"
              columns={FOUND_COLUMNS}
              rows={found}
              rowLabel={f => f.name}
              striped
              selected={chosen ? [chosen.id] : []}
              onSelectedChange={ids => {
                // One printer at a time; ones already added can't be picked
                const pick = found.find(f => ids.includes(f.id) && f.id !== chosen?.id && !isAdded(f));
                if (pick) choose(pick);
                else if (!ids.length) setChosen(null);
              }}
              inactive={isAdded}
              cells={f => ({
                name: <strong>{f.name}</strong>,
                model: f.model,
                ip: f.ip,
                type: f.type,
                added: (
                  <Badge shape="pill" color={isAdded(f) ? 'blue' : 'green'}>
                    {isAdded(f) ? 'Added' : 'New'}
                  </Badge>
                ),
              })}
            />
          </>
        )}

        {step === 2 && chosen && (
          <>
            <div className={styles.settingsAndPreview}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <TextInput
                    label={<>Printer name <span aria-hidden>*</span></>}
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    error={tried && !form.name.trim() ? 'Enter a printer name' : undefined}
                    required
                  />
                  <Dropdown label="Area / location" options={options(AREAS)} value={form.area} onChange={v => setForm(f => ({ ...f, area: v as string }))} />
                  <Dropdown label="Type *" options={options(PRINTER_TYPES)} value={form.type} onChange={v => setForm(f => ({ ...f, type: v as PrinterType }))} required />
                  <div className={styles.field}>
                    <span className={`text-tiny-regular ${styles.muted}`}>Connection</span>
                    <span className="text-medium-regular">
                      {connection === 'usb' ? `USB · via ${agent?.computer}` : `Network · ${chosen.ip}:${port || 9100} · via ${agent?.computer}`}
                    </span>
                  </div>
                </div>
                {form.type === 'Thermal label' && (
                  <fieldset className={styles.chipGroup}>
                    <legend>Label sizes loaded</legend>
                    <div className={styles.chips}>
                      {LABEL_SIZE_CHOICES.map(s => (
                        <Tag key={s} size="small" selected={form.sizes.includes(s)} onClick={() => setForm(f => ({ ...f, sizes: toggle(f.sizes, s) }))}>
                          {s}
                        </Tag>
                      ))}
                    </div>
                  </fieldset>
                )}
                <div className={styles.formGrid} data-cols="3">
                  <Dropdown label="Resolution" options={options(RESOLUTIONS)} value={form.resolution} onChange={v => setForm(f => ({ ...f, resolution: v as string }))} />
                  <Dropdown label="Print speed" options={options(SPEEDS)} value={form.speed} onChange={v => setForm(f => ({ ...f, speed: v as string }))} />
                  <Dropdown label="Darkness" options={options(DARKNESS)} value={form.darkness} onChange={v => setForm(f => ({ ...f, darkness: v as string }))} />
                </div>
                <fieldset className={styles.chipGroup}>
                  <legend>Use as default for (optional)</legend>
                  <div className={styles.chips}>
                    {DEFAULT_FOR.map(d => (
                      <Tag key={d} size="small" selected={defaultFor.includes(d)} onClick={() => setDefaultFor(list => toggle(list, d))}>
                        {d}
                      </Tag>
                    ))}
                  </div>
                </fieldset>
              </div>
              <LabelPreview warehouse={warehouse} size={form.sizes[0] ?? 'Letter'} onTest={() => setTested('printed')} />
            </div>
            {tested === 'printed' && (
              <div className={styles.testResult} role="status">
                <div>
                  <p className="text-large-bold">Test label printed · did it come out right?</p>
                  <p className="text-medium-regular">
                    Sent a {(form.sizes[0] ?? 'Letter').replace(' in', '')} test label with a barcode and alignment marks. If it is cut off or faint, adjust the size,
                    darkness or alignment and print again.
                  </p>
                </div>
                <div className={styles.buttonRow}>
                  <Button size="small" variant="outline" onClick={() => setTested('printed')}>
                    Adjust &amp; Reprint
                  </Button>
                  <Button size="small" variant="brand" onClick={() => setTested('ok')}>
                    Looks Right
                  </Button>
                </div>
              </div>
            )}
            {tested === 'ok' && (
              <p className={`text-medium-regular ${styles.muted}`} role="status">
                Test label confirmed. Save the printer to start using it.
              </p>
            )}
          </>
        )}
      </div>
    </AppModal>
  );
}

/** Figma "Label Preview": a 4 × 6 label with sample data, Full-Size Preview and Print Test Label. */
function LabelPreview({ warehouse, size, onTest }: { warehouse: Warehouse; size: string; onTest: () => void }) {
  const [full, setFull] = useState(false);
  return (
    <section className={styles.preview} aria-labelledby="label-preview">
      <div className={styles.previewHead}>
        <h3 id="label-preview" className="text-medium-bold">
          Label Preview
        </h3>
        <span className={`text-tiny-regular ${styles.muted}`}>{size} · sample data</span>
      </div>
      <div className={styles.label} style={full ? { width: '100%' } : undefined} aria-label="Sample pick / pack label">
        <p className="text-large-bold">PICK / PACK</p>
        <p>
          {warehouse.code} · {warehouse.name}
        </p>
        <hr />
        <p>
          <strong>ORDER</strong> ORD-10480
        </p>
        <p>
          Ship to: Gomez Residence
          <br />
          4418 E Cactus Rd, Phoenix, AZ 85032
        </p>
        <hr />
        <p>
          <strong>Carton 1 of 3 · 12 items</strong>
        </p>
        <div className={styles.barcode} aria-hidden />
        <p className={styles.center}>ORD-10480-C01</p>
      </div>
      <div className={styles.previewActions}>
        <Button size="small" variant="primary" icon="visibility" selected={full} onClick={() => setFull(f => !f)}>
          {full ? 'Preview Size' : 'Full-Size Preview'}
        </Button>
        <Button size="small" variant="primary" icon="document" onClick={onTest}>
          Print Test Label
        </Button>
      </div>
    </section>
  );
}

/** Asks before a printer leaves the warehouse (Figma shows the red "Remove from Warehouse"). */
export function RemovePrinterModal({ printer, onClose, onConfirm }: { printer: Printer | null; onClose: () => void; onConfirm: () => void }) {
  return (
    <AppModal
      open={printer !== null}
      onClose={onClose}
      title="Remove printer from warehouse?"
      description={
        printer &&
        `${printerLabel(printer)} will be removed. Documents it prints by default need another printer, and its print job history is kept for the warehouse’s history period.`
      }
      primaryAction={{ label: 'Remove Printer', danger: true, onClick: onConfirm }}
    />
  );
}
