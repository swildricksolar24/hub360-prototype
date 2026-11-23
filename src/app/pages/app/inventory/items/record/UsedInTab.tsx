import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../../../../../components/Badge/Badge';
import { Button } from '../../../../../../components/Button/Button';
import { DataTable, type DataColumn, type DataSort } from '../../../../../../components/DataTable/DataTable';
import { Dropdown } from '../../../../../../components/Dropdown/Dropdown';
import { Icon } from '../../../../../../components/Icon/Icon';
import { SearchInput } from '../../../../../../components/SearchBar/SearchBar';
import { Tag } from '../../../../../../components/Tag/Tag';
import { TextArea } from '../../../../../../components/TextArea/TextArea';
import { TextInput } from '../../../../../../components/TextInput/TextInput';
import { AppModal } from '../../../../../components/AppModal';
import { RowMenu } from '../../record/RowMenu';
import { blankItem, CATEGORIES, money, TYPE_DESCRIPTION, type BuildLine, type Item, type ItemType } from '../itemData';
import { buildCandidates, itemPath, setItems, unitCostOf, updateItem, usedIn, useItems } from '../itemStore';
import { ItemPicker, MenuButton, nextSort, options, required, requiredNote, sortRows } from '../shared';
import { BuildTable, buildTotal } from './BuildTab';
import { useColumnFilters } from '../../ColumnFilter';
import record from '../../record.module.css';
import listStyles from '../../warehouses.module.css';
import styles from '../items.module.css';

type Kind = Extract<ItemType, 'Assembly' | 'Kit'>;

/** Figma "Where Used" (1152:53629): Used In (number over name), Type, Category, Sub Category, Status, then the •••. */
const COLUMNS: DataColumn[] = [
  { key: 'usedIn', label: 'Used In', width: 'fill', minWidth: 200 },
  // Type, Category, Sub Category and Status repeat, so they filter (a checkbox list of their values)
  { key: 'type', label: 'Type', width: 140, minWidth: 120, filterable: true },
  { key: 'category', label: 'Category', width: 160, minWidth: 130, filterable: true },
  { key: 'subcategory', label: 'Sub Category', width: 170, minWidth: 140, filterable: true },
  { key: 'status', label: 'Status', width: 130, minWidth: 110, filterable: true },
];

const cellValue = (i: Item, key: string) =>
  key === 'usedIn' ? i.id : key === 'type' ? i.type : key === 'status' ? (i.active ? 'Active' : 'Inactive') : String(i[key as 'category' | 'subcategory'] ?? '');

const PLURAL: Record<Kind, string> = { Assembly: 'Assemblies', Kit: 'Kits' };

/**
 * Item record › Where Used (ITEMS.md §4; Figma "Where Used" 1152:53629): the assemblies and kits whose build uses this
 * item. A Part sees both, with Figma's All / Assemblies / Kits switch; an Assembly sees the kits that use it. Then a
 * search and "Create New Assembly or Kit" (a menu for the two), and the Volt Data Table. A number opens View Assembly /
 * View Kit; ••• has View, Go To, Activate or Deactivate, and Remove from its build.
 */
export function UsedInTab({ item, kinds, onNotice }: { item: Item; kinds: Kind[]; onNotice: (text: string) => void }) {
  const all = useItems();
  const navigate = useNavigate();
  const [show, setShow] = useState<'all' | Kind>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<DataSort | undefined>();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [adding, setAdding] = useState<Kind | null>(null);
  const [viewing, setViewing] = useState<Item | null>(null);
  const [removing, setRemoving] = useState<Item | null>(null);

  // A different item starts on All with no search
  useEffect(() => {
    setQuery('');
    setShow('all');
  }, [item.id]);

  const users = usedIn(item.id, all).filter(i => (kinds as ItemType[]).includes(i.type));
  const count = (k: Kind) => users.filter(i => i.type === k).length;
  const colFilters = useColumnFilters(users, (i, key) => String(cellValue(i, key)));
  const q = query.trim().toLowerCase();
  const rows = sortRows(
    users.filter(
      i =>
        (show === 'all' || i.type === show) &&
        (!q || `${i.id} ${i.customNumber} ${i.name} ${i.category} ${i.subcategory}`.toLowerCase().includes(q)) &&
        colFilters.matches(i),
    ),
    sort,
    cellValue,
  );
  const quantityIn = (u: Item) => u.build.find(l => l.itemId === item.id)?.quantity ?? 0;
  const what = kinds.length > 1 ? 'assemblies and kits' : PLURAL[kinds[0]].toLowerCase();

  function setActive(u: Item, active: boolean) {
    setItems(items => items.map(i => (i.id === u.id ? { ...i, active } : i)));
    onNotice(`${u.name} ${active ? 'activated' : 'deactivated'}.`);
  }

  const create =
    kinds.length > 1 ? (
      <MenuButton
        label="Create New Assembly or Kit"
        items={kinds.map(k => ({ label: `New ${k}`, onSelect: () => setAdding(k) }))}
      />
    ) : (
      <Button size="small" variant="brand" icon="plus" onClick={() => setAdding(kinds[0])}>
        Create New {kinds[0]}
      </Button>
    );

  return (
    <div className={record.tab}>
      <section className={record.card} aria-label="Where Used">
        <div className={styles.toolbar} data-inset role="toolbar" aria-label="Where Used">
          {/* Figma's switch: All (n), Assemblies (n), Kits (n), as Volt small Tags */}
          {kinds.length > 1 && (
            <div className={styles.usedInSwitch} role="group" aria-label="Show">
              <Tag size="small" selected={show === 'all'} onClick={() => setShow('all')}>
                All ({users.length})
              </Tag>
              {kinds.map(k => (
                <Tag key={k} size="small" selected={show === k} onClick={() => setShow(k)}>
                  {PLURAL[k]} ({count(k)})
                </Tag>
              ))}
            </div>
          )}
          <SearchInput
            className={styles.search}
            aria-label={`Search ${what} that use this ${item.type.toLowerCase()}`}
            placeholder={`Search ${what} that use this ${item.type.toLowerCase()}`}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {create}
        </div>

        <div ref={colFilters.boxRef} className={listStyles.tableBox}>
          <DataTable
            aria-label={`${kinds.length > 1 ? 'Assemblies and kits' : PLURAL[kinds[0]]} that use ${item.name}`}
            columns={COLUMNS}
            rows={rows}
            rowLabel={u => u.name}
            sort={sort}
            onSortChange={k => setSort(nextSort(k))}
            {...colFilters.tableProps}
            totalRows={users.length}
            inactive={u => !u.active}
            empty={
              <div className={styles.emptyCell}>
                <Icon name={users.length ? 'search' : 'settings'} size={32} />
                <p className="text-large-bold">{users.length ? `No ${what} match your search` : `${item.name} isn’t in any ${what} yet`}</p>
                <p className="text-medium-regular">{users.length ? 'Try a different word, or clear the search and filters.' : 'Create one that’s built with it.'}</p>
                {users.length ? (
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => {
                      setQuery('');
                      setShow('all');
                      colFilters.clear();
                    }}
                  >
                    Clear search and filters
                  </Button>
                ) : (
                  create
                )}
              </div>
            }
            onMore={u => setMenuFor(m => (m === u.id ? null : u.id))}
            renderAfterRow={u =>
              menuFor === u.id && (
                <RowMenu
                  label={u.name}
                  onClose={() => setMenuFor(null)}
                  items={[
                    { label: `View ${u.type}`, onSelect: () => setViewing(u) },
                    { label: `Go To ${u.type}`, onSelect: () => navigate(itemPath(u.id)) },
                    { label: u.active ? 'Deactivate' : 'Activate', onSelect: () => setActive(u, !u.active) },
                    { label: `Remove ${item.type} (${quantityIn(u)})`, onSelect: () => setRemoving(u) },
                  ]}
                />
              )
            }
            cells={(u): Record<string, ReactNode> => ({
              // Figma: the number in bold over the name in small text; the number opens View Assembly / View Kit
              usedIn: (
                <span className={styles.usedInCell}>
                  <button type="button" className={record.cellLink} onClick={() => setViewing(u)} aria-label={`View ${u.name} (${u.id})`}>
                    {u.id}
                  </button>
                  <span className="text-small-regular">{u.name}</span>
                </span>
              ),
              type: (
                <Badge shape="pill" color="blue">
                  {u.type}
                </Badge>
              ),
              category: u.category || '—',
              subcategory: u.subcategory || '—',
              status: (
                <Badge shape="pill" color={u.active ? 'green' : 'black'}>
                  {u.active ? 'Active' : 'Inactive'}
                </Badge>
              ),
            })}
          />
          {colFilters.popover(COLUMNS)}
        </div>
      </section>

      <AddBuildItemModal
        open={adding !== null}
        kind={adding ?? kinds[0]}
        seed={item}
        all={all}
        onClose={() => setAdding(null)}
        onCreate={created => {
          setItems(list => [created, ...list]);
          setAdding(null);
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
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={`Remove ${item.type} From ${removing?.type ?? ''}`}
        description={
          removing &&
          `${item.name} will be taken out of the build of ${removing.name}, and its costs will change. The ${removing.type.toLowerCase()} stays in Items.`
        }
        primaryAction={{
          label: `Remove ${item.type}`,
          danger: true,
          onClick: () => {
            if (removing) {
              updateItem(removing.id, x => ({ ...x, build: x.build.filter(l => l.itemId !== item.id) }));
              onNotice(`${item.name} removed from ${removing.name}.`);
            }
            setRemoving(null);
          },
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
