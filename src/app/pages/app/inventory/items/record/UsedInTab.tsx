import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../../../components/Button/Button';
import { DataHeader, type DataColumn, type DataSort } from '../../../../../../components/DataHeader/DataHeader';
import { DataRow } from '../../../../../../components/DataRow/DataRow';
import { Dropdown } from '../../../../../../components/Dropdown/Dropdown';
import { Icon } from '../../../../../../components/Icon/Icon';
import { SearchInput } from '../../../../../../components/SearchBar/SearchBar';
import { TextArea } from '../../../../../../components/TextArea/TextArea';
import { TextInput } from '../../../../../../components/TextInput/TextInput';
import { AppModal } from '../../../../../components/AppModal';
import { RowMenu } from '../../record/RowMenu';
import { blankItem, CATEGORIES, money, TYPE_DESCRIPTION, type BuildLine, type Item, type ItemType } from '../itemData';
import { buildCandidates, itemPath, setItems, unitCostOf, updateItem, usedIn, useItems } from '../itemStore';
import { ColumnsModal, ItemPicker, nextSort, options, required, requiredNote, sortRows, StatusPill, useSelection } from '../shared';
import { BuildTable, buildTotal } from './BuildTab';
import record from '../../record.module.css';
import table from '../../table.module.css';
import styles from '../items.module.css';

type Kind = Extract<ItemType, 'Assembly' | 'Kit'>;

const columnsFor = (kind: Kind): DataColumn[] => [
  { key: 'number', label: `${kind} #`, width: 170 },
  { key: 'name', label: 'Name', width: 'fill' },
  { key: 'category', label: 'Category', width: 150 },
  { key: 'subcategory', label: 'Sub Category', width: 160 },
];
// Figma: the status pill has no header, and sits right before the ••• button
const STATUS_COLUMN: DataColumn = { key: 'status', label: 'Status', width: 110, align: 'end', labelHidden: true, sortable: false };

const VIEWS: { value: string; label: string; test: (i: Item) => boolean }[] = [
  { value: 'all', label: 'All', test: () => true },
  { value: 'active', label: 'Active', test: i => i.active },
  { value: 'inactive', label: 'Inactive', test: i => !i.active },
];

const cellValue = (i: Item, key: string) =>
  key === 'number' ? i.id : key === 'status' ? (i.active ? 1 : 0) : String(i[key as 'name' | 'category' | 'subcategory'] ?? '');

const PLURAL: Record<Kind, string> = { Assembly: 'assemblies', Kit: 'kits' };

/**
 * Part record › Assemblies and Kits (ITEMS.md §4; Figma 629:74896, 636:20618), and an Assembly's Kits tab: the
 * assemblies or kits whose build uses this item. A name opens View Assembly / View Kit; Add Assembly / Add Kit starts
 * a new one with this item already in its build.
 */
export function UsedInTab({ item, kind, onNotice }: { item: Item; kind: Kind; onNotice: (text: string) => void }) {
  const all = useItems();
  const navigate = useNavigate();
  const columnsAll = columnsFor(kind);
  const [view, setView] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<DataSort | undefined>();
  const [columns, setColumns] = useState(columnsAll.map(c => c.key));
  const [columnsOpen, setColumnsOpen] = useState(false);
  const sel = useSelection();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState<Item | null>(null);
  const [removing, setRemoving] = useState<Item[] | null>(null);
  const plural = PLURAL[kind];
  const lower = kind.toLowerCase();

  // A different item or tab starts with a clean selection
  useEffect(() => {
    sel.clear();
    setQuery('');
    setView('all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, kind]);

  const users = usedIn(item.id, all).filter(i => i.type === kind);
  const q = query.trim().toLowerCase();
  const test = VIEWS.find(v => v.value === view)?.test ?? (() => true);
  const rows = sortRows(
    users.filter(i => test(i) && (!q || `${i.id} ${i.customNumber} ${i.name} ${i.category} ${i.subcategory}`.toLowerCase().includes(q))),
    sort,
    cellValue,
  );
  const selected = users.filter(i => sel.selected.has(i.id));
  const tableColumns = [...columnsAll.filter(c => columns.includes(c.key)), STATUS_COLUMN];
  const quantityIn = (u: Item) => u.build.find(l => l.itemId === item.id)?.quantity ?? 0;

  function setActive(list: Item[], active: boolean) {
    const ids = list.map(i => i.id);
    setItems(items => items.map(i => (ids.includes(i.id) ? { ...i, active } : i)));
    onNotice(`${list.length === 1 ? list[0].name : `${list.length} ${plural}`} ${active ? 'activated' : 'deactivated'}.`);
  }

  return (
    <div className={record.tab}>
      <section className={record.card} aria-label={kind === 'Assembly' ? 'Assemblies' : 'Kits'}>
        <div className={styles.toolbar} data-inset role="toolbar" aria-label={kind === 'Assembly' ? 'Assemblies' : 'Kits'}>
          <Dropdown
            variant="small"
            label="View"
            hideLabel
            options={VIEWS.map(v => ({ value: v.value, label: v.label }))}
            value={view}
            onChange={v => setView(v as string)}
            renderValue={s => `View: ${s[0]?.label ?? 'All'}`}
          />
          <Button size="small" variant="primary" icon="view-column" onClick={() => setColumnsOpen(true)}>
            Columns
          </Button>
          <Dropdown
            variant="small"
            label="Actions"
            hideLabel
            placeholder="Actions"
            options={[
              { value: 'activate', label: 'Activate', disabled: selected.length === 0 },
              { value: 'deactivate', label: 'Deactivate', disabled: selected.length === 0 },
              { value: 'remove', label: `Remove ${item.type}`, disabled: selected.length === 0 },
              { value: 'export', label: 'Export to CSV' },
            ]}
            value={null}
            onChange={v => {
              if (v === 'activate') setActive(selected, true);
              if (v === 'deactivate') setActive(selected, false);
              if (v === 'remove') setRemoving(selected);
              if (v === 'export') onNotice(`Exported ${rows.length} ${plural} to CSV.`);
            }}
            renderValue={() => (selected.length ? `Actions (${selected.length})` : 'Actions')}
          />
          <SearchInput className={styles.search} aria-label={`Search ${plural}`} placeholder="Search" value={query} onChange={e => setQuery(e.target.value)} />
          <Button size="small" variant="brand" icon="plus" onClick={() => setAdding(true)}>
            Add {kind}
          </Button>
        </div>

        <div className={table.tableScroll}>
          <div role="table" aria-label={`${kind === 'Assembly' ? 'Assemblies' : 'Kits'} that use ${item.name}`} className={table.table}>
            <DataHeader
              className={table.head}
              corners="none"
              columns={tableColumns}
              leading="checkbox"
              sort={sort}
              onSortChange={k => setSort(nextSort(k))}
              allSelected={rows.length > 0 && rows.every(i => sel.selected.has(i.id))}
              onSelectAllChange={on => sel.setMany(rows.map(i => i.id), on)}
            />
            {rows.length === 0 && (
              <div role="row" className={styles.empty}>
                <div role="cell" className={styles.emptyCell}>
                  <Icon name={users.length ? 'search' : kind === 'Assembly' ? 'settings' : 'archive'} size={32} />
                  <p className="text-large-bold">{users.length ? `No ${plural} match your search` : `${item.name} isn’t in any ${plural} yet`}</p>
                  <p className="text-medium-regular">{users.length ? 'Try a different word, or clear the search and view.' : `Add ${kind === 'Assembly' ? 'an assembly' : 'a kit'} that’s built with it.`}</p>
                  {users.length ? (
                    <Button
                      size="small"
                      variant="outline"
                      onClick={() => {
                        setQuery('');
                        setView('all');
                      }}
                    >
                      Clear search and view
                    </Button>
                  ) : (
                    <Button size="small" variant="brand" icon="plus" onClick={() => setAdding(true)}>
                      Add {kind}
                    </Button>
                  )}
                </div>
              </div>
            )}
            {rows.map((u, i) => {
              const open = (
                <button type="button" className={record.cellLink} onClick={() => setViewing(u)}>
                  {u.name}
                </button>
              );
              const cells: Record<string, ReactNode> = {
                number: (
                  <button type="button" className={record.cellLink} onClick={() => setViewing(u)} aria-label={`View ${u.name} (${u.id})`}>
                    {u.id}
                  </button>
                ),
                name: open,
                category: u.category || '—',
                subcategory: u.subcategory || '—',
                status: <StatusPill active={u.active} />,
              };
              return (
                <div key={u.id} className={table.rowWrap} data-stripe={i % 2 === 0 || undefined} data-inactive={!u.active || undefined}>
                  <DataRow
                    className={table.row}
                    columns={tableColumns}
                    leading="checkbox"
                    cells={cells}
                    selected={sel.selected.has(u.id)}
                    onSelectedChange={on => sel.toggle(u.id, on)}
                    selectLabel={`Select ${u.name}`}
                    moreLabel={`More actions for ${u.name}`}
                    onMore={() => setMenuFor(m => (m === u.id ? null : u.id))}
                  />
                  {menuFor === u.id && (
                    <RowMenu
                      label={u.name}
                      onClose={() => setMenuFor(null)}
                      items={[
                        { label: `View ${kind}`, icon: 'visibility', onSelect: () => setViewing(u) },
                        { label: `Go To ${kind}`, icon: 'arrow-right', onSelect: () => navigate(itemPath(u.id)) },
                        { label: u.active ? 'Deactivate' : 'Activate', icon: u.active ? 'visibility-off' : 'check', onSelect: () => setActive([u], !u.active) },
                        { label: `Remove ${item.type} (${quantityIn(u)})`, icon: 'delete', onSelect: () => setRemoving([u]) },
                      ]}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <AddBuildItemModal
        open={adding}
        kind={kind}
        seed={item}
        all={all}
        onClose={() => setAdding(false)}
        onCreate={created => {
          setItems(list => [created, ...list]);
          setAdding(false);
          onNotice(`${created.name} created with ${created.build.length} ${created.build.length === 1 ? 'item' : 'items'} in its build.`);
        }}
      />

      <ViewBuildItemModal
        target={viewing}
        all={all}
        onClose={() => setViewing(null)}
        onGo={target => {
          setViewing(null);
          navigate(itemPath(target.id));
        }}
      />

      <AppModal
        open={!!removing && removing.length > 0}
        variant="confirm"
        icon="delete"
        onClose={() => setRemoving(null)}
        title={`Remove ${item.type} From ${removing?.length === 1 ? kind : kind === 'Assembly' ? 'Assemblies' : 'Kits'}`}
        description={
          removing &&
          `${item.name} will be taken out of the build of ${removing.length === 1 ? removing[0].name : `${removing.length} ${plural}`}, and ${removing.length === 1 ? 'its' : 'their'} costs will change. The ${removing.length === 1 ? lower : plural} stay${removing.length === 1 ? 's' : ''} in Items.`
        }
        primaryAction={{
          label: `Remove ${item.type}`,
          danger: true,
          onClick: () => {
            const list = removing ?? [];
            list.forEach(u => updateItem(u.id, x => ({ ...x, build: x.build.filter(l => l.itemId !== item.id) })));
            list.forEach(u => sel.toggle(u.id, false));
            onNotice(`${item.name} removed from ${list.length === 1 ? list[0].name : `${list.length} ${plural}`}.`);
            setRemoving(null);
          },
        }}
      />

      <ColumnsModal
        open={columnsOpen}
        columns={columnsAll.map(c => ({ key: c.key, label: c.label, locked: c.key === 'number' || c.key === 'name' }))}
        visible={columns}
        onClose={() => setColumnsOpen(false)}
        onApply={keys => {
          setColumns(keys);
          setColumnsOpen(false);
        }}
      />
    </div>
  );
}

/* ---------- Add Assembly / Add Kit (full) ---------- */

/**
 * Add Assembly / Add Kit, the full version (ITEMS.md §4): custom #, category, subcategory, name and description, and
 * the build. The item the tab belongs to starts on the build; Create stays off until the build has items.
 */
export function AddBuildItemModal({
  open,
  kind,
  seed,
  all,
  onClose,
  onCreate,
}: {
  open: boolean;
  kind: Kind;
  /** An item that starts on the build (the record's own item). */
  seed?: Item;
  all: Item[];
  onClose: () => void;
  onCreate: (item: Item) => void;
}) {
  const [custom, setCustom] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<BuildLine[]>([]);
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (!open) return;
    setCustom('');
    setCategory('');
    setSubcategory('');
    setName('');
    setDescription('');
    setLines(seed && seed.type !== 'Kit' ? [{ itemId: seed.id, quantity: 1 }] : []);
    setTried(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seed?.id]);

  const errors = {
    name: !name.trim() ? `Enter the ${kind.toLowerCase()} name` : undefined,
    custom: custom.trim() && all.some(i => i.customNumber.toLowerCase() === custom.trim().toLowerCase()) ? `Another item already uses custom # ${custom.trim()}` : undefined,
    lines: lines.some(l => l.quantity < 1) ? 'Every item needs a quantity of at least 1' : undefined,
  };
  function create() {
    setTried(true);
    if (errors.name || errors.custom || errors.lines || lines.length === 0) return;
    onCreate(blankItem(kind, name.trim(), custom.trim(), { category, subcategory, description: description.trim(), build: lines }));
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      scrollable
      title={`Add ${kind}`}
      description={
        <>
          {TYPE_DESCRIPTION[kind]}
          <br />
          {requiredNote}
        </>
      }
      primaryAction={{ label: `Create ${kind}`, onClick: create, disabled: lines.length === 0 }}
    >
      <form
        className={record.form}
        noValidate
        onSubmit={e => {
          e.preventDefault();
          create();
        }}
      >
        <div className={record.halves}>
          <TextInput label={`Custom ${kind} #`} value={custom} onChange={e => setCustom(e.target.value)} error={tried ? errors.custom : undefined} autoComplete="off" />
          <TextInput label={required(`${kind} Name`)} value={name} onChange={e => setName(e.target.value)} error={tried ? errors.name : undefined} autoComplete="off" required autoFocus />
        </div>
        <div className={record.halves}>
          <Dropdown
            label="Category"
            placeholder="Select"
            options={options(Object.keys(CATEGORIES))}
            value={category || null}
            onChange={v => {
              const next = v as string;
              setCategory(next);
              if (!CATEGORIES[next]?.includes(subcategory)) setSubcategory('');
            }}
          />
          <Dropdown
            label="Subcategory"
            placeholder={category ? 'Select' : 'Choose a category first'}
            disabled={!category}
            options={options(CATEGORIES[category] ?? [])}
            value={subcategory || null}
            onChange={v => setSubcategory(v as string)}
          />
        </div>
        <TextArea label={`${kind} Description`} rows={3} value={description} onChange={e => setDescription(e.target.value)} />

        <div className={styles.modalSectionHead}>
          <h3 className={styles.subheading}>{kind} Build</h3>
          <span>
            {lines.length} {lines.length === 1 ? 'item' : 'items'} · Net Cost {money(buildTotal(lines, all))}
          </span>
        </div>
        <ItemPicker
          items={buildCandidates(null, lines, all)}
          label={`Search to Add Items in ${kind}`}
          placeholder={`Search to Add Items in ${kind}`}
          side={i => money(unitCostOf(i, all))}
          onPick={picked => setLines(list => [...list, { itemId: picked.id, quantity: 1 }])}
        />
        <BuildTable
          lines={lines}
          all={all}
          label={`New ${kind.toLowerCase()} build`}
          empty={`Search above to add the parts and assemblies in this ${kind.toLowerCase()}. You can create it once it has at least one item.`}
          costs={false}
          compact
          onQuantityChange={(id, quantity) => setLines(list => list.map(l => (l.itemId === id ? { ...l, quantity } : l)))}
          onRemove={line => setLines(list => list.filter(l => l.itemId !== line.itemId))}
        />
        {tried && errors.lines && <p className={`text-small-regular ${styles.warning}`}>{errors.lines}</p>}
        <button type="submit" hidden />
      </form>
    </AppModal>
  );
}

/* ---------- View Assembly / View Kit ---------- */

/**
 * View Assembly / View Kit (ITEMS.md §4): the read-only numbers and categories, a search of what's in the build, and
 * the build's lines; kits add Unit Cost, Net Cost and the Net Cost total. Go To … Main Page opens the record.
 */
export function ViewBuildItemModal({ target, all, onClose, onGo }: { target: Item | null; all: Item[]; onClose: () => void; onGo: (item: Item) => void }) {
  const [query, setQuery] = useState('');
  useEffect(() => setQuery(''), [target?.id]);
  // Read the latest copy, so a change elsewhere shows
  const shown = target ? (all.find(i => i.id === target.id) ?? target) : null;
  const kind = shown?.type ?? 'Assembly';
  const q = query.trim().toLowerCase();
  const lines = (shown?.build ?? []).filter(l => {
    if (!q) return true;
    const it = all.find(i => i.id === l.itemId);
    return `${l.itemId} ${it?.name ?? ''} ${it?.type ?? ''}`.toLowerCase().includes(q);
  });
  const costs = kind === 'Kit';
  const field = (label: string, value: string, lock = false) => (
    <div className={styles.readOnlyField}>
      <span className={styles.readOnlyLabel}>{label}</span>
      <span className={styles.readOnlyValue}>
        {lock && <Icon name="lock" size={20} color="currentColor" />}
        {value || '—'}
      </span>
    </div>
  );
  return (
    <AppModal
      open={!!shown}
      onClose={onClose}
      scrollable
      width={shown?.type === 'Kit' ? 880 : undefined}
      title={shown ? `View ${kind}: ${shown.name}` : ''}
      primaryAction={shown ? { label: `Go To ${kind} Main Page`, onClick: () => onGo(shown) } : undefined}
    >
      {shown && (
        <div className={styles.modalBody}>
          <div className={styles.fields4}>
            {field(`System ${kind} #`, shown.id, true)}
            {field(`Custom ${kind} #`, shown.customNumber)}
            {field('Category', shown.category)}
            {field('Subcategory', shown.subcategory)}
          </div>
          <div className={styles.buildHead}>
            <SearchInput aria-label={`Search the items in ${shown.name}`} placeholder={`Search Items in ${kind}`} value={query} onChange={e => setQuery(e.target.value)} />
            {costs && (
              <p className={styles.total}>
                Net Cost <strong>{money(buildTotal(shown.build, all))}</strong>
              </p>
            )}
          </div>
          <BuildTable
            lines={lines}
            all={all}
            label={`${shown.name} build`}
            empty={q ? `Nothing in this ${kind.toLowerCase()} matches “${query}”.` : `This ${kind.toLowerCase()} has no items yet.`}
            costs={costs}
            compact
          />
        </div>
      )}
    </AppModal>
  );
}
