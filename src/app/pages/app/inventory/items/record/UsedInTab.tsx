import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../../../../../components/Badge/Badge';
import { Button } from '../../../../../../components/Button/Button';
import { DataTable, type DataColumn, type DataSort } from '../../../../../../components/DataTable/DataTable';
import { Dropdown } from '../../../../../../components/Dropdown/Dropdown';
import { EditableCell } from '../../../../../../components/EditableCell/EditableCell';
import { Icon } from '../../../../../../components/Icon/Icon';
import { SearchInput } from '../../../../../../components/SearchBar/SearchBar';
import { Tag } from '../../../../../../components/Tag/Tag';
import { TextInput } from '../../../../../../components/TextInput/TextInput';
import { TwoLineCell } from '../../../../../../components/TwoLineCell/TwoLineCell';
import { NavTier3Labels } from '../../../../../../components/NavTier3/NavTier3';
import { AppModal } from '../../../../../components/AppModal';
import { RowMenu } from '../../record/RowMenu';
import { blankItem, CATEGORIES, TYPE_PREFIX, UNIT_TYPES, unitLabel, type BuildLine, type BuildMethod, type Item, type ItemType } from '../itemData';
import { buildCandidates, itemPath, numberLabel, setItems, updateItem, usedIn, useItems } from '../itemStore';
import { ItemPicker, nextSort, options, sortRows, TrashButton } from '../shared';
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
 * search and "Create New Assembly or Kit" (opens Create Item, this item already in its components), and the Volt Data
 * Table. A number opens Quick View; ••• has View, Go To, Activate or Deactivate, and Remove from its build.
 */
export function UsedInTab({ item, kinds, onNotice }: { item: Item; kinds: Kind[]; onNotice: (text: string) => void }) {
  const all = useItems();
  const navigate = useNavigate();
  const [show, setShow] = useState<'all' | Kind>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<DataSort | undefined>();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
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

  // Figma: one brand button; Create Item picks Assembly or Kit itself
  const create = (
    <Button size="medium" variant="brand" onClick={() => setAdding(true)}>
      {kinds.length > 1 ? 'Create New Assembly or Kit' : `Create New ${kinds[0]}`}
    </Button>
  );

  return (
    <div className={record.tab}>
      <section className={record.card} aria-label="Where Used">
        <div className={styles.toolbar} data-inset role="toolbar" aria-label="Where Used">
          {/* Figma's switch: All (n), Assemblies (n), Kits (n), as Volt small Tags */}
          {kinds.length > 1 && (
            <div className={styles.usedInSwitch} role="group" aria-label="Show">
              <Tag size="medium" selected={show === 'all'} onClick={() => setShow('all')}>
                All ({users.length})
              </Tag>
              {kinds.map(k => (
                <Tag key={k} size="medium" selected={show === k} onClick={() => setShow(k)}>
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
                    size="medium"
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

      <CreateBuildItemModal
        open={adding}
        kinds={kinds}
        seed={item}
        all={all}
        onClose={() => setAdding(false)}
        onCreate={created => {
          setItems(list => [created, ...list]);
          setAdding(false);
          onNotice(`${created.type} ${created.name} created with ${created.build.length} ${created.build.length === 1 ? 'component' : 'components'}.`);
        }}
      />

      <QuickViewModal
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

/* ---------- Create Item (Assembly / Kit) ---------- */

const BUILD_METHODS: { id: BuildMethod; label: string }[] = [
  { id: 'stock', label: 'Build from stock' },
  { id: 'supplier', label: 'Pre-Built From Supplier' },
];
type ComponentRow = { id: string; line: BuildLine; it: Item | undefined };
/** An assembly or kit needs at least this many components before Create Item turns on. */
const MIN_COMPONENTS = 2;
/** Figma "Create Item (Improved)" components table: Name (number over name) · Type · Qty · Unit, then a trash button. */
const COMPONENT_COLUMNS: DataColumn[] = [
  { key: 'name', label: 'Name', width: 'fill', minWidth: 220, sortable: false },
  { key: 'type', label: 'Type', width: 120, sortable: false },
  { key: 'qty', label: 'Qty', width: 116, sortable: false },
  { key: 'unit', label: 'Unit', width: 96, sortable: false },
  { key: 'remove', label: '', width: 56, sortable: false },
];

/**
 * Create Item (ITEMS.md §4; Figma "Create Item (Improved)" 1160:15013 Assembly, 1162:15604 Kit), from Where Used's
 * "Create New Assembly or Kit". Item Type (Assembly / Kit), Item Name, the System Item # it will get and an optional
 * Custom #; Category, Subcategory, Unit, Standard Build Time and Revision ("Rev A (auto)"); "How is this built?" (both
 * can be on); then the components, starting with the record's own item. Figma's rule: an assembly holds parts only, so
 * its search finds parts; a kit takes parts and assemblies, and an assembly row's ▸ shows what's inside it.
 */
export function CreateBuildItemModal({
  open,
  kinds,
  seed,
  all,
  onClose,
  onCreate,
}: {
  open: boolean;
  /** The types it can create (a part's Where Used: Assembly or Kit; an assembly's: Kit). The first is picked. */
  kinds: Kind[];
  /** The item that starts in the components (the record's own item). */
  seed?: Item;
  all: Item[];
  onClose: () => void;
  onCreate: (item: Item) => void;
}) {
  const [type, setType] = useState<Kind>(kinds[0]);
  const [name, setName] = useState('');
  const [custom, setCustom] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [unit, setUnit] = useState('Each (EA)');
  const [buildTime, setBuildTime] = useState('');
  const [methods, setMethods] = useState<BuildMethod[]>(['stock']);
  const [lines, setLines] = useState<BuildLine[]>([]);
  const [open_, setOpen_] = useState<Set<string>>(new Set());
  const [suffix, setSuffix] = useState('');
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (!open) return;
    setType(kinds[0]);
    setName('');
    setCustom('');
    setCategory('');
    setSubcategory('');
    setUnit('Each (EA)');
    setBuildTime('');
    setMethods(['stock']);
    setLines(seed ? [{ itemId: seed.id, quantity: 1 }] : []);
    setOpen_(new Set());
    // The system # the new item gets, made once per opening; the prefix follows Item Type
    setSuffix(blankItem(kinds[0], '').id.split('-').slice(1).join('-'));
    setTried(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seed?.id]);

  const find = (id: string) => all.find(i => i.id === id);
  // An assembly holds parts only: switching to Assembly takes any assemblies off
  function chooseType(next: Kind) {
    setType(next);
    if (next === 'Assembly') setLines(list => list.filter(l => find(l.itemId)?.type === 'Part'));
  }
  const candidates = buildCandidates(null, lines, all).filter(i => type === 'Kit' || i.type === 'Part');
  const errors = {
    name: !name.trim() ? `Enter the ${type.toLowerCase()} name` : undefined,
    category: !category ? 'Choose a category' : undefined,
    custom: custom.trim() && all.some(i => i.customNumber.toLowerCase() === custom.trim().toLowerCase()) ? `Another item already uses custom # ${custom.trim()}` : undefined,
    lines: lines.length < MIN_COMPONENTS ? 'Add at least 2 components' : lines.some(l => !(l.quantity >= 1)) ? 'Every component needs a quantity of at least 1' : undefined,
  };
  // An assembly or kit is made of at least two components; Create Item stays off until it has them
  const tooFew = lines.length < MIN_COMPONENTS;
  function create() {
    setTried(true);
    if (errors.name || errors.category || errors.custom || errors.lines) return;
    const made = blankItem(type, name.trim(), custom.trim(), {
      category,
      subcategory,
      unitType: unit,
      buildTime: buildTime.trim() || undefined,
      revision: 'Rev A',
      buildMethods: methods,
      build: lines,
    });
    onCreate({ ...made, id: `${TYPE_PREFIX[type]}-${suffix}` });
  }

  const rows: ComponentRow[] = lines.map(line => ({ id: line.itemId, line, it: find(line.itemId) }));
  const toggleOpen = (id: string) =>
    setOpen_(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <AppModal
      open={open}
      onClose={onClose}
      width={1300}
      scrollable
      title="Create Item"
      primaryAction={{ label: 'Create Item', onClick: create, disabled: tooFew }}
    >
      <form
        className={styles.createBody}
        noValidate
        onSubmit={e => {
          e.preventDefault();
          create();
        }}
      >
        <div className={styles.createRow1}>
          <Dropdown
            label="Item Type"
            options={kinds.map(k => ({ value: k, label: k }))}
            value={type}
            onChange={v => chooseType(v as Kind)}
            disabled={kinds.length === 1}
            required
          />
          <TextInput label="Item Name *" value={name} onChange={e => setName(e.target.value)} error={tried ? errors.name : undefined} autoComplete="off" required autoFocus />
          {/* The system # isn't editable: shown as text, bold, where the field would be (as on Create New Item) */}
          <div className={styles.systemNumber}>
            <span className={`text-medium-regular ${styles.fieldLabel}`} id="build-system-number">
              System Item #
            </span>
            <span className={`text-medium-bold ${styles.systemNumberValue}`} aria-labelledby="build-system-number">
              {TYPE_PREFIX[type]}-{suffix}
            </span>
          </div>
          <TextInput label="Custom # (Optional)" value={custom} onChange={e => setCustom(e.target.value)} error={tried ? errors.custom : undefined} autoComplete="off" />
        </div>
        <div className={styles.createRow2}>
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
            error={tried ? errors.category : undefined}
            required
          />
          <Dropdown
            label="Subcategory"
            placeholder={category ? 'Select' : 'Choose a category first'}
            disabled={!category}
            options={options(CATEGORIES[category] ?? [])}
            value={subcategory || null}
            onChange={v => setSubcategory(v as string)}
          />
          <Dropdown label="Unit *" options={UNIT_TYPES.map(u => ({ value: u, label: unitLabel(u) }))} value={unit} onChange={v => setUnit(v as string)} required />
          <TextInput label="Standard Build Time" placeholder="e.g. 3.5 hours" value={buildTime} onChange={e => setBuildTime(e.target.value)} autoComplete="off" />
          {/* Figma: assemblies keep revisions; a new item starts at Rev A (changing its components later makes Rev B) */}
          <TextInput label="Revision" value="Rev A (auto)" readOnly />
        </div>
        <div className={styles.createMethods}>
          <p className={`text-medium-bold ${styles.fieldLabel}`} id="build-methods">
            How is this built?
          </p>
          {/* Both can be on: built here from stock, and bought pre-built when that's cheaper or faster */}
          <div className={styles.usedInSwitch} role="group" aria-labelledby="build-methods">
            {BUILD_METHODS.map(m => (
              <Tag
                key={m.id}
                size="medium"
                selected={methods.includes(m.id)}
                onClick={() => setMethods(list => (list.includes(m.id) ? list.filter(x => x !== m.id) : [...list, m.id]))}
              >
                {m.label}
              </Tag>
            ))}
          </div>
        </div>
        <div className={styles.createComponents}>
          <h3 className={`text-large-bold ${styles.createHeading}`}>Components</h3>
          <ItemPicker
            items={candidates}
            label={type === 'Assembly' ? 'Search parts to add' : 'Search parts and assemblies to add'}
            placeholder={type === 'Assembly' ? 'Search parts to add (assemblies contain parts only)' : 'Search parts and assemblies to add'}
            onPick={picked => setLines(list => [...list, { itemId: picked.id, quantity: 1 }])}
          />
          <div className={listStyles.tableBox}>
            <DataTable
              aria-label={`Components of the new ${type.toLowerCase()}`}
              columns={COMPONENT_COLUMNS}
              rows={rows}
              rowLabel={r => r.it?.name ?? r.line.itemId}
              actions={false}
              empty={`Search above to add the ${type === 'Assembly' ? 'parts' : 'parts and assemblies'} in this ${type.toLowerCase()}.`}
              renderAfterRow={r =>
                r.it?.type === 'Assembly' &&
                open_.has(r.id) && (
                  // A kit's assembly, opened: what it's built from
                  <ul className={styles.createNested} aria-label={`Inside ${r.it.name}`}>
                    {r.it.build.map(l => {
                      const inner = find(l.itemId);
                      return (
                        <li key={l.itemId} className="text-small-regular">
                          <span>
                            {l.itemId} · {inner?.name ?? 'Unknown item'}
                          </span>
                          <strong>× {l.quantity}</strong>
                        </li>
                      );
                    })}
                  </ul>
                )
              }
              cells={r => ({
                name: (
                  <span className={styles.createName}>
                    {r.it?.type === 'Assembly' && (
                      <button
                        type="button"
                        className={styles.createToggle}
                        aria-expanded={open_.has(r.id)}
                        aria-label={`${open_.has(r.id) ? 'Hide' : 'Show'} what's inside ${r.it.name}`}
                        onClick={() => toggleOpen(r.id)}
                      >
                        <Icon name={open_.has(r.id) ? 'chevron-down' : 'chevron-right'} size={16} color="currentColor" />
                      </button>
                    )}
                    <TwoLineCell title={r.line.itemId} description={r.it?.name} />
                  </span>
                ),
                type: (
                  <Badge shape="pill" color={r.it?.type === 'Part' ? 'black' : 'blue'}>
                    {r.it?.type ?? 'Item'}
                  </Badge>
                ),
                qty: (
                  <EditableCell
                    label={`Quantity of ${r.it?.name ?? r.line.itemId}`}
                    inputType="number"
                    value={String(r.line.quantity)}
                    error={tried && !(r.line.quantity >= 1)}
                    onValueChange={v => setLines(list => list.map(l => (l.itemId === r.id ? { ...l, quantity: Number(v) } : l)))}
                  />
                ),
                unit: r.it ? unitLabel(r.it.unitType) : '—',
                // The item this was opened from always stays: a lock in place of the trash button
                remove:
                  r.id === seed?.id ? (
                    <span className={styles.lockedRow} role="img" aria-label={`${r.it?.name ?? r.line.itemId} stays: it's the ${seed.type.toLowerCase()} you started from`} title="This is the item you started from, so it can't be removed">
                      <Icon name="lock" size={20} color="currentColor" />
                    </span>
                  ) : (
                    <TrashButton label={`Remove ${r.it?.name ?? r.line.itemId}`} onClick={() => setLines(list => list.filter(l => l.itemId !== r.id))} />
                  ),
              })}
            />
          </div>
          {/* Why Create Item is off: fewer than two components (a plain note, not an error, until they try) */}
          {tooFew ? (
            <p className={`text-small-regular ${styles.fieldLabel}`} aria-live="polite">
              Add at least 2 components to create this {type.toLowerCase()} ({lines.length} added).
            </p>
          ) : (
            tried && errors.lines && <p className={`text-small-regular ${styles.warning}`}>{errors.lines}</p>
          )}
        </div>
        <button type="submit" hidden />
      </form>
    </AppModal>
  );
}

/* ---------- Quick View (Assembly / Kit) ---------- */

/**
 * Quick View (ITEMS.md §4; Figma "Assembly Quick View (Improved)" 1160:13987), from a Where Used number or ••• › View:
 * "# · name" with the record's labels under it, "Assembly Components (n)" (or Kit) with the status pill, one line per
 * component ("# · name" and "× qty"), and Go to Item.
 */
export function QuickViewModal({ target, all, onClose, onGo }: { target: Item | null; all: Item[]; onClose: () => void; onGo: (item: Item) => void }) {
  // Read the latest copy, so a change elsewhere shows
  const shown = target ? (all.find(i => i.id === target.id) ?? target) : null;
  return (
    <AppModal
      open={!!shown}
      onClose={onClose}
      width={640}
      title={shown ? `${shown.id} · ${shown.name}` : ''}
      description={
        shown && (
          <NavTier3Labels
            items={[
              { label: numberLabel(shown.type).toUpperCase(), value: shown.customNumber || shown.id },
              { label: 'CATEGORY', value: (shown.category || '—').toUpperCase() },
              { label: 'SUBCATEGORY', value: (shown.subcategory || '—').toUpperCase() },
            ]}
          />
        )
      }
      secondaryAction={false}
      primaryAction={shown ? { label: 'Go to Item', onClick: () => onGo(shown) } : undefined}
    >
      {shown && (
        <div className={styles.quickBody}>
          <div className={styles.quickHead}>
            <p className="text-medium-bold">
              {shown.type} Components ({shown.build.length})
            </p>
            <Badge shape="pill" color={shown.active ? 'green' : 'black'}>
              {shown.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          {shown.build.length === 0 ? (
            <p className="text-medium-regular">No components yet.</p>
          ) : (
            <ul className={styles.quickList} aria-label={`${shown.name} components`}>
              {shown.build.map(l => (
                <li key={l.itemId}>
                  <span className="text-medium-regular">
                    {l.itemId} · {all.find(i => i.id === l.itemId)?.name ?? 'Unknown item'}
                  </span>
                  <span className="text-medium-bold">× {l.quantity}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </AppModal>
  );
}
