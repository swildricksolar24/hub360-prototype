import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { DataCheckbox } from '../../../../components/DataHeader/DataCheckbox';
import { Icon } from '../../../../components/Icon/Icon';
import { IconButton } from '../../../../components/IconButton/IconButton';
import { SearchInput } from '../../../../components/SearchBar/SearchBar';
import { TextInput } from '../../../../components/TextInput/TextInput';
import { AppModal } from '../../../components/AppModal';
import { FIELDS, fieldByKey, type SavedView } from './warehouseData';
import styles from './modals.module.css';

const label = (key: string) => fieldByKey(key)?.label ?? key;

/**
 * Moves `block` to `index` among the unfrozen columns. Frozen columns keep their places: they stay fixed while the
 * others are rearranged (Figma: "Click the snowflake icon to freeze columns in place").
 */
function reorder(order: string[], frozen: Set<string>, block: string[], index: number) {
  const rest = order.filter(k => !frozen.has(k) && !block.includes(k));
  const moving = order.filter(k => block.includes(k) && !frozen.has(k));
  rest.splice(Math.max(0, Math.min(index, rest.length)), 0, ...moving);
  let next = 0;
  return order.map(k => (frozen.has(k) ? k : rest[next++]));
}

/**
 * Figma "Edit Columns" (732:51812) and its states: naming a view (732:51925), editing a saved view (732:52038) and
 * the delete confirmation (732:52350). Database Fields (left) picks the columns; Column Headers (right) orders them
 * by drag and drop (or Alt+↑/↓), selected rows move together, and the snowflake freezes a column in place.
 */
export function EditColumnsModal({
  open,
  view,
  columns,
  frozen,
  onClose,
  onApply,
  onDeleteView,
}: {
  open: boolean;
  /** The saved view being shown, if any (editing view). */
  view: SavedView | null;
  columns: string[];
  frozen: string[];
  onClose: () => void;
  onApply: (columns: string[], frozen: string[], viewName?: string) => void;
  onDeleteView: (name: string) => void;
}) {
  const [name, setName] = useState('');
  const [order, setOrder] = useState<string[]>([]);
  const [frozenSet, setFrozenSet] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [dragging, setDragging] = useState<string[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(view?.name ?? '');
    setOrder(columns);
    setFrozenSet(new Set(frozen));
    setSelected(new Set());
    setQuery('');
    setConfirmDelete(false);
  }, [open, view, columns, frozen]);

  const q = query.trim().toLowerCase();
  const matches = (key: string) => !q || label(key).toLowerCase().includes(q);
  const searching = q !== '';

  function toggleField(key: string, on: boolean) {
    setOrder(o => (on ? [...o, key] : o.filter(k => k !== key)));
    if (!on) {
      setFrozenSet(f => {
        const next = new Set(f);
        next.delete(key);
        return next;
      });
    }
  }

  /** The rows that move with `key`: all selected rows when `key` is one of them. */
  const blockFor = (key: string) => (selected.has(key) && selected.size > 1 ? order.filter(k => selected.has(k)) : [key]);
  const restIndex = (block: string[]) => order.filter(k => !frozenSet.has(k) && !block.includes(k) && order.indexOf(k) < order.indexOf(block[0])).length;

  // Drag and drop: the handle captures the pointer; the list reorders live as the pointer crosses row midpoints
  function onHandleDown(e: PointerEvent<HTMLSpanElement>, key: string) {
    if (frozenSet.has(key) || searching || e.button !== 0) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* no active pointer to capture (e.g. a synthetic event); the drag still works while over the handle */
    }
    setDragging(blockFor(key));
  }
  function onHandleMove(e: PointerEvent<HTMLSpanElement>) {
    if (!dragging || !listRef.current) return;
    const rows = [...listRef.current.querySelectorAll<HTMLElement>('li[data-key]')].filter(
      li => !frozenSet.has(li.dataset.key!) && !dragging.includes(li.dataset.key!),
    );
    const index = rows.filter(li => {
      const r = li.getBoundingClientRect();
      return r.top + r.height / 2 < e.clientY;
    }).length;
    setOrder(o => {
      const next = reorder(o, frozenSet, dragging, index);
      return next.join() === o.join() ? o : next;
    });
  }
  const onHandleUp = () => setDragging(null);

  // Keyboard: Alt+↑ / Alt+↓ moves the focused row (or the selected rows with it) by one place
  function onRowKey(e: KeyboardEvent<HTMLLIElement>, key: string) {
    if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') || frozenSet.has(key) || searching) return;
    e.preventDefault();
    const block = blockFor(key);
    setOrder(o => reorder(o, frozenSet, block, restIndex(block) + (e.key === 'ArrowUp' ? -1 : 1)));
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>(`li[data-key="${key}"]`)?.focus());
  }

  const trimmed = name.trim();
  const apply = () => onApply(order, order.filter(k => frozenSet.has(k)), trimmed || undefined);

  return (
    <>
      <AppModal
        open={open && !confirmDelete}
        onClose={onClose}
        width={960}
        title="Edit Columns"
        description={
          <>
            Drag and drop fields to customize which columns appear and their order. Select multiple fields to move them together.
            Click the snowflake icon to freeze columns in place. To save your customized layout for future use, enter a View Name.
          </>
        }
        startAction={view ? { label: 'Delete View', danger: true, onClick: () => setConfirmDelete(true) } : undefined}
        primaryAction={{ label: trimmed ? 'Save' : 'Apply', onClick: apply, disabled: order.length === 0 }}
      >
        <div className={styles.columnsTop}>
          {view && <p className={`text-medium-regular ${styles.modified}`}>Last Modified: <strong>{view.modified}</strong></p>}
          <TextInput label="View Name" placeholder="Optional" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className={styles.search}>
          <SearchInput aria-label="Search fields" placeholder="Search" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className={styles.panels}>
          {/* Database Fields: every field; checked ones are columns */}
          <section className={styles.panel} aria-label="Database Fields">
            <div className={`text-medium-bold ${styles.panelHead}`}>
              <DataCheckbox
                label="Show all fields"
                checked={order.length === FIELDS.length}
                onChange={on => setOrder(on ? [...order, ...FIELDS.map(f => f.key).filter(k => !order.includes(k))] : [])}
              />
              <span>Database Fields</span>
            </div>
            <ul className={styles.panelList}>
              {FIELDS.filter(f => matches(f.key)).map(f => (
                <li key={f.key} className={styles.fieldItem}>
                  <DataCheckbox label={`Show ${f.label}`} checked={order.includes(f.key)} onChange={on => toggleField(f.key, on)} />
                  <span className={`text-small-bold ${styles.chip}`}>{f.label}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Column Headers: the chosen columns in table order */}
          <section className={styles.panel} data-tint aria-label="Column Headers">
            <div className={`text-medium-bold ${styles.panelHead}`}>
              <DataCheckbox
                label="Select all columns"
                checked={order.length > 0 && order.every(k => selected.has(k))}
                onChange={on => setSelected(on ? new Set(order) : new Set())}
              />
              <span>Column Headers</span>
            </div>
            {order.length === 0 ? (
              <p className={`text-small-regular ${styles.emptyList}`}>Check fields on the left to add columns.</p>
            ) : (
              <ul ref={listRef} className={styles.panelList}>
                {order.filter(matches).map(key => {
                  const isFrozen = frozenSet.has(key);
                  return (
                    <li
                      key={key}
                      data-key={key}
                      tabIndex={0}
                      className={styles.fieldItem}
                      data-frozen={isFrozen || undefined}
                      data-dragging={dragging?.includes(key) || undefined}
                      aria-label={`${label(key)}${isFrozen ? ', frozen' : ''}. Alt plus arrow keys to move.`}
                      onKeyDown={e => onRowKey(e, key)}
                    >
                      <DataCheckbox
                        label={`Select ${label(key)}`}
                        checked={selected.has(key)}
                        onChange={on =>
                          setSelected(s => {
                            const next = new Set(s);
                            if (on) next.add(key);
                            else next.delete(key);
                            return next;
                          })
                        }
                      />
                      <span className={`text-small-bold ${styles.chip}`}>
                        <span
                          className={styles.handle}
                          aria-hidden
                          onPointerDown={e => onHandleDown(e, key)}
                          onPointerMove={onHandleMove}
                          onPointerUp={onHandleUp}
                          onPointerCancel={onHandleUp}
                        >
                          <Icon name="drag-indicator" size={20} color="currentColor" />
                        </span>
                        {label(key)}
                      </span>
                      {/* Frozen: the solid brand button; the label tells screen readers the state */}
                      <IconButton
                        size="compact"
                        variant={isFrozen ? 'brand' : 'default'}
                        icon={isFrozen ? 'freeze' : 'unfreeze'}
                        label={isFrozen ? `Unfreeze ${label(key)}` : `Freeze ${label(key)}`}
                        title={isFrozen ? 'Frozen: click to unfreeze' : 'Freeze in place'}
                        onClick={() =>
                          setFrozenSet(f => {
                            const next = new Set(f);
                            if (isFrozen) next.delete(key);
                            else next.add(key);
                            return next;
                          })
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            )}
            {searching && order.length > 0 && <p className={`text-tiny-regular ${styles.hint}`}>Clear the search to rearrange columns.</p>}
          </section>
        </div>
      </AppModal>

      {/* Figma "Action Confirmation" (732:52350) */}
      <AppModal
        open={open && confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Deleting View - Confirmation Required"
        primaryAction={{ label: 'Delete Item', danger: true, onClick: () => view && onDeleteView(view.name) }}
      >
        <div className={styles.form}>
          <TextInput label="View Name" value={view?.name ?? ''} readOnly />
          <p className="text-medium-regular">Please confirm that you want to proceed with the deletion. This action cannot be undone.</p>
        </div>
      </AppModal>
    </>
  );
}
