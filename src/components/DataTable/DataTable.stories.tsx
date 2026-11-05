import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataTable, type DataColumn, type DataSort } from './DataTable';
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
