import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { DataTable, type DataColumn, type DataSort } from './DataTable';
import { EditableCell } from '../EditableCell/EditableCell';
import { Toggle } from '../Toggle/Toggle';
import { figma } from '../../storybook/figma';
import { pseudoStates } from '../../storybook/StateGrid';

type Row = { id: string; code: string; name: string; city: string; value: number; locations: number };

const COLUMNS: DataColumn[] = [
  { key: 'code', label: 'Code', width: 120 },
  { key: 'name', label: 'Name', width: 'fill' },
  { key: 'city', label: 'City', width: 180 },
  { key: 'value', label: 'Inventory Value', width: 160, align: 'end' },
  { key: 'locations', label: 'Locations', width: 120, align: 'end' },
];

const ROWS: Row[] = [
  { id: 'PHX-124', code: 'PHX-124', name: 'Phoenix WH', city: 'Phoenix, AZ', value: 1240500.5, locations: 42 },
  { id: 'TUC-125', code: 'TUC-125', name: 'Tucson WH', city: 'Tucson, AZ', value: 988015.02, locations: 31 },
  { id: 'DAL-310', code: 'DAL-310', name: 'Dallas Distribution', city: 'Dallas, TX', value: 2310440, locations: 68 },
  { id: 'TOR-001', code: 'TOR-001', name: 'Toronto WH', city: 'Toronto, ON', value: 455120.75, locations: 17 },
  { id: 'MEX-020', code: 'MEX-020', name: 'Monterrey WH', city: 'Monterrey, NL', value: 302900, locations: 12 },
];

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const cells = (r: Row) => ({ code: r.code, name: r.name, city: r.city, value: money(r.value), locations: r.locations });

/** The blank table as drawn in Figma: Column 1–5, every value "Value". */
const BLANK_COLUMNS: DataColumn[] = [1, 2, 3, 4, 5].map(i => ({ key: `c${i}`, label: `Column ${i}`, width: 'fill' }));
const BLANK_ROWS = [1, 2, 3, 4, 5].map(i => ({ id: `row-${i}` }));
const blankCells = () => Object.fromEntries(BLANK_COLUMNS.map(c => [c.key, 'Value']));

const meta = {
  title: 'Components/Data Display/DataTable',
  component: DataTable<Row>,
  args: {
    'aria-label': 'Warehouses',
    columns: COLUMNS,
    rows: ROWS,
    cells,
    rowLabel: r => r.name,
    selectable: true,
    actions: true,
    actionsVisible: false,
    striped: true,
  },
  argTypes: {
    columns: { control: false },
    rows: { control: false },
    cells: { control: false },
  },
  // Tables sit on a card (Surfaces/Overlay), like every table in the prototype
  decorators: [
    Story => (
      <div style={{ padding: 'var(--space-24) 0', borderRadius: 'var(--radius-12)', background: 'var(--color-surfaces-overlay)' }}>{Story()}</div>
    ),
  ],
} satisfies Meta<typeof DataTable<Row>>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Live controls, with working sort and selection. */
export const Playground: Story = {
  render: function Render(args) {
    const [sort, setSort] = useState<DataSort>();
    const [selected, setSelected] = useState<string[]>(['TUC-125']);
    const rows = sort
      ? [...args.rows].sort((a, b) => {
          const k = sort.key as keyof Row;
          const x = a[k];
          const y = b[k];
          const d = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
          return sort.direction === 'ascending' ? d : -d;
        })
      : args.rows;
    return (
      <DataTable
        {...args}
        rows={rows}
        sort={sort}
        onSortChange={key => setSort(s => ({ key, direction: s?.key === key && s.direction === 'ascending' ? 'descending' : 'ascending' }))}
        selected={selected}
        onSelectedChange={args.selectable ? setSelected : undefined}
      />
    );
  },
};

/** Figma Data Table: the blank table, Data Table Header + five rows (first, third and fifth striped). */
export const BlankTable: Story = {
  render: function Render() {
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <DataTable
        aria-label="Blank table"
        columns={BLANK_COLUMNS}
        rows={BLANK_ROWS}
        cells={blankCells}
        selected={selected}
        onSelectedChange={setSelected}
        actions
        actionsVisible
      />
    );
  },
  parameters: { ...figma('3131:272', 'Data Table › Data Table'), controls: { disable: true } },
};

const Caption = ({ children }: { children: string }) => (
  <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)', padding: '0 var(--space-24)' }}>
    {children}
  </figcaption>
);

const State = ({ name, className, children }: { name: string; className?: string; children: ReactNode }) => (
  <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
    <Caption>{`State=${name}`}</Caption>
    <div className={className}>{children}</div>
  </figure>
);

// A no-op handler keeps the checkboxes live (without one they render read-only), so each state shows as in Figma
const noop = () => {};
const oneRow = (props: { striped?: boolean; selected?: string[] }) => (
  <DataTable aria-label="Row" columns={BLANK_COLUMNS} rows={BLANK_ROWS.slice(0, 1)} cells={blankCells} onSelectedChange={noop} actions actionsVisible {...props} />
);

/** Figma Data Table Row: Default, Striped, Hover (pointer over the row) and Selected (checked). */
export const RowStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
      <State name="Default">{oneRow({ striped: false })}</State>
      <State name="Striped">{oneRow({ striped: true })}</State>
      <State name="Hover" className="state-hover">
        {oneRow({ striped: false })}
      </State>
      <State name="Selected">{oneRow({ striped: false, selected: ['row-1'] })}</State>
    </div>
  ),
  parameters: { ...figma('3131:246', 'Data Table › Data Table Row'), ...pseudoStates, controls: { disable: true } },
};

/** Figma Data Table Header: `Checkbox` and `Actions` on and off (the columns stay lined up with the rows). */
export const Header: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
      <State name="Checkbox + Actions">
        <DataTable aria-label="Header with checkbox and actions" columns={BLANK_COLUMNS} rows={[]} cells={blankCells} onSelectedChange={noop} actions empty={null} />
      </State>
      <State name="No Checkbox, no Actions">
        <DataTable aria-label="Header only" columns={BLANK_COLUMNS} rows={[]} cells={blankCells} empty={null} />
      </State>
    </div>
  ),
  parameters: { ...figma('3131:247', 'Data Table › Data Table Header'), controls: { disable: true } },
};

/** No rows: the header and a message in place of the rows. */
export const Empty: Story = {
  args: { rows: [], empty: 'No warehouses yet. Use Add Warehouse to create one.' },
};

/** Inactive rows: the values switch to the weak text color. */
export const InactiveRows: Story = {
  args: { inactive: r => r.locations < 20 },
};

/** `loading`: five skeleton rows (`loadingRows`) in place of the rows, and `aria-busy` on the table. */
export const Loading: Story = {
  args: { loading: true },
};

/**
 * `onFilter` + `activeFilters`: columns with `filterable` show a filter icon before the sort icon; an active filter
 * shows "Filter - Active" (City here) and keeps its icon visible. Clicks show in the Actions panel.
 */
export const ColumnFilters: Story = {
  args: {
    columns: COLUMNS.map(c => (c.key === 'city' || c.key === 'name' ? { ...c, filterable: true } : c)),
    onFilter: fn(),
    activeFilters: ['city'],
  },
};

/**
 * `summary`: a bold Totals row after the rows on the header's teal tint (Figma Stock 76:11638), named "Totals" for
 * screen readers (`summaryLabel`). It has no checkbox, ••• or stripe; its values sit under their headers.
 */
export const WithTotals: Story = {
  name: 'Summary row (Totals)',
  args: {
    summary: {
      code: 'Totals',
      value: money(ROWS.reduce((sum, r) => sum + r.value, 0)),
      locations: ROWS.reduce((sum, r) => sum + r.locations, 0),
    },
  },
};

type Contact = { id: string; name: string; email: string; phone: string; address: string; city: string; role: string };

/**
 * Preferred widths, minimum widths and priorities. Name and Email shrink to their `minWidth` (wrapping onto up to 2
 * lines); Phone (priority 3) hides first, then Address (2), then Role (1); Name and Email never hide.
 */
const FIT_COLUMNS: DataColumn[] = [
  { key: 'name', label: 'Name', width: 220, minWidth: 140 },
  { key: 'email', label: 'Email', width: 260, minWidth: 160 },
  { key: 'role', label: 'Role', width: 140, minWidth: 110, priority: 1 },
  { key: 'phone', label: 'Phone', width: 160, priority: 3 },
  { key: 'address', label: 'Address', width: 'fill', minWidth: 180, priority: 2 },
  { key: 'city', label: 'City', width: 150, minWidth: 110 },
];

const CONTACTS: Contact[] = [
  { id: 'c1', name: 'Oswald Cobblepot', email: 'oswald.cobblepot@phoenixwh.example.com', phone: '(602) 555-0142', address: '4410 E Broadway Rd, Building C, Dock 4', city: 'Phoenix, AZ', role: 'Warehouse Manager' },
  { id: 'c2', name: 'Selina Kyle', email: 'skyle@phoenixwh.example.com', phone: '(602) 555-0188', address: '4410 E Broadway Rd', city: 'Phoenix, AZ', role: 'Receiving' },
  { id: 'c3', name: 'Lucius Fox-Wellington', email: 'lucius.fox-wellington@tucsonwh.example.com', phone: '(520) 555-0110', address: '1801 S Park Ave, Suite 200', city: 'Tucson, AZ', role: 'Shipping Lead' },
  { id: 'c4', name: 'Harvey Dent', email: 'hdent@dallas.example.com', phone: '(214) 555-0167', address: '900 Distribution Pkwy', city: 'Dallas, TX', role: 'Inventory' },
];

/**
 * The table fits its card instead of scrolling: frames 1440, 1024 and 800px wide. Flexible columns shrink first (text
 * wraps onto 2 lines), then columns with a `priority` hide. The side inset and cell gap (--table-inset / --table-gap)
 * follow the browser window, not the frame: 24 / 16 above 1024px, 16 / 12 up to 1024px, 12 / 8 up to 767px.
 */
export const FitsItsCard: Story = {
  name: 'Fits its card',
  render: function Render() {
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
        {[1440, 1024, 800].map(width => (
          <figure key={width} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            <Caption>{`${width}px card`}</Caption>
            <div style={{ width, maxWidth: '100%' }}>
              <DataTable
                aria-label={`Contacts, ${width}px`}
                columns={FIT_COLUMNS}
                rows={CONTACTS}
                cells={c => ({ ...c })}
                rowLabel={c => c.name}
                selected={selected}
                onSelectedChange={setSelected}
                actions
              />
            </div>
          </figure>
        ))}
      </div>
    );
  },
  parameters: { controls: { disable: true } },
};

/**
 * Controls in cells: an element value takes the cell's full width, so an EditableCell (input or select) stretches to
 * its column, in a minWidth column and in a fill column alike, never clipped; a long select value ellipsizes. Text
 * values still clamp to 2 lines; a Toggle keeps its own size.
 */
export const ControlsInCells: Story = {
  name: 'Controls in cells',
  render: function Render() {
    const [rows, setRows] = useState([
      { id: 'd1', name: 'Shipping labels for outbound parcels at Dock 4', printer: 'Dock 4 Zebra', size: '4 × 6', copies: '1', on: true },
      { id: 'd2', name: 'Receiving', printer: 'Office laser (second floor, by the stairs)', size: '4 × 4', copies: '2', on: false },
    ]);
    const set = (id: string, patch: Partial<(typeof rows)[number]>) => setRows(rs => rs.map(r => (r.id === id ? { ...r, ...patch } : r)));
    const printers = ['Dock 4 Zebra', 'Receiving', 'Office laser (second floor, by the stairs)'];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
        {[1100, 760].map(width => (
          <figure key={width} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            <Caption>{`${width}px card`}</Caption>
            <div style={{ width, maxWidth: '100%' }}>
              <DataTable
                aria-label={`Default use, ${width}px`}
                columns={[
                  { key: 'name', label: 'Use', width: 220, minWidth: 140 },
                  { key: 'printer', label: 'Default Printer', width: 220, minWidth: 160 },
                  { key: 'size', label: 'Label Size', width: 'fill', minWidth: 120 },
                  { key: 'copies', label: 'Copies', width: 'fill' },
                  { key: 'on', label: 'Active', width: 120, sortable: false },
                ]}
                rows={rows}
                cells={r => ({
                  name: r.name,
                  printer: <EditableCell label="Default Printer" type="select" options={printers} value={r.printer} onValueChange={v => set(r.id, { printer: v })} />,
                  size: <EditableCell label="Label Size" type="select" options={['4 × 6', '4 × 4', '2 × 1']} value={r.size} onValueChange={v => set(r.id, { size: v })} />,
                  copies: <EditableCell label="Copies" value={r.copies} inputType="number" onValueChange={v => set(r.id, { copies: v })} />,
                  on: <Toggle aria-label="Active" checked={r.on} onChange={e => set(r.id, { on: e.target.checked })} />,
                })}
                rowLabel={r => r.name}
                actions
                actionsVisible
              />
            </div>
          </figure>
        ))}
      </div>
    );
  },
  parameters: { controls: { disable: true } },
};

/**
 * Short headers in narrow columns (80 / 100px): the sort and filter icons take no room while hidden, so "Size" and
 * "Copies" show in full; hover the header (or tab to an icon) and the icons appear, the labels ellipsizing to fit.
 * Copies is sorted, so its icon stays.
 */
export const NarrowColumns: Story = {
  name: 'Narrow columns',
  render: () => (
    <DataTable
      aria-label="Default use"
      columns={[
        { key: 'use', label: 'Use', width: 'fill', minWidth: 140 },
        { key: 'size', label: 'Size', width: 80, filterable: true },
        { key: 'copies', label: 'Copies', width: 100, align: 'end' },
        { key: 'auto', label: 'Prints Automatically When', width: 202, minWidth: 160, filterable: true },
      ]}
      rows={[
        { id: 'u1', use: 'Shipping labels', size: '4 × 6', copies: '1', auto: 'Order is packed' },
        { id: 'u2', use: 'Pick lists', size: 'Letter', copies: '2', auto: 'Wave is released' },
      ]}
      cells={r => ({ ...r })}
      sort={{ key: 'copies', direction: 'ascending' }}
      onSortChange={noop}
      onSelectedChange={noop}
      actions
    />
  ),
  parameters: { controls: { disable: true } },
};

type Carrier = { id: string; name: string; account: string; nickname: string; billing: string; services: string; status: string };

/** Like the app's Carrier Accounts: five fill columns whose header labels are wider than their minWidth, plus Status. */
const CARRIER_COLUMNS: DataColumn[] = [
  { key: 'name', label: 'Carrier Name', width: 'fill', minWidth: 80 },
  { key: 'account', label: 'Account Number', width: 'fill', minWidth: 90 },
  { key: 'nickname', label: 'Account Nickname', width: 'fill', minWidth: 110 },
  { key: 'billing', label: 'Billing Type', width: 'fill', minWidth: 90 },
  { key: 'services', label: 'Service Types', width: 'fill', minWidth: 110 },
  { key: 'status', label: 'Status', width: 120 },
];
const CARRIERS: Carrier[] = [
  { id: 'k1', name: 'UPS', account: '1Z99-4410-22', nickname: 'Phoenix outbound ground', billing: 'Prepaid', services: 'Ground, 2nd Day Air', status: 'Active' },
  { id: 'k2', name: 'FedEx', account: '7700-1182-09', nickname: 'Freight', billing: 'Third party', services: 'Freight Priority', status: 'Active' },
  { id: 'k3', name: 'USPS', account: '55-0912', nickname: 'Small parcels', billing: 'Prepaid', services: 'Priority Mail', status: 'Inactive' },
];

/** Like the app's Printers: four fill columns with minWidths. */
const PRINTER_COLUMNS: DataColumn[] = [
  { key: 'name', label: 'Printer Name', width: 'fill', minWidth: 120 },
  { key: 'model', label: 'Model', width: 'fill', minWidth: 100 },
  { key: 'location', label: 'Location', width: 'fill', minWidth: 110 },
  { key: 'labels', label: 'Label Sizes', width: 'fill', minWidth: 110 },
  { key: 'status', label: 'Status', width: 120 },
];
const PRINTERS = [
  { id: 'p1', name: 'Dock 4 Zebra', model: 'Zebra ZT411', location: 'Shipping Dock 4', labels: '4 × 6, 4 × 4', status: 'Active' },
  { id: 'p2', name: 'Receiving', model: 'Zebra ZD621', location: 'Receiving Bay', labels: '4 × 6', status: 'Active' },
];

/**
 * Fill columns with long header labels fit a 835px card (a 1024px window): the table is exactly as wide as the
 * columns' minWidths need, so the labels ellipsize and the values wrap instead of the table scrolling.
 */
export const FitsLongHeaders: Story = {
  name: 'Fits its card › Long headers',
  render: function Render() {
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
        <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <Caption>Carrier accounts, 835px card</Caption>
          <div style={{ width: 835, maxWidth: '100%' }}>
            <DataTable
              aria-label="Carrier accounts"
              columns={CARRIER_COLUMNS}
              rows={CARRIERS}
              cells={c => ({ ...c })}
              rowLabel={c => c.name}
              selected={selected}
              onSelectedChange={setSelected}
              actions
            />
          </div>
        </figure>
        <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <Caption>Printers, 835px card</Caption>
          <div style={{ width: 835, maxWidth: '100%' }}>
            <DataTable aria-label="Printers" columns={PRINTER_COLUMNS} rows={PRINTERS} cells={p => ({ ...p })} rowLabel={p => p.name} onSelectedChange={noop} actions />
          </div>
        </figure>
      </div>
    );
  },
  parameters: { controls: { disable: true } },
};
