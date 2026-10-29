import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataRow, RowItem, RowSlot, StatusPill } from './DataRow';
import { DataHeader, type DataSort } from '../DataHeader/DataHeader';
import { SCREENS, TENANT_SCREEN, type FigmaScreen } from '../DataHeader/figmaScreens';
import { Icon } from '../Icon/Icon';
import { figma } from '../../storybook/figma';

/** Turns a Figma screen's sample row into cells: status column → StatusPill, icon column → Icon. */
const cellsFor = (screen: FigmaScreen, row = screen.row): Record<string, ReactNode> =>
  Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      key === screen.statusKey ? (
        <StatusPill>{value}</StatusPill>
      ) : key === screen.iconKey ? (
        <Icon name="checkbox-checked" size={24} label="Yes" />
      ) : (
        value
      ),
    ]),
  );

const users = SCREENS[0];

const meta = {
  title: 'Custom/DataRow',
  component: DataRow,
  args: {
    columns: users.columns,
    cells: cellsFor(users),
    leading: 'checkbox-avatar',
    avatar: { initials: 'JR' },
    selected: true,
    actions: true,
  },
  argTypes: {
    leading: { control: 'inline-radio', options: ['none', 'checkbox', 'checkbox-avatar'] },
  },
  decorators: [Story => <div role="table" aria-label="Data rows">{Story()}</div>],
} satisfies Meta<typeof DataRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const Caption = ({ children }: { children: string }) => (
  <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
    {children}
  </figcaption>
);

const Variant = ({ caption, children }: { caption: string; children: ReactNode }) => (
  <figure role="rowgroup" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
    <Caption>{caption}</Caption>
    {children}
  </figure>
);

export const Playground: Story = {};

/** Figma Data Rows: every `Screen` variant, rebuilt from column data (photo avatars shown as initials). */
export const DataRows: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-32)' }}>
      {SCREENS.map(screen => (
        <Variant key={screen.name} caption={`Screen=${screen.name}`}>
          <DataRow
            columns={screen.columns}
            cells={cellsFor(screen)}
            leading={screen.leading}
            leadingWidth={screen.leadingWidth}
            avatar={{ initials: 'JR' }}
            selected={screen.selected ?? true}
            selectLabel={`Select ${screen.row[screen.columns[0].key]}`}
          />
        </Variant>
      ))}
    </div>
  ),
  parameters: { ...figma('707:5559', 'Data Rows* › Data Rows'), controls: { disable: true } },
};

/** Figma Row Item: `Value`, and `Show Slot` with a Slot* after the value. */
export const RowItems: Story = {
  render: () => (
    <div role="row" style={{ display: 'flex', gap: 'var(--space-24)', alignItems: 'flex-start' }}>
      <Variant caption="Show Value">
        <RowItem value="Value" />
      </Variant>
      <Variant caption="Show Value + Show Slot">
        <RowItem value="Value" slot={<RowSlot>Slot</RowSlot>} />
      </Variant>
    </div>
  ),
  parameters: { ...figma('759:2011', 'Data Rows* › Row Item'), controls: { disable: true } },
};

/** Figma Slot*: the gray pill placed in a Row Item slot. */
export const Slot: Story = {
  render: () => (
    <div role="row">
      <RowItem slot={<RowSlot>Slot</RowSlot>} />
    </div>
  ),
  parameters: { ...figma('765:10067', 'Data Rows* › Slot*'), controls: { disable: true } },
};

/** Figma Tenant Rows*: avatar with initials ("JR"). */
export const TenantRows: Story = {
  render: () => (
    <DataRow
      columns={TENANT_SCREEN.columns}
      cells={cellsFor(TENANT_SCREEN)}
      leading="checkbox-avatar"
      avatar={{ initials: TENANT_SCREEN.initials }}
      selected
      selectLabel="Select Acme"
    />
  ),
  parameters: { ...figma('1098:940', 'Data Rows* › Tenant Rows*'), controls: { disable: true } },
};

const TENANTS = [
  { id: '123-456-789', name: 'Acme', planType: 'Starter', status: 'Active', initials: 'JR' },
  { id: '234-567-890', name: 'Globex', planType: 'Business', status: 'Active', initials: 'MS' },
  { id: '345-678-901', name: 'Initech', planType: 'Starter', status: 'Suspended', initials: 'PL' },
];

/** Composition: Tenant Headers* above Tenant Rows*, with working sort and selection. */
export const Table: Story = {
  render: function Render() {
    const [sort, setSort] = useState<DataSort>({ key: 'id', direction: 'ascending' });
    const [selected, setSelected] = useState<string[]>([]);
    const rows = [...TENANTS].sort((a, b) => {
      const k = sort.key as keyof (typeof TENANTS)[number];
      return (sort.direction === 'ascending' ? 1 : -1) * a[k].localeCompare(b[k]);
    });
    return (
      <div role="table" aria-label="Tenants" aria-rowcount={rows.length + 1}>
        <DataHeader
          columns={TENANT_SCREEN.columns}
          corners="bottom"
          sort={sort}
          onSortChange={key => setSort(p => ({ key, direction: p.key === key && p.direction === 'ascending' ? 'descending' : 'ascending' }))}
          allSelected={selected.length === rows.length}
          onSelectAllChange={all => setSelected(all ? rows.map(r => r.id) : [])}
        />
        {rows.map(row => (
          <DataRow
            key={row.id}
            columns={TENANT_SCREEN.columns}
            cells={{ ...row, status: <StatusPill tone={row.status === 'Active' ? 'success' : 'warning'}>{row.status}</StatusPill> }}
            avatar={{ initials: row.initials }}
            selected={selected.includes(row.id)}
            onSelectedChange={on => setSelected(s => (on ? [...s, row.id] : s.filter(id => id !== row.id)))}
            selectLabel={`Select ${row.name}`}
            moreLabel={`More actions for ${row.name}`}
          />
        ))}
      </div>
    );
  },
  parameters: { controls: { disable: true } },
};
