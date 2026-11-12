import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '../../../../components/Icon/Icon';
import { AppLink } from '../../../components/AppLink';
import { AppModal } from '../../../components/AppModal';
import { RecordActions, RecordPage } from '../../../components/RecordPage';
import { ContactsTab } from './record/ContactsTab';
import { DetailsTab, type DetailsDraft, type DetailsErrors } from './record/DetailsTab';
import { HistoryTab } from './record/HistoryTab';
import { ItemsTab } from './record/ItemsTab';
import { LocationsTab } from './record/LocationsTab';
import { EditBanner, countChanges } from './record/EditBanner';
import { PickPackTab, commitError, emailError } from './record/PickPackTab';
import { changeCount, type PrinterDraft } from './record/PrinterDetails';
import { PrintersTab } from './record/PrintersTab';
import { StockTab } from './record/StockTab';
import { addressDraftOf, addressErrors, addressFromDraft } from './AddressFields';
import type { Warehouse } from './warehouseData';
import type { PickPackSettings } from './warehouseRecordData';
import { recordPath, setPickPack, setPrintDefaults, setPrinters, setWarehouses, usePickPack, usePrintDefaults, usePrinters, useWarehouses } from './warehouseStore';
import { WarehouseStatusModal, applyWarehouseStatus } from './WarehouseStatusModal';
import { useAuth } from '../../../auth/AuthContext';
import styles from './record.module.css';
import { Toast } from '../../../../components/Toast/Toast';

/** The record's tabs, in Figma's order. Tabs without content show RecordPage's "not built yet" placeholder. */
const TABS = [
  { id: 'details', label: 'Details' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'pick-pack', label: 'Pick / Pack' },
  { id: 'printers', label: 'Printers' },
  { id: 'locations', label: 'Locations' },
  { id: 'items', label: 'Items' },
  { id: 'stock', label: 'Stock' },
  { id: 'history', label: 'History' },
];

const LIST_PATH = '/app/inventory/warehouses';
const toDraft = (w: Warehouse): DetailsDraft => ({ name: w.name, timeZone: w.timeZone ?? '', ...addressDraftOf(w) });

/**
 * Inventory › Warehouses › one warehouse (see WAREHOUSE_RECORD.md): the Figma Tier 3 header with the warehouse's
 * tabs. The tab is in the URL (?tab=contacts), so it survives the app's tab switching without opening a new tab.
 */
export function WarehouseRecordPage() {
  const { code = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const warehouses = useWarehouses();
  const index = warehouses.findIndex(w => w.code === code);
  const warehouse: Warehouse | undefined = warehouses[index];
  const tab = TABS.find(t => t.id === params.get('tab'))?.id ?? 'details';

  const [draft, setDraft] = useState<DetailsDraft | null>(null);
  const [errors, setErrors] = useState<DetailsErrors>({});
  // Figma 18:11145: Warehouse Details is read-only until the header's Edit
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [statusChange, setStatusChange] = useState<boolean | null>(null);
  // The dialog keeps showing Activate or Deactivate while it closes
  const shownActive = useRef(false);
  if (statusChange !== null) shownActive.current = statusChange;
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);

  // Printers › one printer: the header's Edit edits its settings and default use; a banner above the header saves them
  const printers = usePrinters(code);
  const printDefaults = usePrintDefaults(code);
  const openPrinter = tab === 'printers' ? printers.find(p => p.id === params.get('printer')) : undefined;
  const [printerDraft, setPrinterDraft] = useState<PrinterDraft | null>(null);
  // Pick / Pack (Figma 899:3331): read-only until the header's Edit; the same banner saves it
  const pickPack = usePickPack(code);
  const [pickPackDraft, setPickPackDraft] = useState<PickPackSettings | null>(null);
  useEffect(() => setPickPackDraft(null), [code]);
  useEffect(() => setPrinterDraft(null), [code, openPrinter?.id]);

  // A different warehouse (previous / next) starts from its own saved details
  useEffect(() => {
    setDraft(warehouse ? toDraft(warehouse) : null);
    setErrors({});
    setNotice(null);
    setEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (!warehouse || !draft) {
    return (
      <div className={styles.notFound}>
        <Icon name="warehouse" size={32} />
        <p className="text-large-bold">Warehouse not found</p>
        <p className="text-medium-regular">
          There’s no warehouse with the system ID “{code}”. <AppLink to={LIST_PATH}>Back to Warehouses</AppLink>
        </p>
      </div>
    );
  }
  const w = warehouse;

  function save() {
    if (!draft) return;
    const problems = { ...(draft.name.trim() ? {} : { name: 'Enter a warehouse name' }), ...addressErrors(draft) };
    if (Object.keys(problems).length) {
      setErrors(problems);
      setParams({}, { replace: true });
      return;
    }
    setErrors({});
    setWarehouses(list =>
      list.map(x =>
        x.code === w.code
          ? {
              ...x,
              name: draft.name.trim(),
              timeZone: draft.timeZone || undefined,
              ...addressFromDraft(draft),
            }
          : x,
      ),
    );
    setEditing(false);
    setNotice(`${draft.name.trim()} was saved.`);
  }

  function savePrinter() {
    if (!printerDraft || !openPrinter) return;
    const p = printerDraft.printer;
    // Errors show on the Settings view's fields
    if (!p.name.trim() || (p.connection === 'network' && !/^(\d{1,3}\.){3}\d{1,3}$/.test(p.ip ?? ''))) {
      setParams({ tab: 'printers', printer: openPrinter.id }, { replace: true });
      return;
    }
    setPrinters(code, list => list.map(x => (x.id === p.id ? { ...p, name: p.name.trim() } : x)));
    setPrintDefaults(code, () => printerDraft.defaults);
    setPrinterDraft(null);
    setNotice(`${p.name.trim()} · ${p.area} was saved.`);
  }

  function savePickPack() {
    if (!pickPackDraft) return;
    // Errors show on the fields; switch back to Pick / Pack if the user moved away
    if (commitError(pickPackDraft) || emailError(pickPackDraft.exceptionsEmail) || emailError(pickPackDraft.packedEmail)) {
      setParams({ tab: 'pick-pack' }, { replace: true });
      return;
    }
    setPickPack(code, () => ({ ...pickPackDraft, exceptionsEmail: pickPackDraft.exceptionsEmail.trim(), packedEmail: pickPackDraft.packedEmail.trim() }));
    setPickPackDraft(null);
    setNotice(`${w.name}’s Pick / Pack settings were saved.`);
  }

  function startEditing() {
    setEditing(true);
    setParams({}, { replace: true });
  }

  function cancelEditing() {
    setDraft(toDraft(w));
    setErrors({});
    setEditing(false);
  }

  // Previous / next warehouse in the list's order, on the same tab, reusing this app tab
  const go = (to: Warehouse | undefined) => (to ? () => navigate(recordPath(to, tab), { state: { replaceTab: true } }) : undefined);

  const notices: ReactNode = notice && <Toast type="success" title={notice} onClose={() => setNotice(null)} />;
  const content: Record<string, ReactNode> = {
    details: (
      <DetailsTab
        warehouse={w}
        editing={editing}
        draft={draft}
        errors={errors}
        onDraftChange={setDraft}
        onNotice={setNotice}
        onOpenTab={id => setParams({ tab: id }, { replace: true })}
      />
    ),
    contacts: <ContactsTab code={w.code} warehouseName={w.name} onNotice={setNotice} />,
    'pick-pack': <PickPackTab warehouse={w} draft={pickPackDraft} onDraftChange={setPickPackDraft} onNotice={setNotice} />,
    // Figma: the Printers screens sit on one white card under the header, reaching the bottom of the page (as Contacts)
    printers: (
      <div className={`${styles.card} ${styles.fillTab}`}>
        <PrintersTab warehouse={w} onNotice={setNotice} draft={printerDraft} onDraftChange={setPrinterDraft} />
      </div>
    ),
    locations: <LocationsTab code={w.code} warehouseName={w.name} onNotice={setNotice} />,
    items: <ItemsTab code={w.code} onNotice={setNotice} />,
    stock: <StockTab code={w.code} onNotice={setNotice} />,
    history: <HistoryTab code={w.code} />,
  };

  return (
    <>
      <RecordPage
        title={w.name.toUpperCase()}
        icon="warehouse"
        breadcrumb={[{ label: 'Inventory' }, { label: 'Warehouses', to: LIST_PATH }, { label: w.name }]}
        // Figma: a Tier 3 Label under the title
        labels={[{ label: 'ID', value: w.code }]}
        actions={
          <RecordActions
            active={w.active}
            onActiveChange={on => setStatusChange(on)}
            options={[
              // Both, with the one matching the current status disabled
              { value: 'activate', label: 'Activate', disabled: w.active },
              { value: 'deactivate', label: 'Deactivate', disabled: !w.active },
              { value: 'export', label: 'Export' },
              { value: 'delete', label: 'Delete' },
            ]}
            onAction={value => {
              if (value === 'activate' || value === 'deactivate') setStatusChange(value === 'activate');
              else if (value === 'export') setNotice(`Exported ${w.name} to CSV.`);
              else if (value === 'delete') setDeleting(true);
            }}
            // Edit opens the Warehouse Details form; while editing the button saves it, with Cancel beside it
            {...(tab === 'printers'
              ? // Printers: the list has no Edit (Figma 886:64894); a printer's Edit opens its settings for editing
                openPrinter
                ? { saveLabel: 'Edit', saveDisabled: printerDraft !== null, onSave: () => setPrinterDraft({ printer: { ...openPrinter }, defaults: printDefaults.map(d => ({ ...d })) }) }
                : { hideSave: true }
              : tab === 'pick-pack'
                ? // Pick / Pack: Edit opens the settings; the banner saves them, so Edit stays off meanwhile
                  { saveLabel: 'Edit', saveDisabled: pickPackDraft !== null, onSave: () => setPickPackDraft({ ...pickPack, rules: { ...pickPack.rules } }) }
                : { saveLabel: editing ? 'Save' : 'Edit', onSave: editing ? save : startEditing, onCancel: editing ? cancelEditing : undefined })}
            onPrevious={go(warehouses[index - 1])}
            onNext={go(warehouses[index + 1])}
          />
        }
        sections={TABS.map(t => ({
          ...t,
          content: content[t.id] && (
            <>
              {notices}
              {content[t.id]}
            </>
          ),
        }))}
        banner={
          tab === 'pick-pack' && pickPackDraft ? (
            <EditBanner what="Warehouse Pick / Pack Settings" changes={countChanges(pickPackDraft, pickPack)} onDiscard={() => setPickPackDraft(null)} onSave={savePickPack} />
          ) : printerDraft && openPrinter ? (
            <EditBanner what="Warehouse Printer Settings" changes={changeCount(printerDraft, openPrinter, printDefaults)} onDiscard={() => setPrinterDraft(null)} onSave={savePrinter} />
          ) : undefined
        }
        section={tab}
        onSectionChange={id => setParams(id === 'details' ? {} : { tab: id }, { replace: true })}
      />

      {/* Header Active toggle / Actions: Figma "Activation" (843:60109) and "Deactivate Warehouse — Improved" (843:60078) */}
      <WarehouseStatusModal
        open={statusChange !== null}
        warehouses={[w]}
        active={shownActive.current}
        onRecord
        onClose={() => setStatusChange(null)}
        onConfirm={(note, options) => {
          setNotice(applyWarehouseStatus([w], statusChange === true, note, options, user?.name ?? 'You'));
          setStatusChange(null);
        }}
      />

      <AppModal
        open={deleting}
        onClose={() => setDeleting(false)}
        title="Delete warehouse?"
        description={`${w.name} (${w.code}) will be removed. This action cannot be undone.`}
        primaryAction={{
          label: 'Delete Warehouse',
          danger: true,
          onClick: () => {
            setDeleting(false);
            navigate(LIST_PATH, { state: { replaceTab: true } });
            setWarehouses(list => list.filter(x => x.code !== w.code));
          },
        }}
      />
    </>
  );
}
