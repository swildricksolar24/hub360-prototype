import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { Icon } from '../../../../../components/Icon/Icon';
import { IconButton } from '../../../../../components/IconButton/IconButton';
import { MAX_LOCATION_DEPTH, type WarehouseLocation } from '../warehouseRecordData';
import { canIndent, flattenTree, indent, moveAmongSiblings, outdent, siblingCount, siblingIndex } from './locationTree';
import styles from '../record.module.css';

/**
 * Locations › Structure (Figma 562:4260; Location Details › Structure 570:34435): the location tree. Each row is a bar
 * with a drag handle, a depth badge (1–4), "↳" indented by depth, the name, and outdent / indent / add sublocation /
 * edit buttons. Dragging the handle (or ↑ / ↓ on it) reorders a row among its siblings.
 *
 * Built at page level: ListBox's TreeList is a selection list (expand / collapse, one chosen row) with no room for
 * per-row buttons or reordering.
 */
export function LocationTree({
  locations,
  rootId = null,
  query = '',
  onChange,
  onAddChild,
  onEdit,
}: {
  locations: WarehouseLocation[];
  /** Show only this location's sublocations (Location Details). Its direct children can't be outdented out of view. */
  rootId?: string | null;
  /** Search: keeps matching rows and the rows above them; reordering waits until the search is cleared. */
  query?: string;
  onChange: (next: WarehouseLocation[]) => void;
  onAddChild: (parentId: string) => void;
  onEdit: (location: WarehouseLocation) => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const all = flattenTree(locations, rootId);

  // Search keeps the matches and their parents, so each match is still shown in place
  const q = query.trim().toLowerCase();
  const keep = new Set<string>();
  if (q) {
    for (const { location } of all) {
      if (!location.name.toLowerCase().includes(q) && !location.description.toLowerCase().includes(q)) continue;
      let current: WarehouseLocation | undefined = location;
      while (current && current.id !== rootId) {
        keep.add(current.id);
        current = locations.find(l => l.id === current!.parentId);
      }
    }
  }
  const rows = q ? all.filter(r => keep.has(r.location.id)) : all;
  const searching = q !== '';

  // Drag and drop: the handle captures the pointer; the row moves among its siblings as the pointer crosses their midpoints
  function onHandleDown(e: PointerEvent<HTMLButtonElement>, id: string) {
    if (searching || e.button !== 0) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* no active pointer to capture (e.g. a synthetic event) */
    }
    setDragging(id);
  }
  function onHandleMove(e: PointerEvent<HTMLButtonElement>) {
    if (!dragging || !listRef.current) return;
    const parent = locations.find(l => l.id === dragging)?.parentId ?? '';
    const siblings = [...listRef.current.querySelectorAll<HTMLElement>(`li[data-parent="${parent}"]`)].filter(li => li.dataset.id !== dragging);
    const index = siblings.filter(li => {
      const r = li.getBoundingClientRect();
      return r.top + r.height / 2 < e.clientY;
    }).length;
    const next = moveAmongSiblings(locations, dragging, index);
    if (next !== locations) onChange(next);
  }
  const onHandleUp = () => setDragging(null);

  // Keyboard: ↑ / ↓ on the handle moves the row one place among its siblings
  function onHandleKey(e: KeyboardEvent<HTMLButtonElement>, id: string) {
    if ((e.key !== 'ArrowUp' && e.key !== 'ArrowDown') || searching) return;
    e.preventDefault();
    onChange(moveAmongSiblings(locations, id, siblingIndex(locations, id) + (e.key === 'ArrowUp' ? -1 : 1)));
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>(`li[data-id="${id}"] [data-handle]`)?.focus());
  }

  if (all.length === 0) {
    return <p className={`text-medium-regular ${styles.emptyRow}`}>No sublocations yet. Use the ⊕ or Add Sublocation to add one.</p>;
  }
  if (rows.length === 0) {
    return <p className={`text-medium-regular ${styles.emptyRow}`}>No locations match “{query}”.</p>;
  }
  const baseDepth = rows.reduce((min, r) => Math.min(min, r.depth), MAX_LOCATION_DEPTH);

  return (
    <>
      <ul ref={listRef} className={styles.tree} aria-label="Location structure">
        {rows.map(({ location: l, depth }) => {
          const first = siblingIndex(locations, l.id) === 0;
          const last = siblingIndex(locations, l.id) === siblingCount(locations, l.id) - 1;
          return (
            <li
              key={l.id}
              data-id={l.id}
              data-parent={l.parentId ?? ''}
              className={styles.treeRow}
              data-dragging={dragging === l.id || undefined}
              data-inactive={!l.active || undefined}
              style={{ '--depth': depth - baseDepth } as CSSProperties}
            >
              <button
                type="button"
                data-handle
                className={styles.treeHandle}
                aria-label={`Reorder ${l.name}${first && last ? '' : ': press the up or down arrow key to move it'}`}
                disabled={searching}
                onPointerDown={e => onHandleDown(e, l.id)}
                onPointerMove={onHandleMove}
                onPointerUp={onHandleUp}
                onPointerCancel={onHandleUp}
                onKeyDown={e => onHandleKey(e, l.id)}
              >
                <Icon name="drag-indicator" size={20} color="currentColor" />
              </button>
              <span className={styles.depthBadge} title={`Level ${depth}`}>
                <span className={styles.srOnly}>Level </span>
                {depth}
              </span>
              <span className={styles.treeLabel}>
                {depth > 1 && <Icon name="sub-directory" size={20} color="currentColor" className={styles.treeArrow} />}
                <span className={styles.treeName}>{l.name}</span>
                <span className={styles.treeMeta}>
                  {[l.type, !l.active && 'Inactive'].filter(Boolean).join(' · ')}
                </span>
              </span>
              <span className={styles.treeActions}>
                <IconButton
                  size="compact"
                  icon="arrow-left"
                  label={`Outdent ${l.name}`}
                  title="Outdent: move up a level"
                  disabled={searching || !l.parentId || l.parentId === rootId}
                  onClick={() => onChange(outdent(locations, l.id))}
                />
                <IconButton
                  size="compact"
                  icon="arrow-right"
                  label={`Indent ${l.name}`}
                  title="Indent: move into the location above"
                  disabled={searching || !canIndent(locations, l.id)}
                  onClick={() => onChange(indent(locations, l.id))}
                />
                <IconButton
                  size="compact"
                  icon="plus"
                  label={`Add a sublocation to ${l.name}`}
                  title={depth >= MAX_LOCATION_DEPTH ? 'Locations go 4 levels deep' : 'Add sublocation'}
                  disabled={depth >= MAX_LOCATION_DEPTH}
                  onClick={() => onAddChild(l.id)}
                />
                <IconButton size="compact" icon="edit" label={`Edit ${l.name}`} title="Edit location" onClick={() => onEdit(l)} />
              </span>
            </li>
          );
        })}
      </ul>
      {searching && <p className={`text-tiny-regular ${styles.hint}`}>Clear the search to rearrange locations.</p>}
    </>
  );
}
