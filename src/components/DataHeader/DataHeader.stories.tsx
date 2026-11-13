import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataHeader, HeaderItem, type DataSort } from './DataHeader';
import { SCREENS, TENANT_SCREEN } from './figmaScreens';
import { figma } from '../../storybook/figma';

const meta = {
  title: 'Components/Data Display/DataHeader',
  component: DataHeader,
  args: { columns: SCREENS[0].columns, leading: 'checkbox-avatar', corners: 'all', actions: true },
  argTypes: {
    leading: { control: 'inline-radio', options: ['none', 'checkbox', 'checkbox-avatar'] },
    corners: { control: 'inline-radio', options: ['all', 'bottom', 'none'] },
  },
} satisfies Meta<typeof DataHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

const Caption = ({ children }: { children: string }) => (
  <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
    {children}
  </figcaption>
);

const Stack = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-32)' }}>{children}</div>
);

/** Live controls. Sort icons are buttons here: press one to cycle the column's `aria-sort`. */
export const Playground: Story = {
  render: function Render(args) {
    const [sort, setSort] = useState<DataSort | undefined>();
    return (
      <div role="table" aria-label="Users">
        <DataHeader
          {...args}
          sort={sort}
          onSortChange={key =>
            setSort(prev => ({ key, direction: prev?.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }))
          }
        />
      </div>
    );
  },
};

/** Figma User Headers: every `Screen` variant, rebuilt from column data. */
export const UserHeaders: Story = {
  render: () => (
    <Stack>
      {SCREENS.map(screen => (
        <figure key={screen.name} role="table" aria-label={screen.name} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <Caption>{`Screen=${screen.name}`}</Caption>
          <DataHeader columns={screen.columns} leading={screen.leading} leadingWidth={screen.leadingWidth} corners={screen.corners} />
        </figure>
      ))}
    </Stack>
  ),
  parameters: { ...figma('707:5584', 'Data Headers* › User Headers'), controls: { disable: true } },
};

/**
 * Figma Header Item: `State=Default` (sort icon), `Default - 2 Icons` (filter + sort), and the Data Table Header's
 * `Stretched` (`stretched`: the label with a 16px sort chevron, the Preferences filter tile at the far edge), also shown
 * without its filter (a short list) and end-aligned (numbers).
 */
const HEADER_ITEM_STATES = [
  { name: 'State=Default', props: {} },
  { name: 'State=Default - 2 Icons', props: { filterable: true } },
  { name: 'State=Stretched', props: { stretched: true, filterable: true } },
  { name: 'Stretched, no filter', props: { stretched: true } },
  { name: 'Stretched, end-aligned', props: { stretched: true, filterable: true, align: 'end' as const } },
];
export const HeaderItems: Story = {
  render: () => (
    <div role="table" aria-label="Header items">
      <div role="row" style={{ display: 'flex', gap: 'var(--space-24)' }}>
        {HEADER_ITEM_STATES.map(({ name, props }) => (
          <figure key={name} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', width: 200 }}>
            <Caption>{name}</Caption>
            <HeaderItem label="Label" {...props} />
          </figure>
        ))}
      </div>
    </div>
  ),
  parameters: { ...figma('754:2169', 'Data Headers* › Header Item'), controls: { disable: true } },
};

/** Figma Tenant Headers*: bottom-rounded header used above Tenant Rows*. */
export const TenantHeaders: Story = {
  render: () => (
    <div role="table" aria-label="Tenants">
      <DataHeader columns={TENANT_SCREEN.columns} leading={TENANT_SCREEN.leading} corners="bottom" />
    </div>
  ),
  parameters: { ...figma('1098:813', 'Data Headers* › Tenant Headers*'), controls: { disable: true } },
};
