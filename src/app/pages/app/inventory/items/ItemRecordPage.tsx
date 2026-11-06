import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Chip } from '../../../../../components/Chip/Chip';
import { Icon } from '../../../../../components/Icon/Icon';
import { Message } from '../../../../../components/Message/Message';
import { AppLink } from '../../../../components/AppLink';
import { AppModal } from '../../../../components/AppModal';
import { RecordActions, RecordPage } from '../../../../components/RecordPage';
import { TYPE_ICON, today, type Item, type ItemType } from './itemData';
import { deactivateItem, deleteItems, itemPath, LIST_PATH, mergeItems, numberLabel, setItems, updateItem, useItems } from './itemStore';
import { DeactivateItemModal, DeleteItemsModal, MergeItemsModal } from './ItemModals';
import { BuildTab } from './record/BuildTab';
import { DetailsTab, toDraft, type DetailsDraft, type DetailsErrors } from './record/DetailsTab';
import { FilesTab } from './record/FilesTab';
import { ProfileImageFlow } from './record/FileModals';
import { HistoryTab } from './record/HistoryTab';
import { UsedInTab } from './record/UsedInTab';
import { STOCK_COLUMN_OPTIONS, StockTable } from './StockTable';
import { Card } from './shared';
import record from '../record.module.css';
import styles from './items.module.css';
import { Toast } from '../../../../../components/Toast/Toast';

/** The record's tabs for each type (ITEMS.md "How the pieces relate"). */
const TABS: Record<ItemType, { id: string; label: string }[]> = {
  Part: [
    { id: 'details', label: 'Details' },
    { id: 'files', label: 'Files' },
    { id: 'assemblies', label: 'Assemblies' },
    { id: 'kits', label: 'Kits' },
    { id: 'stock', label: 'Stock' },
    { id: 'history', label: 'History' },
  ],
  Assembly: [
    { id: 'details', label: 'Details' },
    { id: 'build', label: 'Build' },
    { id: 'files', label: 'Files' },
    { id: 'kits', label: 'Kits' },
    { id: 'stock', label: 'Stock' },
    { id: 'history', label: 'History' },
  ],
  Kit: [
    { id: 'details', label: 'Details' },
    { id: 'build', label: 'Build' },
    { id: 'files', label: 'Files' },
    { id: 'stock', label: 'Stock' },
    { id: 'history', label: 'History' },
  ],
};

/** The record's Stock tab leaves out Item # and Description: every row is this item, named in the header. */
const RECORD_STOCK_COLUMNS = STOCK_COLUMN_OPTIONS.map(c => c.key).filter(k => k !== 'number' && k !== 'description');

const PLURAL: Record<ItemType, string> = { Part: 'Parts', Assembly: 'Assemblies', Kit: 'Kits' };

/**
 * Inventory › Items › one Part, Assembly or Kit (ITEMS.md §2–7): the Figma Tier 3 header with the type's tabs. The
 * tab is in the URL (?tab=build), so it survives the app's tab switching without opening a new tab.
 */
export function ItemRecordPage() {
  const { itemId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const items = useItems();
  const index = items.findIndex(i => i.id === itemId);
  const item: Item | undefined = items[index];
  const tabs = item ? TABS[item.type] : [];
  const tab = tabs.find(t => t.id === params.get('tab'))?.id ?? 'details';

  const [draft, setDraft] = useState<DetailsDraft | null>(null);
  const [errors, setErrors] = useState<DetailsErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [popups, setPopups] = useState<string[]>([]);
  const [activating, setActivating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [merging, setMerging] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  // A different item (previous / next) starts from its own saved details; its pop-up notes show once
  useEffect(() => {
    setDraft(item ? toDraft(item) : null);
    setErrors({});
    setNotice((state as { notice?: string } | null)?.notice ?? null);
    setPopups(item ? item.notes.filter(n => n.popup).map(n => n.id) : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  if (!item || !draft) {
    return (
      <div className={record.notFound}>
        <Icon name="part" size={32} />
        <p className="text-large-bold">Item not found</p>
        <p className="text-medium-regular">
          There’s no part, assembly or kit with the system # “{itemId}”. <AppLink to={LIST_PATH}>Back to Items</AppLink>
        </p>
      </div>
    );
  }
  const it = item;
  const word = it.type;

  function save() {
    if (!draft) return;
    if (!draft.name.trim()) {
      setErrors({ name: `Enter the ${word.toLowerCase()} name` });
      setParams({}, { replace: true });
      return;
    }
    setErrors({});
    updateItem(it.id, i => ({ ...i, ...draft, name: draft.name.trim(), customNumber: draft.customNumber.trim(), modified: today() }));
    setNotice(`${draft.name.trim()} was saved.`);
  }

  // Previous / next item in the list's order, on the same tab when the type has it, reusing this app tab
  const go = (to: Item | undefined) =>
    to ? () => navigate(itemPath(to.id, TABS[to.type].some(t => t.id === tab) ? tab : undefined), { state: { replaceTab: true } }) : undefined;

  const pinnedPopups = it.notes.filter(n => popups.includes(n.id));
  const notices: ReactNode = (
    <>
      {pinnedPopups.map(n => (
        <Message key={n.id} type="info" title={`Note from ${n.author}`} body={n.text} onClose={() => setPopups(p => p.filter(id => id !== n.id))} />
      ))}
      {notice && <Toast type="success" title={notice} onClose={() => setNotice(null)} />}
    </>
  );
  const content: Record<string, ReactNode> = {
    details: <DetailsTab item={it} draft={draft} errors={errors} onDraftChange={setDraft} onNotice={setNotice} />,
    build: <BuildTab item={it} onNotice={setNotice} />,
    files: <FilesTab item={it} onNotice={setNotice} />,
    assemblies: <UsedInTab item={it} kind="Assembly" onNotice={setNotice} />,
    kits: <UsedInTab item={it} kind="Kit" onNotice={setNotice} />,
    stock: (
      <Card id={`Stock for ${it.name}`}>
        <StockTable lines={it.stock.map(stock => ({ item: it, stock }))} columns={RECORD_STOCK_COLUMNS} label={`Stock for ${it.name}`} />
      </Card>
    ),
    history: <HistoryTab item={it} />,
  };

  return (
    <>
      <RecordPage
        title={it.name.toUpperCase()}
        icon={TYPE_ICON[word]}
        onViewPhoto={() => setPhotoOpen(true)}
        breadcrumb={[{ label: 'Inventory' }, { label: 'Items', to: LIST_PATH }, { label: it.name }]}
        tag={
          <Chip variant="tiny" tabIndex={-1}>
            {word}
          </Chip>
        }
        labels={[
          { label: numberLabel(word).toUpperCase(), value: it.id },
          { label: 'CATEGORY', value: it.category || '—' },
          { label: 'SUBCATEGORY', value: it.subcategory || '—' },
        ]}
        meta={`Last Modified: ${it.modified}`}
        actions={
          <RecordActions
            active={it.active}
            onActiveChange={on => (on ? setActivating(true) : setDeactivating(true))}
            options={[
              it.active ? { value: 'deactivate', label: 'Deactivate' } : { value: 'activate', label: 'Activate' },
              { value: 'merge', label: 'Merge' },
              { value: 'delete', label: 'Delete' },
            ]}
            onAction={value => {
              if (value === 'activate') setActivating(true);
              else if (value === 'deactivate') setDeactivating(true);
              else if (value === 'merge') setMerging(true);
              else if (value === 'delete') setDeleting(true);
            }}
            onSave={save}
            onPrevious={go(items[index - 1])}
            onNext={go(items[index + 1])}
          />
        }
        sections={tabs.map(t => ({
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

      <AppModal
        open={activating}
        onClose={() => setActivating(false)}
        title="Confirm Activation"
        description={
          <>
            You are about to <strong className={styles.warning}>ACTIVATE</strong> {it.name}. This change will take effect immediately. Do you want to
            continue?
          </>
        }
        primaryAction={{
          label: 'Confirm',
          onClick: () => {
            setItems(list => list.map(x => (x.id === it.id ? { ...x, active: true } : x)));
            setNotice(`${it.name} activated.`);
            setActivating(false);
          },
        }}
      />

      <DeactivateItemModal
        item={deactivating ? it : null}
        all={items}
        onClose={() => setDeactivating(false)}
        onConfirm={(how, replacementId) => {
          deactivateItem(it.id, how, replacementId);
          const what =
            how === 'replace' ? ' and replaced in its assemblies and kits' : how === 'deactivate' ? ' with the assemblies and kits that use it' : how === 'remove' ? ' and removed from its assemblies and kits' : '';
          setNotice(`${it.name} deactivated${what}.`);
          setDeactivating(false);
        }}
      />

      <MergeItemsModal
        open={merging}
        sources={[it]}
        all={items}
        noun={PLURAL[word]}
        onClose={() => setMerging(false)}
        onMerge={target => {
          mergeItems([it.id], target.id);
          setMerging(false);
          navigate(itemPath(target.id), { state: { replaceTab: true, notice: `${it.name} was merged into ${target.name}.` } });
        }}
      />

      <DeleteItemsModal
        open={deleting}
        items={[it]}
        noun={word}
        onClose={() => setDeleting(false)}
        onConfirm={() => {
          setDeleting(false);
          navigate(LIST_PATH, { state: { replaceTab: true } });
          deleteItems([it.id]);
        }}
      />

      <ProfileImageFlow open={photoOpen} item={it} onClose={() => setPhotoOpen(false)} onNotice={setNotice} />
    </>
  );
}
