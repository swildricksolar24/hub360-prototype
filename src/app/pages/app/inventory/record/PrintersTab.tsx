import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '../../../../../components/Badge/Badge';
import { Button } from '../../../../../components/Button/Button';
import { DataTable, type DataColumn } from '../../../../../components/DataTable/DataTable';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { Icon } from '../../../../../components/Icon/Icon';
import { SearchInput } from '../../../../../components/SearchBar/SearchBar';
import { Toggle } from '../../../../../components/Toggle/Toggle';
import {
  HISTORY,
  LABEL_LANGUAGES,
  NOTIFY,
  RETRIES,
  connectionText,
  printerLabel,
  type PrintAgent,
  type PrintDefault,
  type Printer,
} from '../printerData';
import type { Warehouse } from '../warehouseData';
import { useHelperFlag } from '../../../../shell/helperFlags';
import { HelperToggle, PrototypeHelper } from '../../../../shell/PrototypeHelper';
import {
  setAgents,
  setPrintDefaults,
  setPrintJobs,
  setPrintSettings,
  setPrinters,
  useAgents,
  usePrintDefaults,
  usePrintSettings,
  usePrinters,
  useWarehouses,
} from '../warehouseStore';
import { PrinterDetails, statusBadge, type PrinterDraft } from './PrinterDetails';
import { AddPrinterModal, RemovePrinterModal, SetUpAgentModal } from './PrinterModals';
import { RowMenu } from './RowMenu';
import { Pager, Segmented, useTableControls } from './tableKit';
import styles from './printers.module.css';

const options = (list: readonly string[]) => list.map(v => ({ value: v, label: v }));

const LIST_COLUMNS: DataColumn[] = [
  // Narrow cards: columns shrink to their minWidth, then hide by priority: Label Sizes, then Connection, then Used For
  { key: 'name', label: 'Printer', width: 'fill', minWidth: 120, filterable: true },
  { key: 'area', label: 'Area', width: 'fill', minWidth: 100, filterable: true },
  { key: 'type', label: 'Type', width: 120, minWidth: 90, filterable: true },
  { key: 'connection', label: 'Connection', width: 'fill', minWidth: 110, priority: 2, filterable: true },
  { key: 'sizes', label: 'Label Sizes', width: 160, minWidth: 110, priority: 3, filterable: true },
  { key: 'usedFor', label: 'Used For', width: 'fill', minWidth: 110, priority: 1, filterable: true },
  { key: 'status', label: 'Status', width: 110, filterable: true },
];

const AGENT_COLUMNS: DataColumn[] = [
  { key: 'computer', label: 'Computer', width: 'fill', filterable: true },
  { key: 'warehouse', label: 'Warehouse', width: 'fill', filterable: true },
  { key: 'version', label: 'Version', width: 130, filterable: true },
  { key: 'printers', label: 'Printers', width: 130, filterable: true },
  { key: 'lastSeen', label: 'Last Seen', width: 130, filterable: true },
  { key: 'status', label: 'Status', width: 150, filterable: true },
];

/**
 * Warehouse record › Printers (Figma "Printers" page, 886:64893): List (886:64894) and Settings (911:5680). A warehouse
 * without printers shows the first-setup screen (891:3248) in List, with Settings still a click away. A printer's name
 * opens Printer Details (901:24728 …). The view and the open printer are in the URL (?tab=printers&view=settings,
 * &printer=pr3&pview=jobs); switching List / Settings adds a history entry, so Back and Forward step between them.
 */
export function PrintersTab({
  warehouse,
  onNotice,
  draft,
  onDraftChange,
}: {
  warehouse: Warehouse;
  onNotice: (text: string) => void;
  /** The open printer's edits, while the header's Edit is on (WarehouseRecordPage keeps it). */
  draft: PrinterDraft | null;
  onDraftChange: (draft: PrinterDraft) => void;
}) {
  const [params, setParams] = useSearchParams();
  const code = warehouse.code;
  // Helper switches (a prototype tool): view-only overrides, the data is untouched
  const noPrinters = useHelperFlag('printers.empty');
  const agentsOffline = useHelperFlag('printers.agentOffline');
  const printerOffline = useHelperFlag('printer.offline');
  const printerPaused = useHelperFlag('printer.paused');
  const printerInactive = useHelperFlag('printer.inactive');

  const storedPrinters = usePrinters(code);
  const printers = noPrinters ? [] : storedPrinters;
  const defaults = usePrintDefaults(code);
  const storedAgents = useAgents();
  const allAgents = agentsOffline ? storedAgents.map(a => (a.warehouse === code ? { ...a, status: 'offline' as const, lastSeen: '2 h ago' } : a)) : storedAgents;
  const agents = allAgents.filter(a => a.warehouse === code);
  const [settingUp, setSettingUp] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Printer | null>(null);

  const view = params.get('view') === 'settings' ? 'settings' : 'list';
  const openStored = printers.find(p => p.id === params.get('printer'));
  // The Printer switches apply to the printer that's open
  const open = openStored && {
    ...openStored,
    ...(printerOffline && { online: false, lastChecked: 'Just now · no response' }),
    ...(printerPaused && { paused: true }),
    ...(printerInactive && { active: false }),
  };

  const helper = (
    <>
      <PrototypeHelper title="Printers">
        <HelperToggle flag="printers.empty" label="No printers" />
        <HelperToggle flag="printers.agentOffline" label="Print agent offline" />
      </PrototypeHelper>
      {open && (
        <PrototypeHelper title="Printer">
          <HelperToggle flag="printer.offline" label="Printer offline" />
          <HelperToggle flag="printer.paused" label="Printer paused" />
          <HelperToggle flag="printer.inactive" label="Printer inactive" />
        </PrototypeHelper>
      )}
    </>
  );
  const go = (next: Record<string, string>, replace = false) => setParams({ tab: 'printers', ...next }, { replace });

  function pair(agent: Omit<PrintAgent, 'id'>) {
    setAgents(list => [...list, { ...agent, id: `ag${Date.now()}` }]);
    setSettingUp(false);
    onNotice(`${agent.computer} is paired with ${warehouse.name}. Add your printers next.`);
  }
  function remove(p: Printer) {
    setPrinters(code, list => list.filter(x => x.id !== p.id));
    // Documents it printed by default need another printer; its jobs leave with it
    setPrintDefaults(code, list => list.map(d => (d.printerId === p.id ? { ...d, printerId: '' } : d)));
    setPrintJobs(code, list => list.filter(j => j.printerId !== p.id));
    setRemoving(null);
    go({}, true);
    onNotice(`${printerLabel(p)} was removed from ${warehouse.name}.`);
  }
  const patch = (id: string, change: Partial<Printer>) => setPrinters(code, list => list.map(p => (p.id === id ? { ...p, ...change } : p)));

  const modals = (
    <>
      <SetUpAgentModal open={settingUp} warehouse={warehouse} agentCount={agents.length} onClose={() => setSettingUp(false)} onPaired={pair} />
      <AddPrinterModal
        open={adding}
        warehouse={warehouse}
        agents={agents}
        printers={printers}
        onClose={() => setAdding(false)}
        onSave={(printer, defaultFor) => {
          const id = `pr${Date.now()}`;
          setPrinters(code, list => [...list, { ...printer, id }]);
          if (defaultFor.length) {
            // "Pick/Pack labels" is the Pick/Pack carton label; documents the warehouse doesn't print yet are added
            const docName = (d: string) => (d === 'Pick/Pack labels' ? 'Pick/Pack carton labels' : d === 'Item Barcode' ? 'Item barcodes' : d);
            setPrintDefaults(code, list => {
              const next = list.map(d => (defaultFor.map(docName).includes(d.document) ? { ...d, printerId: id } : d));
              for (const d of defaultFor.map(docName)) {
                if (!next.some(x => x.document === d)) next.push({ id: `d${Date.now()}-${d}`, document: d, printerId: id, size: printer.labelSizes[0]?.replace(' in', '') ?? 'Letter', copies: '1', trigger: 'Only when printed by hand' });
              }
              return next;
            });
          }
          setAdding(false);
          go({}, true);
          onNotice(`${printerLabel(printer)} was added to ${warehouse.name}.`);
        }}
      />
      <RemovePrinterModal printer={removing} onClose={() => setRemoving(null)} onConfirm={() => removing && remove(removing)} />
    </>
  );

  if (open) {
    return (
      <>
        {/* First, so the Helper lists Printers and Printer above the open view's group */}
        {helper}
        <PrinterDetails
          warehouse={warehouse}
          printer={open}
          printers={printers}
          agents={allAgents}
          defaults={defaults}
          draft={draft}
          onDraftChange={onDraftChange}
          view={params.get('pview') ?? 'settings'}
          onViewChange={v => go({ printer: open.id, ...(v === 'settings' ? {} : { pview: v }) })}
          onBack={() => go({})}
          onPrinterChange={change => patch(open.id, change)}
          onRemove={() => setRemoving(open)}
          onNotice={onNotice}
        />
        {modals}
      </>
    );
  }

  return (
    <div className={styles.tab}>
      {/* Volt "Button Group / Horizontal" (Base 523:795), the same switch as Locations' Tree / Flat List */}
      <div>
        <Segmented
          label="Printers view"
          options={[
            { value: 'list', label: 'List' },
            { value: 'settings', label: 'Settings' },
          ]}
          value={view}
          onChange={v => go(v === 'settings' ? { view: 'settings' } : {})}
        />
      </div>
      {view === 'settings' ? (
        <PrinterSettings warehouse={warehouse} printers={printers} agents={allAgents} onSetUpAgent={() => setSettingUp(true)} />
      ) : printers.length === 0 ? (
        <FirstSetup warehouse={warehouse} agents={agents} onSetUpAgent={() => setSettingUp(true)} onAddPrinter={() => setAdding(true)} />
      ) : (
        <PrinterList printers={printers} defaults={defaults} onOpen={p => go({ printer: p.id })} onAdd={() => setAdding(true)} onRemove={setRemoving} onPatch={patch} onNotice={onNotice} />
      )}
      {modals}
      {helper}
    </div>
  );
}

/* ---------- First setup (891:3248) ---------- */

function FirstSetup({
  warehouse,
  agents,
  onSetUpAgent,
  onAddPrinter,
}: {
  warehouse: Warehouse;
  agents: PrintAgent[];
  onSetUpAgent: () => void;
  onAddPrinter: () => void;
}) {
  const [, setParams] = useSearchParams();
  // Figma's copy in every state: a paired agent only turns Add Printer on (the text and step 1 don't change)
  const paired = agents.length > 0;
  return (
    <div className={styles.empty}>
      <Icon name="monitor" size={48} />
      <h2 className="text-heading-2-bold">No Printers Are Set Up for this Warehouse Yet</h2>
      <p className="text-medium-regular">Printers print pick tickets, packing slips and labels. Set them up once and every printer list in this warehouse uses them.</p>
      <ol className={styles.setupSteps} aria-label="Printer setup">
        <li className={styles.setupStep}>
          <span className={styles.setupTitle}>
            <span className={styles.stepNumber} aria-hidden>
              1
            </span>
            <span className="text-large-bold">Install the print agent</span>
          </span>
          <p className="text-small-regular">A small app on a warehouse computer that sends jobs to your printers.</p>
          <Button size="small" variant="brand" onClick={onSetUpAgent}>
            Set Up Print Agent
          </Button>
        </li>
        <li className={styles.setupStep}>
          <span className={styles.setupTitle}>
            <span className={styles.stepNumber} aria-hidden>
              2
            </span>
            <span className="text-large-bold">Add printers</span>
          </span>
          <p className="text-small-regular">Find them on the network, enter an IP address, or pick a USB printer.</p>
          <Button size="small" variant={paired ? 'brand' : 'outline'} icon="plus" disabled={!paired} onClick={onAddPrinter}>
            Add Printer
          </Button>
        </li>
        <li className={styles.setupStep}>
          <span className={styles.setupTitle}>
            <span className={styles.stepNumber} aria-hidden>
              3
            </span>
            <span className="text-large-bold">Choose what each one prints</span>
          </span>
          <p className="text-small-regular">Pick tickets, packing slips and label defaults are set on Pick / Pack.</p>
          <Button size="small" variant="outline" disabled onClick={() => setParams({ tab: 'pick-pack' })}>
            Go to Pick / Pack
          </Button>
        </li>
      </ol>
    </div>
  );
}

/* ---------- List (886:64894) ---------- */

function PrinterList({
  printers,
  defaults,
  onOpen,
  onAdd,
  onRemove,
  onPatch,
  onNotice,
}: {
  printers: Printer[];
  defaults: PrintDefault[];
  onOpen: (p: Printer) => void;
  onAdd: () => void;
  onRemove: (p: Printer) => void;
  onPatch: (id: string, change: Partial<Printer>) => void;
  onNotice: (text: string) => void;
}) {
  const [status, setStatus] = useState<'all' | 'online' | 'offline'>('all');
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const usedFor = (p: Printer) => defaults.filter(d => d.printerId === p.id).map(d => d.document);
  const sizes = (p: Printer) => (p.labelSizes.length ? p.labelSizes.map(s => s.replace(' in', '')).join(', ') : '—');
  const t = useTableControls(printers, {
    search: p => `${p.name} ${p.area} ${p.type} ${connectionText(p)} ${usedFor(p).join(' ')}`,
    sortValue: (p, key) =>
      key === 'connection' ? connectionText(p) : key === 'sizes' ? sizes(p) : key === 'usedFor' ? usedFor(p).join() : key === 'status' ? (p.online ? 'Online' : 'Offline') : String(p[key as keyof Printer] ?? ''),
    filter: p => status === 'all' || (status === 'online') === p.online,
  });
  const online = printers.filter(p => p.online).length;

  return (
    <div className={styles.tab}>
      <div className={styles.toolbar} role="toolbar" aria-label="Printers">
        {/* The View ▾ filter the other record tables use (as Contacts) */}
        <Dropdown
          variant="small"
          label="View"
          hideLabel
          options={[
            { value: 'all', label: `All (${printers.length})` },
            { value: 'online', label: `Online (${online})` },
            { value: 'offline', label: `Offline (${printers.length - online})` },
          ]}
          value={status}
          onChange={v => {
            setStatus(v as typeof status);
            t.setPage(1);
          }}
          renderValue={sel => `View: ${sel[0]?.label ?? 'All'}`}
        />
        <SearchInput className={styles.toolbarSearch} aria-label="Search printers" placeholder="Search printers" value={t.query} onChange={e => t.setQuery(e.target.value)} />
        {/* Same as Add Carrier and Add Contact: Button Small Brand with the plus icon */}
        <Button size="small" variant="brand" icon="plus" onClick={onAdd}>
          Add Printer
        </Button>
      </div>
      <DataTable
        aria-label="Printers"
        columns={LIST_COLUMNS}
        rows={t.pageRows}
        rowLabel={printerLabel}
        sort={t.headerProps.sort}
        onSortChange={t.headerProps.onSortChange}
        inactive={p => !p.active}
        empty={<p className={`text-medium-regular ${styles.muted}`}>No printers match. Clear the search or choose All.</p>}
        onMore={p => setMenuFor(m => (m === p.id ? null : p.id))}
        renderAfterRow={p =>
          menuFor === p.id && (
            <RowMenu
              label={printerLabel(p)}
              onClose={() => setMenuFor(null)}
              items={[
                { label: 'View', onSelect: () => onOpen(p) },
                {
                  label: p.paused ? 'Resume Printing' : 'Pause Printing',
                  onSelect: () => {
                    onPatch(p.id, { paused: !p.paused });
                    onNotice(p.paused ? `${printerLabel(p)} is printing again.` : `${printerLabel(p)} is paused.`);
                  },
                },
                { label: 'Remove', onSelect: () => onRemove(p) },
              ]}
            />
          )
        }
        cells={p => ({
          name: (
            <button type="button" className={styles.nameButton} onClick={() => onOpen(p)}>
              {p.name}
            </button>
          ),
          area: p.area,
          type: p.type,
          connection: connectionText(p),
          sizes: sizes(p),
          usedFor: usedFor(p).length ? (
            <span className={styles.tags}>
              {usedFor(p).map(d => (
                <Badge key={d} shape="pill" color="blue">
                  {d}
                </Badge>
              ))}
            </span>
          ) : (
            <span className={styles.muted}>Not assigned</span>
          ),
          status: statusBadge(p),
        })}
      />
      <Pager table={t} label="Printers pages" />
    </div>
  );
}

/* ---------- Settings (911:5680) ---------- */

function PrinterSettings({
  warehouse,
  printers,
  agents,
  onSetUpAgent,
}: {
  warehouse: Warehouse;
  printers: Printer[];
  agents: PrintAgent[];
  onSetUpAgent: () => void;
}) {
  const settings = usePrintSettings(warehouse.code);
  const warehouses = useWarehouses();
  const set = (patch: Partial<typeof settings>) => setPrintSettings(warehouse.code, s => ({ ...s, ...patch }));
  const label = (code: string) => `${code} · ${warehouses.find(w => w.code === code)?.name ?? code}`;
  const count = (a: PrintAgent) => (a.warehouse === warehouse.code ? printers.filter(p => p.agentId === a.id).length : '—');

  return (
    <div className={styles.tab}>
      <section className={styles.panel} aria-labelledby="printing-defaults">
        <div className={styles.panelHead}>
          <h3 id="printing-defaults" className="text-large-bold">
            Printing Defaults
          </h3>
        </div>
        <div className={styles.settingsGrid}>
          <Dropdown label="Label language" options={options(LABEL_LANGUAGES)} value={settings.labelLanguage} onChange={v => set({ labelLanguage: v as string })} />
          <Dropdown label="Retry failed jobs" options={options(RETRIES)} value={settings.retry} onChange={v => set({ retry: v as string })} />
          <Dropdown label="Keep print job history" options={options(HISTORY)} value={settings.history} onChange={v => set({ history: v as string })} />
          <Dropdown label="When a printer goes offline, notify" options={options(NOTIFY)} value={settings.notify} onChange={v => set({ notify: v as string })} />
          <div className={`${styles.toggleRow} ${styles.wide}`}>
            <Toggle label="Fall back to the warehouse’s other printer of the same type" checked={settings.fallback} onChange={e => set({ fallback: e.target.checked })} />
          </div>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="print-agents">
        <div className={styles.panelHead}>
          <h3 id="print-agents" className="text-large-bold">
            Print Agents
          </h3>
          <Button size="small" variant="brand" onClick={onSetUpAgent}>
            Set Up Print Agent
          </Button>
        </div>
        <DataTable
          aria-label="Print agents"
          columns={AGENT_COLUMNS}
          rows={agents}
          rowLabel={a => a.computer}
          cells={a => ({
            computer: <strong>{a.computer}</strong>,
            warehouse: label(a.warehouse),
            version: a.version,
            printers: count(a),
            lastSeen: a.lastSeen,
            status: (
              <Badge shape="pill" color={a.status === 'online' ? 'green' : a.status === 'offline' ? 'red' : 'amber'}>
                {a.status === 'online' ? 'Online' : a.status === 'offline' ? 'Offline' : 'Update available'}
              </Badge>
            ),
          })}
        />
      </section>
    </div>
  );
}
