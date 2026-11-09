import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Status } from '../../../../../components/Status/Status';
import { Button } from '../../../../../components/Button/Button';
import { ButtonGroup, ButtonGroupItem } from '../../../../../components/ButtonGroup/ButtonGroup';
import { Checkbox } from '../../../../../components/Checkbox/Checkbox';
import { ContextMenu } from '../../../../../components/ContextMenu/ContextMenu';
import type { DataSort } from '../../../../../components/DataHeader/DataHeader';
import { Icon } from '../../../../../components/Icon/Icon';
import { SearchInput } from '../../../../../components/SearchBar/SearchBar';
import { Tooltip } from '../../../../../components/Tooltip/Tooltip';
import { AppModal } from '../../../../components/AppModal';
import { TYPE_ICON, type Item } from './itemData';
import record from '../record.module.css';
import table from '../table.module.css';
import styles from './items.module.css';

/** Small pieces shared by the Items list and the item record tabs. */

export const required = (text: string): ReactNode => (
  <>
    {text} <span className={record.requiredMark}>*</span>
  </>
);
export const requiredNote = (
  <span className="text-small-regular">
    <span className={record.requiredMark}>*</span>Indicates required field
  </span>
);
export const options = (list: string[]) => list.map(v => ({ value: v, label: v }));

/** Clicking a sort icon: ascending, then descending. */
export const nextSort = (key: string) => (s: DataSort | undefined): DataSort =>
  s?.key === key ? { key, direction: s.direction === 'ascending' ? 'descending' : 'ascending' } : { key, direction: 'ascending' };

/** Sorts rows by a column's value (numbers numerically, everything else as text). */
export function sortRows<T>(rows: T[], sort: DataSort | undefined, value: (row: T, key: string) => string | number) {
  if (!sort) return rows;
  const dir = sort.direction === 'ascending' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = value(a, sort.key);
    const y = value(b, sort.key);
    return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * dir;
  });
}

/** Row selection with a Set of ids. */
export function useSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  return {
    selected,
    toggle: (id: string, on: boolean) =>
      setSelected(s => {
        const next = new Set(s);
        if (on) next.add(id);
        else next.delete(id);
        return next;
      }),
    setMany: (ids: string[], on: boolean) =>
      setSelected(s => {
        const next = new Set(s);
        ids.forEach(id => (on ? next.add(id) : next.delete(id)));
        return next;
      }),
    clear: () => setSelected(new Set()),
  };
}

/** A row's Active / Inactive status: Volt's Status (a dot and the word). `data-status` lets table.module.css start it at the left of its cell. */
export function StatusPill({ active }: { active: boolean }) {
  return <Status active={active} data-status />;
}

/** Figma's ⓘ after a checkbox: a focusable info icon with a tooltip. */
export function InfoTip({ label, text, position = 'top' }: { label: string; text: string; position?: 'top' | 'left' }) {
  return (
    <Tooltip label={text} size="large" position={position}>
      <button type="button" className={styles.infoButton} aria-label={`About ${label}`}>
        <Icon name="information" size={20} color="currentColor" />
      </button>
    </Tooltip>
  );
}

/** A checkbox with Figma's ⓘ beside it. These sit at the right end of card title rows, so the tip opens to the left. */
export function InfoCheckbox({ label, info, checked, onChange }: { label: string; info: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <span className={styles.infoCheck}>
      <Checkbox size="small" label={label} checked={checked} onChange={e => onChange(e.target.checked)} />
      <InfoTip label={label} text={info} position="left" />
    </span>
  );
}

/** A brand button that opens a menu under it, e.g. Figma's `Add New ▾`. */
export function MenuButton({
  label,
  icon,
  items,
  variant = 'brand',
}: {
  label: string;
  icon?: string;
  items: { label: string; icon: string; onSelect: () => void; disabled?: boolean }[];
  variant?: 'brand' | 'primary';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);
  return (
    <div ref={ref} className={styles.menuAnchor}>
      <Button size="small" variant={variant} icon={icon ?? 'chevron-down'} iconPosition={icon ? 'left' : 'right'} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        {label}
      </Button>
      {open && (
        <div className={styles.menuPop}>
          <ContextMenu
            aria-label={label}
            autoFocus
            onClose={() => setOpen(false)}
            items={items.map(item => ({
              ...item,
              onSelect: () => {
                setOpen(false);
                item.onSelect();
              },
            }))}
          />
        </div>
      )}
    </div>
  );
}

export type ColumnOption = { key: string; label: string; locked?: boolean };

/** " Item # and Name always show." for the locked columns. */
function lockedNote(columns: ColumnOption[]) {
  const locked = columns.filter(c => c.locked).map(c => c.label);
  if (!locked.length) return '';
  const names = locked.length === 1 ? locked[0] : `${locked.slice(0, -1).join(', ')} and ${locked[locked.length - 1]}`;
  return ` ${names} always ${locked.length === 1 ? 'shows' : 'show'}.`;
}

/** Columns: choose which columns the table shows. Locked columns (e.g. the item # and name) always show. */
export function ColumnsModal({
  open,
  columns,
  visible,
  onApply,
  onClose,
}: {
  open: boolean;
  columns: ColumnOption[];
  visible: string[];
  onApply: (keys: string[]) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<string[]>(visible);
  useEffect(() => {
    if (open) setDraft(visible);
  }, [open, visible]);
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Edit Columns"
      description={`Choose the columns this table shows.${lockedNote(columns)}`}
      startAction={{ label: 'Show All', onClick: () => setDraft(columns.map(c => c.key)) }}
      primaryAction={{ label: 'Apply', onClick: () => onApply(columns.map(c => c.key).filter(k => draft.includes(k))) }}
    >
      <div className={styles.checkGrid}>
        {columns.map(c => (
          <Checkbox
            key={c.key}
            size="small"
            label={c.label}
            checked={c.locked || draft.includes(c.key)}
            disabled={c.locked}
            onChange={e => setDraft(d => (e.target.checked ? [...d, c.key] : d.filter(k => k !== c.key)))}
          />
        ))}
      </div>
    </AppModal>
  );
}

/**
 * Search-to-pick for items (Merging, Add Replacement, the Build search, …): type a name or #, then pick a result.
 * The list shows up to eight matches.
 */
export function ItemPicker({
  items,
  onPick,
  label,
  placeholder = 'Search by # or name',
  autoFocus,
  side,
}: {
  items: Item[];
  onPick: (item: Item) => void;
  label: string;
  placeholder?: string;
  autoFocus?: boolean;
  /** Extra text at the right of a result. */
  side?: (item: Item) => ReactNode;
}) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const results = q ? items.filter(i => `${i.id} ${i.customNumber} ${i.name}`.toLowerCase().includes(q)).slice(0, 8) : [];
  return (
    <div className={styles.picker}>
      <SearchInput aria-label={label} placeholder={placeholder} value={query} onChange={e => setQuery(e.target.value)} autoFocus={autoFocus} />
      {q && results.length === 0 && <p className={`text-medium-regular ${record.noResults}`}>Nothing matches “{query}”.</p>}
      {results.length > 0 && (
        <ul className={record.results} aria-label={`${label} results`}>
          {results.map(i => (
            <li key={i.id}>
              <button
                type="button"
                className={record.result}
                onClick={() => {
                  onPick(i);
                  setQuery('');
                }}
              >
                <Icon name={TYPE_ICON[i.type]} size={24} color="currentColor" />
                <span className={record.resultText}>
                  <span className={record.resultName}>{i.name}</span>
                  <span className={record.resultSub}>{i.id}</span>
                </span>
                <span className={record.resultSide}>{side ? side(i) : <strong>{i.type}</strong>}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A card with a title row and an optional button (record.module.css card). */
export function Card({ title, id, action, children, className }: { title?: string; id: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={[record.card, className].filter(Boolean).join(' ')} aria-labelledby={title ? id : undefined} aria-label={title ? undefined : id}>
      <div className={record.cardHead} data-align={title ? undefined : 'end'}>
        {title && (
          <h2 id={id} className={record.cardTitle}>
            {title}
          </h2>
        )}
        {action && <div className={styles.cardActions}>{action}</div>}
      </div>
      {children}
    </section>
  );
}

/** A switch between a few options (Figma Button Group): Overview | Stock, Standard | Extended, Package | Case | … */
export function Segment<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <ButtonGroup aria-label={label}>
      {options.map(o => (
        <ButtonGroupItem key={o.value} className={styles.segment} aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </ButtonGroupItem>
      ))}
    </ButtonGroup>
  );
}

/** Drag-to-reorder for a short list of rows (Figma's draggable price rows). Spread `rowProps(i)` on each row. */
export function useDragList<T>(list: T[], onChange: (next: T[]) => void) {
  const [dragging, setDragging] = useState<number | null>(null);
  return {
    dragging,
    rowProps: (index: number) => ({
      draggable: true,
      'data-dragging': dragging === index || undefined,
      onDragStart: () => setDragging(index),
      onDragEnd: () => setDragging(null),
      onDragOver: (e: { preventDefault: () => void }) => {
        e.preventDefault();
        if (dragging === null || dragging === index) return;
        const next = [...list];
        const [moved] = next.splice(dragging, 1);
        next.splice(index, 0, moved);
        setDragging(index);
        onChange(next);
      },
    }),
  };
}

/** The drag handle at the start of a draggable row. */
export function DragHandle() {
  return (
    <span className={styles.dragHandle} aria-hidden>
      <Icon name="drag-indicator" size={24} color="currentColor" />
    </span>
  );
}

/** A trash button for a table or form row. */
export function TrashButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className={styles.trash} aria-label={label} title={label} onClick={onClick}>
      <Icon name="delete" size={24} color="currentColor" />
    </button>
  );
}
