import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../../../../components/Button/Button';
import { Checkbox } from '../../../../components/Checkbox/Checkbox';
import { SearchBar } from '../../../../components/SearchBar/SearchBar';
import styles from './warehouses.module.css';

/** A table's column filters: the values checked in each column's filter (a column with none checked isn't filtered). */
export type ColumnFilters = Record<string, string[]>;

/** How an empty cell shows in a filter list. */
const BLANK = '(Blank)';
/** A filter list this long or longer gets a search field above it. */
const SEARCH_FROM = 8;
/** The pop-over's width (warehouses.module.css `.filter`). */
const FILTER_WIDTH = 280;

/** The values a column's filter lists: each distinct cell text once (empty cells as "(Blank)"), in natural order. */
export function filterOptions<T>(rows: T[], text: (row: T) => string): string[] {
  const values = [...new Set(rows.map(r => text(r).trim() || BLANK))];
  return values.sort((a, b) => (a === BLANK ? 1 : b === BLANK ? -1 : a.localeCompare(b, 'en', { numeric: true })));
}

/** Whether a row passes every column filter: its cell text (or "(Blank)") is one of the checked values. */
export function matchesFilters<T>(row: T, filters: ColumnFilters, text: (row: T, key: string) => string): boolean {
  return Object.entries(filters).every(([key, values]) => values.length === 0 || values.includes(text(row, key).trim() || BLANK));
}

/** The filters with one column's checked values set (none checked removes the column's filter). */
export function withFilter(filters: ColumnFilters, key: string, values: string[]): ColumnFilters {
  const next = { ...filters };
  if (values.length) next[key] = values;
  else delete next[key];
  return next;
}

/**
 * Everything a table needs for its column filters, in one place:
 * - `matches(row)`: whether a row passes the filters (apply it with the search and view)
 * - `tableProps`: spread on DataTable (`onFilter`, `activeFilters`, `openFilter`; add `totalRows` yourself)
 * - `boxRef`: put it on the positioned box that holds the table (warehouses.module.css `.tableBox`)
 * - `popover(columns)`: render it inside that box, after the table; it shows the open column's ColumnFilter
 * `rows` are the whole list (each filter lists its column's values from all of them), `text(row, key)` a cell's text as
 * it shows. Mark only columns whose values repeat as `filterable` (DataColumn).
 */
export function useColumnFilters<T>(rows: T[], text: (row: T, key: string) => string) {
  const [filters, setFilters] = useState<ColumnFilters>({});
  const [open, setOpen] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(null), []);
  return {
    filters,
    setFilters,
    /** Removes every column filter (e.g. "Clear search and filters"). */
    clear: () => setFilters({}),
    matches: (row: T) => matchesFilters(row, filters, text),
    tableProps: {
      onFilter: (key: string) => setOpen(o => (o === key ? null : key)),
      activeFilters: Object.keys(filters),
      openFilter: open ?? undefined,
    },
    boxRef,
    popover: (columns: { key: string; label: string }[]) =>
      open && (
        <ColumnFilter
          key={open}
          anchor={boxRef.current?.querySelector<HTMLElement>(`[role="columnheader"][data-column="${open}"]`)}
          label={columns.find(c => c.key === open)?.label ?? ''}
          options={filterOptions(rows, r => text(r, open))}
          value={filters[open] ?? []}
          onApply={values => {
            setFilters(f => withFilter(f, open, values));
            setOpen(null);
          }}
          onClose={close}
        />
      ),
  };
}

/**
 * The pop-over a table header's filter icon opens (DataHeader / DataTable `onFilter`): the column's values as Volt
 * Checkboxes (Figma "Checkbox / Small", 363:5386) in the Figma "Menu Options" panel, a search field when the list is
 * long, and Clear / Apply. Checking nothing shows every row. It sits
 * 4px under the header cell it was opened from (right-aligned to it when the column is too near the right edge); put it in a positioned box that holds the table.
 */
export function ColumnFilter({
  anchor,
  label,
  options,
  value,
  onApply,
  onClose,
}: {
  /** The header cell the filter belongs to. */
  anchor: HTMLElement | null | undefined;
  label: string;
  /** The column's values (filterOptions). */
  options: string[];
  /** The values checked now. */
  value: string[];
  /** The values to show rows for; none clears the filter. */
  onApply: (values: string[]) => void;
  onClose: () => void;
}) {
  const [checked, setChecked] = useState<string[]>(value);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  // Under the header cell: its place in the table (the table starts at the top left of the box the filter sits in).
  // A column too near the right edge for the pop-over gets it right-aligned to the column instead.
  const room = (anchor?.offsetParent as HTMLElement | null)?.clientWidth ?? Infinity;
  const left = !anchor
    ? 0
    : anchor.offsetLeft + FILTER_WIDTH > room
      ? Math.max(0, anchor.offsetLeft + anchor.offsetWidth - FILTER_WIDTH)
      : anchor.offsetLeft;
  const top = anchor ? anchor.offsetTop + anchor.offsetHeight + 4 : undefined; // 4px gap, as menus open (space-4)
  const searchable = options.length >= SEARCH_FROM;
  const q = query.trim().toLowerCase();
  const shown = options.filter(o => !q || o.toLowerCase().includes(q));

  useEffect(() => {
    // Focus the search field, or else the first value's checkbox (the first input either way)
    const target = ref.current?.querySelector<HTMLElement>('input');
    target?.focus();
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node) && !(e.target as Element).closest('[role="columnheader"]')) onClose();
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [onClose, searchable]);

  return (
    <div
      ref={ref}
      className={styles.filter}
      style={{ left, top }}
      role="dialog"
      aria-label={`Filter ${label}`}
      onKeyDown={e => {
        if (e.key === 'Escape') onClose();
      }}
    >
      {searchable && (
        <div className={styles.filterSearch}>
          <SearchBar aria-label={`Search ${label} values`} placeholder="Search" value={query} onChange={setQuery} />
        </div>
      )}
      {/* Each value is a Volt Checkbox, Figma "Checkbox / Small" (363:5386) */}
      <div className={styles.filterList} role="group" aria-label={`${label} values`}>
        {shown.length === 0 ? (
          <p className={`text-medium-regular ${styles.filterEmpty}`}>No matching values</p>
        ) : (
          shown.map(o => (
            <Checkbox
              key={o}
              size="small"
              label={o}
              checked={checked.includes(o)}
              onChange={e => setChecked(c => (e.target.checked ? [...c, o] : c.filter(v => v !== o)))}
            />
          ))
        )}
      </div>
      <div className={styles.filterActions}>
        <Button size="small" variant="outline" type="button" onClick={() => onApply([])}>
          Clear
        </Button>
        <Button size="small" variant="brand" type="button" onClick={() => onApply(checked)}>
          Apply
        </Button>
      </div>
    </div>
  );
}
