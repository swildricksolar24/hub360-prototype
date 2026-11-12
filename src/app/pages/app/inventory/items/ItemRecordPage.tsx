import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Chip } from '../../../../../components/Chip/Chip';
import { Icon } from '../../../../../components/Icon/Icon';
import { Message } from '../../../../../components/Message/Message';
import { AppLink } from '../../../../components/AppLink';
import { AppModal } from '../../../../components/AppModal';
import { RecordActions, RecordPage } from '../../../../components/RecordPage';
import { useHelperFlag } from '../../../../shell/helperFlags';
import { HelperToggle, PrototypeHelper } from '../../../../shell/PrototypeHelper';
import { SPEC_TEMPLATES, TYPE_ICON, today, type Item, type ItemType, type Note } from './itemData';
import { deactivateItem, deleteItems, itemPath, LIST_PATH, numberLabel, setItems, updateItem, useItems } from './itemStore';
import { DeactivateItemModal, DeleteItemsModal } from './ItemModals';
import { BuildTab } from './record/BuildTab';
import { DetailsTab, toDraft, unsavedChanges, withBarcodes, type DetailsDraft, type DetailsErrors } from './record/DetailsTab';
import { EditBanner } from '../record/EditBanner';
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

/** The record's Stock tab leaves out Item and Category: every row is this item, named in the header. */
const RECORD_STOCK_COLUMNS = STOCK_COLUMN_OPTIONS.map(c => c.key).filter(k => k !== 'item' && k !== 'category');

const PLURAL: Record<ItemType, string> = { Part: 'Parts', Assembly: 'Assemblies', Kit: 'Kits' };

/** The Helper's "Pop-up note": the item's first note as a pop-up, or a sample one when it has no notes. */
const helperPopupNote = (item: Item): Note => ({
  ...(item.notes[0] ?? {
    id: `${item.id}-helper-note`,
    author: 'Orson Krennic',
    updated: today(),
    text: `Count the ${item.name} on hand before the next pick: the last cycle count was 6 units short.`,
    pinMe: false,
    pinAll: false,
    types: ['Warehouse'],
  }),
  popup: true,
});

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
  const [deleting, setDeleting] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const popupNote = useHelperFlag('item.popupNote');
  const noNotes = useHelperFlag('item.noNotes');
  const [helperNoteClosed, setHelperNoteClosed] = useState(false);

  // A different item (previous / next) starts from its own saved details; its pop-up notes show once
  useEffect(() => {
    setDraft(item ? toDraft(item) : null);
    setErrors({});
    setNotice((state as { notice?: string } | null)?.notice ?? null);
    setPopups(item ? item.notes.filter(n => n.popup).map(n => n.id) : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);
  // The Helper's pop-up note shows again each time its switch is turned on, and on each item
  useEffect(() => setHelperNoteClosed(false), [popupNote, itemId]);

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
    // Required on Details: the name, the category and any required category spec (Solar Panels: Power output)
    const missing: DetailsErrors = {
      name: draft.name.trim() ? undefined : `Enter the ${word.toLowerCase()} name`,
      category: draft.category ? undefined : 'Choose a category',
      powerOutput: SPEC_TEMPLATES[draft.category]?.flat().some(f => f.key === 'powerOutput') && !draft.categorySpecs.powerOutput?.trim() ? 'Enter the power output' : undefined,
    };
    if (missing.name || missing.category || missing.powerOutput) {
      setErrors(missing);
      setParams({}, { replace: true });
      return;
    }
    setErrors({});
    const ready = withBarcodes(draft);
    updateItem(it.id, i => ({ ...i, ...ready, name: draft.name.trim(), customNumber: draft.customNumber.trim(), modified: today() }));
    setDraft({ ...ready, name: draft.name.trim(), customNumber: draft.customNumber.trim() });
    setNotice(`${draft.name.trim()} was saved.`);
  }
  // Figma "Editing Banner": shown while Details has unsaved changes
  const changes = unsavedChanges(draft, it);

  // Previous / next item in the list's order, on the same tab when the type has it, reusing this app tab
  const go = (to: Item | undefined) =>
    to ? () => navigate(itemPath(to.id, TABS[to.type].some(t => t.id === tab) ? tab : undefined), { state: { replaceTab: true } }) : undefined;

  const savedPopups = it.notes.filter(n => popups.includes(n.id));
  // Helper switches: "Pop-up note" adds the first (or a sample) note as a pop-up; "No notes" hides every pop-up
  const helperNote = popupNote && !helperNoteClosed ? helperPopupNote(it) : null;
  const pinnedPopups = noNotes ? [] : helperNote && !popups.includes(helperNote.id) ? [helperNote, ...savedPopups] : savedPopups;
  const closePopup = (n: Note) => {
    if (n.id === helperNote?.id) setHelperNoteClosed(true);
    setPopups(p => p.filter(id => id !== n.id));
  };
  const notices: ReactNode = (
    <>
      {pinnedPopups.map(n => (
        <Message key={n.id} type="info" title={`Note from ${n.author}`} body={n.text} onClose={() => closePopup(n)} />
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
        <StockTable lines={it.stock.map(stock => ({ item: it, stock }))} columns={RECORD_STOCK_COLUMNS} label={`Stock for ${it.name}`} totals />
      </Card>
    ),
    history: <HistoryTab item={it} />,
  };

  return (
    <>
      <PrototypeHelper title="Item">
        <HelperToggle flag="item.popupNote" label="Pop-up note" />
        <HelperToggle flag="item.noNotes" label="No notes" />
        <HelperToggle flag="item.inactiveReplacement" label="Inactive replacement" />
      </PrototypeHelper>

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
              // No Merge here: items are merged from the Items list (Actions › Merge, two or more checked)
              { value: 'delete', label: 'Delete' },
            ]}
            onAction={value => {
              if (value === 'activate') setActivating(true);
              else if (value === 'deactivate') setDeactivating(true);
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
        banner={
          changes > 0 ? (
            <EditBanner
              what={it.name}
              changes={changes}
              onDiscard={() => {
                setDraft(toDraft(it));
                setErrors({});
              }}
              onSave={save}
            />
          ) : undefined
        }
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
