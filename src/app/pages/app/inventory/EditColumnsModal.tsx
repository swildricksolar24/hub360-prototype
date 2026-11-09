import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Button } from '../../../../components/Button/Button';
import { Icon } from '../../../../components/Icon/Icon';
import { IconButton } from '../../../../components/IconButton/IconButton';
import { SearchInput } from '../../../../components/SearchBar/SearchBar';
import { Tag } from '../../../../components/Tag/Tag';
import { TextInput } from '../../../../components/TextInput/TextInput';
import { Toggle } from '../../../../components/Toggle/Toggle';
import { AppModal } from '../../../components/AppModal';
import { DEFAULT_COLUMNS, FIELDS, fieldByKey, type FieldGroup, type SavedView } from './warehouseData';
import styles from './editColumns.module.css';

const label = (key: string) => fieldByKey(key)?.label ?? key;
const GROUPS: ('All' | FieldGroup)[] = ['All', ...new Set(FIELDS.map(f => f.group))];

/** Frozen columns first (the table shows them first and keeps them in view), each group in its own order. */
const frozenFirst = (order: string[], frozen: Set<string>) => [...order.filter(k => frozen.has(k)), ...order.filter(k => !frozen.has(k))];

/** Moves `key` to `index` within its own group (frozen or not); the other group keeps its place. */
function moveWithinGroup(order: string[], frozen: Set<string>, key: string, index: number) {
  const isFrozen = frozen.has(key);
  const group = order.filter(k => frozen.has(k) === isFrozen && k !== key);
  group.splice(Math.max(0, Math.min(index, group.length)), 0, key);
  const other = order.filter(k => frozen.has(k) !== isFrozen);
  return isFrozen ? [...group, ...other] : [...other, ...group];
}

/**
 * Figma "Edit Columns — Dual List" (Inventory Management, 826:57907). Left, Available fields: the fields not in the
 * table, searched and filtered by group; tick one or more, then Add (or double-click a field). Right, Columns in
 * table: the table's columns in display order. Drag a row by its handle (or Alt+↑ / Alt+↓) to move it; the snowflake
 * freezes a column, which moves it to the frozen group at the top; × sends it back to the left. "Save as a View"
 * names the layout so Apply also saves it.
 */
export function EditColumnsModal({
  open,
  view,
  columns,
  frozen,
  onClose,
  onApply,
}: {
  open: boolean;
  /** The saved view being shown, if any: its name fills View Name. */
  view: SavedView | null;
  columns: string[];
  frozen: string[];
  onClose: () => void;
  onApply: (columns: string[], frozen: string[], viewName?: string) => void;
}) {
  const [order, setOrder] = useState<string[]>([]);
  const [frozenSet, setFrozenSet] = useState<Set<string>>(new Set());
  /** Ticked fields on the left, waiting for Add */
  const [picked, setPicked] = useState<Set<string>>(new Set());
  /** The selected column on the right, for Remove and the keyboard */
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<(typeof GROUPS)[number]>('All');
  const [saveView, setSaveView] = useState(false);
  const [name, setName] = useState('');
  const [dragging, setDragging] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    const f = new Set(frozen);
    setOrder(frozenFirst(columns, f));
    setFrozenSet(f);
    setPicked(new Set());
    setSelected(null);
    setQuery('');
    setGroup('All');
    setSaveView(!!view);
    setName(view?.name ?? '');
  }, [open, view, columns, frozen]);

  // Left list: every field that isn't a column yet, narrowed by the search and the group chip
  const available = FIELDS.filter(f => !order.includes(f.key));
  const q = query.trim().toLowerCase();
  const shown = available.filter(f => (group === 'All' || f.group === group) && (!q || f.label.toLowerCase().includes(q)));
  const frozenCount = order.filter(k => frozenSet.has(k)).length;

  function add(keys: string[]) {
    // Added in the fields' own order, after the last column
    setOrder(o => [...o, ...FIELDS.map(f => f.key).filter(k => keys.includes(k) && !o.includes(k))]);
    setPicked(new Set());
  }
  function remove(key: string) {
    setOrder(o => o.filter(k => k !== key));
    setFrozenSet(f => {
      const next = new Set(f);
      next.delete(key);
      return next;
    });
    setSelected(s => (s === key ? null : s));
  }
  function togglePicked(key: string) {
    setPicked(p => {
      const next = new Set(p);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  /** Freezing moves a column to the end of the frozen group; unfreezing, to the top of the others. */
  function toggleFrozen(key: string) {
    const next = new Set(frozenSet);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setFrozenSet(next);
    // Either way it lands on the line between the groups: last of the frozen, or first of the others
    setOrder(o => {
      const rest = o.filter(k => k !== key);
      return [...rest.filter(k => next.has(k)), key, ...rest.filter(k => !next.has(k))];
    });
  }

  // Drag and drop: the handle captures the pointer; the row moves within its group as the pointer crosses row midpoints
  function onHandleDown(e: PointerEvent<HTMLSpanElement>, key: string) {
    if (e.button !== 0) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* no active pointer to capture (e.g. a synthetic event); the drag still works while over the handle */
    }
    setSelected(key);
    setDragging(key);
  }
  function onHandleMove(e: PointerEvent<HTMLSpanElement>) {
    if (!dragging || !listRef.current) return;
    const isFrozen = frozenSet.has(dragging);
    const rows = [...listRef.current.querySelectorAll<HTMLElement>('li[data-key]')].filter(
      li => li.dataset.key !== dragging && frozenSet.has(li.dataset.key!) === isFrozen,
    );
    const index = rows.filter(li => {
      const r = li.getBoundingClientRect();
      return r.top + r.height / 2 < e.clientY;
    }).length;
    setOrder(o => {
      const next = moveWithinGroup(o, frozenSet, dragging, index);
      return next.join() === o.join() ? o : next;
    });
  }
  const onHandleUp = () => setDragging(null);

  // Keyboard: Alt+↑ / Alt+↓ moves the focused column by one place within its group; Delete removes it
  function onRowKey(e: KeyboardEvent<HTMLLIElement>, key: string) {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Delete') {
      e.preventDefault();
      remove(key);
      return;
    }
    if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault();
    const isFrozen = frozenSet.has(key);
    const index = order.filter(k => frozenSet.has(k) === isFrozen).indexOf(key) + (e.key === 'ArrowUp' ? -1 : 1);
    setOrder(o => moveWithinGroup(o, frozenSet, key, index));
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>(`li[data-key="${key}"]`)?.focus());
  }

  const viewName = saveView ? name.trim() : '';
  const apply = () => onApply(order, order.filter(k => frozenSet.has(k)), viewName || undefined);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      width={1280}
      title="Edit Columns"
      description="Search fields on the left and add them to the right. The right list is the order columns appear in the table. Freeze a column to keep it in view while scrolling sideways."
      startAction={{
        label: 'Reset to Default',
        onClick: () => {
          setOrder(DEFAULT_COLUMNS);
          setFrozenSet(new Set());
          setPicked(new Set());
          setSelected(null);
        },
      }}
      primaryAction={{ label: 'Apply', onClick: apply, disabled: order.length === 0 || (saveView && !viewName) }}
    >
      {/* Save as a View: the toggle unlocks View Name */}
      <div className={styles.saveView}>
        <Toggle label="Save as a View" checked={saveView} onChange={e => setSaveView(e.target.checked)} />
        <TextInput
          className={styles.viewName}
          label={<span className={styles.srOnly}>View Name</span>}
          placeholder="View Name"
          value={name}
          disabled={!saveView}
          onChange={e => setName(e.target.value)}
        />
      </div>

      <div className={styles.dualList}>
        {/* Available fields */}
        <section className={styles.available} aria-labelledby="edit-columns-available">
          <div className={styles.head}>
            <h3 id="edit-columns-available" className="text-large-bold">
              Available fields
            </h3>
            <span className="text-small-regular">{available.length} not in the table</span>
          </div>
          <SearchInput aria-label="Search fields" placeholder="Search fields" value={query} onChange={e => setQuery(e.target.value)} />
          <div className={styles.groups} role="group" aria-label="Field groups">
            {GROUPS.map(g => (
              <Tag key={g} size="small" selected={group === g} onClick={() => setGroup(g)}>
                {g}
              </Tag>
            ))}
          </div>
          {shown.length ? (
            <ul className={styles.fields} role="listbox" aria-multiselectable aria-label="Available fields">
              {shown.map(f => {
                const on = picked.has(f.key);
                return (
                  <li
                    key={f.key}
                    role="option"
                    aria-selected={on}
                    tabIndex={0}
                    className={styles.field}
                    onClick={() => togglePicked(f.key)}
                    onDoubleClick={() => add([f.key])}
                    onKeyDown={e => {
                      if (e.key === ' ') {
                        e.preventDefault();
                        togglePicked(f.key);
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        add([f.key]);
                      }
                    }}
                  >
                    <Icon name={on ? 'checkbox-checked' : 'checkbox'} size={24} color="currentColor" className={styles.check} />
                    <span className={`${on ? 'text-medium-bold' : 'text-medium-regular'} ${styles.fieldName}`}>{f.label}</span>
                    <span className={`text-small-regular ${styles.meta}`}>{f.group}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={`text-small-regular ${styles.empty}`}>{available.length ? 'No fields match.' : 'Every field is in the table.'}</p>
          )}
          <p className={`text-small-regular ${styles.note}`}>Select one or more fields, then Add. Double-click a field to add it straight away.</p>
        </section>

        {/* Move buttons */}
        <div className={styles.moves}>
          <Button size="small" variant="brand" disabled={picked.size === 0} onClick={() => add([...picked])}>
            {picked.size ? `Add ${picked.size}` : 'Add'}
          </Button>
          <Button size="small" variant="outline" disabled={!selected} onClick={() => selected && remove(selected)}>
            Remove
          </Button>
          <Button size="small" variant="outline" disabled={available.length === 0} onClick={() => add(available.map(f => f.key))}>
            Add All
          </Button>
        </div>

        {/* Columns in table */}
        <section className={styles.columns} aria-labelledby="edit-columns-table">
          <div className={styles.head}>
            <h3 id="edit-columns-table" className="text-large-bold">
              Columns in table
            </h3>
            <span className="text-small-regular">
              {order.length} {order.length === 1 ? 'column' : 'columns'} · {frozenCount} frozen
            </span>
          </div>
          {order.length ? (
            <ul ref={listRef} className={styles.fields}>
              {order.map(key => {
                const isFrozen = frozenSet.has(key);
                return (
                  <li
                    key={key}
                    data-key={key}
                    tabIndex={0}
                    className={styles.column}
                    data-selected={selected === key || undefined}
                    data-dragging={dragging === key || undefined}
                    aria-current={selected === key || undefined}
                    aria-label={`${label(key)}${isFrozen ? ', frozen' : ''}. Alt plus arrow keys to move, Delete to remove.`}
                    onClick={() => setSelected(key)}
                    onFocus={e => e.target === e.currentTarget && setSelected(key)}
                    onKeyDown={e => onRowKey(e, key)}
                  >
                    <span
                      className={styles.handle}
                      aria-hidden
                      onPointerDown={e => onHandleDown(e, key)}
                      onPointerMove={onHandleMove}
                      onPointerUp={onHandleUp}
                      onPointerCancel={onHandleUp}
                    >
                      <Icon name="drag-indicator" size={24} color="currentColor" />
                    </span>
                    <span className={`text-medium-bold ${styles.fieldName}`}>{label(key)}</span>
                    {/* Frozen: the solid brand button; the label tells screen readers the state */}
                    <IconButton
                      size="compact"
                      variant={isFrozen ? 'brand' : 'default'}
                      className={styles.freeze}
                      icon={isFrozen ? 'freeze' : 'unfreeze'}
                      label={isFrozen ? `Unfreeze ${label(key)}` : `Freeze ${label(key)}`}
                      title={isFrozen ? 'Frozen: click to unfreeze' : 'Freeze in view'}
                      onClick={e => {
                        e.stopPropagation();
                        toggleFrozen(key);
                      }}
                    />
                    <button
                      type="button"
                      className={styles.remove}
                      aria-label={`Remove ${label(key)}`}
                      title="Remove"
                      onClick={e => {
                        e.stopPropagation();
                        remove(key);
                      }}
                    >
                      <Icon name="close" size={24} color="currentColor" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={`text-small-regular ${styles.empty}`}>Add fields from the left to show them as columns.</p>
          )}
          <p className={`text-small-regular ${styles.note} ${styles.noteEnd}`}>
            Drag a row by its handle, or select it and press Alt+↑ / Alt+↓. Freezing a column locks that column so that it is
            always in view when scrolling.
          </p>
        </section>
      </div>
    </AppModal>
  );
}
