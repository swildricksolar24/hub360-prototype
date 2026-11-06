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
import { PickPackTab } from './record/PickPackTab';
import { StockTab } from './record/StockTab';
import { addressDraftOf, addressErrors, addressFromDraft } from './AddressFields';
import type { Warehouse } from './warehouseData';
import { recordPath, setWarehouses, useWarehouses } from './warehouseStore';
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
const toDraft = (w: Warehouse): DetailsDraft => ({ name: w.name, ...addressDraftOf(w) });

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
  const [notice, setNotice] = useState<string | null>(null);
  const [statusChange, setStatusChange] = useState<boolean | null>(null);
  // The dialog keeps showing Activate or Deactivate while it closes
  const shownActive = useRef(false);
  if (statusChange !== null) shownActive.current = statusChange;
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);

  // A different warehouse (previous / next) starts from its own saved details
  useEffect(() => {
    setDraft(warehouse ? toDraft(warehouse) : null);
    setErrors({});
    setNotice(null);
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
              ...addressFromDraft(draft),
            }
          : x,
      ),
    );
    setNotice(`${draft.name.trim()} was saved.`);
  }

  // Previous / next warehouse in the list's order, on the same tab, reusing this app tab
  const go = (to: Warehouse | undefined) => (to ? () => navigate(recordPath(to, tab), { state: { replaceTab: true } }) : undefined);

  const notices: ReactNode = notice && <Toast type="success" title={notice} onClose={() => setNotice(null)} />;
  const content: Record<string, ReactNode> = {
    details: (
      <DetailsTab code={w.code} draft={draft} errors={errors} onDraftChange={setDraft} onNotice={setNotice} />
    ),
    contacts: <ContactsTab code={w.code} onNotice={setNotice} />,
    'pick-pack': <PickPackTab warehouse={w} onNotice={setNotice} />,
    // Printers has no Figma design: it keeps RecordPage's "not built yet" placeholder
    locations: <LocationsTab code={w.code} onNotice={setNotice} />,
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
        meta={
          <>
            SYSTEM ID: <strong>{w.code}</strong>
          </>
        }
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
            onSave={save}
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
