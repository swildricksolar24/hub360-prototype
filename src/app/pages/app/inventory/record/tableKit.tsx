import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '../../../../../components/Button/Button';
import { ButtonGroup, ButtonGroupItem } from '../../../../../components/ButtonGroup/ButtonGroup';
import { Checkbox } from '../../../../../components/Checkbox/Checkbox';
import { ContextMenu } from '../../../../../components/ContextMenu/ContextMenu';
import type { DataColumn, DataSort } from '../../../../../components/DataHeader/DataHeader';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { Icon } from '../../../../../components/Icon/Icon';
import { PageTracker } from '../../../../../components/PageTracker/PageTracker';
import { SearchInput } from '../../../../../components/SearchBar/SearchBar';
import { Tooltip } from '../../../../../components/Tooltip/Tooltip';
import { Status } from '../../../../../components/Status/Status';
import { AppModal } from '../../../../components/AppModal';
import styles from '../record.module.css';
import table from '../table.module.css';

/*
 * Shared pieces of the warehouse record's tables (WAREHOUSE_RECORD.md "Standard table"): search, sort, selection and
 * paging state, the toolbar (Figma: View ▾ · Columns · Upload · Actions ▾ · Search), Edit Columns, the status pill,
 * a brand menu button (Add New ▾), the segmented Overview / Structure switch and the ⓘ tooltips.
 */

/** Rows per page options for every Inventory table's PageTracker. */
export const PAGE_SIZES = [10, 25, 50, 100];
export const count = (n: number) => n.toLocaleString('en-US');

/** A header's sort icon: ascending first, then descending. */
export const nextSort = (s: DataSort | undefined, key: string): DataSort =>
  s?.key === key ? { key, direction: s.direction === 'ascending' ? 'descending' : 'ascending' } : { key, direction: 'ascending' };

/**
 * Search, sort, selection and paging for one table. `search` gives a row's searchable text, `sortValue` its value for a
 * column; `filter` (e.g. a View) narrows the rows first. `paged: false` shows every row (no PageTracker).
 */
export function useTableControls<T extends { id: string }>(
  all: T[],
  {
    search,
    sortValue,
    filter,
    pinFirst,
    paged = true,
  }: {
    search: (row: T) => string;
    sortValue: (row: T, key: string) => string | number;
    filter?: (row: T) => boolean;
    /** Rows that always come first, whatever the sort (e.g. the primary contact); the rest keep their order. */
    pinFirst?: (row: T) => boolean;
    paged?: boolean;
  },
) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<DataSort | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const q = query.trim().toLowerCase();
  let rows = all.filter(r => (!filter || filter(r)) && (!q || search(r).toLowerCase().includes(q)));
  if (sort) {
    const dir = sort.direction === 'ascending' ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      const x = sortValue(a, sort.key);
      const y = sortValue(b, sort.key);
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'en', { numeric: true })) * dir;
    });
  }
  if (pinFirst) rows = [...rows.filter(pinFirst), ...rows.filter(r => !pinFirst(r))];
  const pageCount = paged ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;
  const current = Math.min(page, pageCount);
  const pageRows = paged ? rows.slice((current - 1) * pageSize, current * pageSize) : rows;
  useEffect(() => setPage(1), [query, pageSize]);

  const pageIds = pageRows.map(r => r.id);
  const toggle = (id: string, on: boolean) =>
    setSelected(s => {
      const next = new Set(s);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  return {
    query,
    setQuery,
    rows,
    pageRows,
    page: current,
    setPage,
    pageCount,
    pageSize,
    setPageSize,
    selected,
    /** The rows still in the list that are checked. */
    selectedRows: all.filter(r => selected.has(r.id)),
    clearSelection: () => setSelected(new Set()),
    /** Props for DataHeader: sort icons and the select-all checkbox (this page's rows). */
    headerProps: {
      sort,
      onSortChange: (key: string) => setSort(s => nextSort(s, key)),
      allSelected: pageIds.length > 0 && pageIds.every(id => selected.has(id)),
      onSelectAllChange: (on: boolean) =>
        setSelected(s => {
          const next = new Set(s);
          pageIds.forEach(id => (on ? next.add(id) : next.delete(id)));
          return next;
        }),
    },
    /** Props for one DataRow's checkbox. */
    rowSelect: (id: string) => ({ selected: selected.has(id), onSelectedChange: (on: boolean) => toggle(id, on) }),
    /** Volt DataTable's selection props (`selected` ids and `onSelectedChange`), for tables built on DataTable. */
    selectProps: { selected: [...selected], onSelectedChange: (ids: string[]) => setSelected(new Set(ids)) },
  };
}
export type TableControls<T extends { id: string }> = ReturnType<typeof useTableControls<T>>;

/** The standard pager under a table (Figma "Page Tracker": 10 / 25 / 50 rows, 5 page buttons). */
export function Pager<T extends { id: string }>({ table: t, label }: { table: TableControls<T>; label: string }) {
  return (
    <PageTracker
      page={t.page}
      pageCount={t.pageCount}
      onPageChange={t.setPage}
      pageSize={t.pageSize}
      pageSizeOptions={PAGE_SIZES}
      onPageSizeChange={t.setPageSize}
      maxPageButtons={5}
      label={label}
    />
  );
}

/** A row's Active / Inactive status: Volt's Status (a dot and the word). `data-status` lets table.module.css start it at the left of its cell. */
export function StatusPill({ active }: { active: boolean }) {
  return <Status active={active} data-status />;
}

/* ---------- Columns ---------- */

/**
 * Which columns a table shows. Columns with a hidden label (the status pill) always stay; the others can be turned
 * off in Edit Columns.
 */
export function useColumns(all: DataColumn[]) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  return {
    columns: all.filter(c => !hidden.has(c.key)),
    open,
    setOpen,
    modal: (
      <ColumnsModal
        open={open}
        choices={all.filter(c => !c.labelHidden)}
        visible={all.filter(c => !hidden.has(c.key)).map(c => c.key)}
        onClose={() => setOpen(false)}
        onApply={keys => {
          setHidden(new Set(all.filter(c => !c.labelHidden && !keys.includes(c.key)).map(c => c.key)));
          setOpen(false);
        }}
      />
    ),
  };
}

/** Edit Columns for a record table: check the columns to show. (The Warehouses list has the full Figma modal.) */
function ColumnsModal({
  open,
  choices,
  visible,
  onClose,
  onApply,
}: {
  open: boolean;
  choices: DataColumn[];
  visible: string[];
  onClose: () => void;
  onApply: (keys: string[]) => void;
}) {
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (open) setChosen(new Set(visible));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const shown = choices.filter(c => chosen.has(c.key));
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Edit Columns"
      description="Choose the columns this table shows. At least one column stays on."
      primaryAction={{ label: 'Apply', disabled: shown.length === 0, onClick: () => onApply(shown.map(c => c.key)) }}
    >
      <div className={styles.columnChoices} role="group" aria-label="Columns">
        {choices.map(c => (
          <Checkbox
            key={c.key}
            size="small"
            label={c.label}
            checked={chosen.has(c.key)}
            onChange={e =>
              setChosen(s => {
                const next = new Set(s);
                if (e.target.checked) next.add(c.key);
                else next.delete(c.key);
                return next;
              })
            }
          />
        ))}
      </div>
    </AppModal>
  );
}

/* ---------- Toolbar ---------- */

export type ToolbarOption = { value: string; label: string; disabled?: boolean };

/**
 * The record tables' toolbar, as in the Warehouses list: an optional lead (the Overview / Structure switch and its
 * divider), View ▾, Columns, Upload, Actions ▾, Search and a trailing brand button. Leave a prop out to drop its control.
 */
export function TableToolbar({
  label,
  lead,
  view,
  onColumns,
  onUpload,
  actions,
  search,
  trailing,
}: {
  label: string;
  lead?: ReactNode;
  view?: { options: ToolbarOption[]; value: string; onChange: (value: string) => void };
  onColumns?: () => void;
  onUpload?: () => void;
  actions?: { options: ToolbarOption[]; onAction: (value: string) => void; selectedCount: number };
  search: { value: string; onChange: (value: string) => void; label: string };
  trailing?: ReactNode;
}) {
  return (
    <div className={styles.toolbar} role="toolbar" aria-label={label}>
      {lead && (
        <>
          {lead}
          <span className={styles.toolbarDivider} aria-hidden />
        </>
      )}
      {view && (
        <Dropdown
          variant="small"
          label="View"
          hideLabel
          options={view.options}
          value={view.value}
          onChange={v => view.onChange(v as string)}
          renderValue={sel => `View: ${sel[0]?.label ?? 'All'}`}
        />
      )}
      {onColumns && (
        <Button size="small" variant="primary" icon="view-column" onClick={onColumns}>
          Columns
        </Button>
      )}
      {onUpload && (
        <Button size="small" variant="primary" icon="upload" onClick={onUpload}>
          Upload
        </Button>
      )}
      {actions && (
        <Dropdown
          variant="small"
          label="Actions"
          hideLabel
          placeholder="Actions"
          options={actions.options}
          // A menu of commands: nothing stays selected
          value={null}
          onChange={v => actions.onAction(v as string)}
          renderValue={() => (actions.selectedCount ? `Actions (${actions.selectedCount})` : 'Actions')}
        />
      )}
      <SearchInput className={styles.toolbarSearch} aria-label={search.label} placeholder="Search" value={search.value} onChange={e => search.onChange(e.target.value)} />
      {trailing}
    </div>
  );
}

/** Figma's segmented switch (ButtonGroup), at the toolbar's 44px height; the chosen part is pressed. */
export function Segmented<V extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: V; label: string }[];
  value: V;
  onChange: (value: V) => void;
}) {
  return (
    <ButtonGroup aria-label={label} className={styles.segmented}>
      {options.map(o => (
        <ButtonGroupItem key={o.value} className={styles.segment} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </ButtonGroupItem>
      ))}
    </ButtonGroup>
  );
}

/** A brand button with a ▾ that opens a menu (Figma "Add New ▾", "Add Item ▾"). Escape returns focus to the button. */
export function MenuButton({
  label,
  icon,
  items,
}: {
  label: string;
  /** An icon before the label (e.g. "plus" on Add Item), in place of the ▾ chevron after it; Volt's Button holds one icon */
  icon?: string;
  items: { label: string; icon?: string; onSelect: () => void }[];
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
    <div ref={ref} className={styles.menuButton}>
      <Button
        size="small"
        variant="brand"
        icon={icon ?? 'chevron-down'}
        iconPosition={icon ? 'left' : 'right'}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        {label}
      </Button>
      {open && (
        <div className={styles.menuPopup}>
          <ContextMenu
            aria-label={label}
            autoFocus
            items={items}
            onClose={() => {
              setOpen(false);
              ref.current?.querySelector('button')?.focus();
            }}
          />
        </div>
      )}
    </div>
  );
}

/** An ⓘ button with a tooltip (Figma's info icons). A real button, so the tooltip shows on keyboard focus too. */
export function InfoTip({ label, text, position = 'top' }: { label: string; text: string; position?: 'top' | 'left' }) {
  return (
    <Tooltip label={text} size="large" position={position}>
      <button type="button" className={styles.infoTip} aria-label={`About ${label}`}>
        <Icon name="information" size={20} color="currentColor" />
      </button>
    </Tooltip>
  );
}

/**
 * A small checkbox followed by its ⓘ (kept outside the label, so pressing ⓘ doesn't toggle the box). These sit at the
 * right end of card title rows, so the tip opens to the left.
 */
export function CheckboxWithInfo({
  label,
  info,
  checked,
  onChange,
}: {
  label: string;
  info: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <span className={styles.checkInfo}>
      <Checkbox size="small" label={label} checked={checked} onChange={e => onChange(e.target.checked)} />
      <InfoTip label={label} text={info} position="left" />
    </span>
  );
}
