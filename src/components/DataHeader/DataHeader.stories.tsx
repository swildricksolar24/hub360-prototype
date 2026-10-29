import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataHeader, HeaderItem, type DataSort } from './DataHeader';
import { SCREENS, TENANT_SCREEN } from './figmaScreens';
import { figma } from '../../storybook/figma';

const meta = {
  title: 'Custom/DataHeader',
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

/** Figma Header Item: `State=Default` (sort icon) and `State=Default - 2 Icons` (filter + sort). */
export const HeaderItems: Story = {
  render: () => (
    <div role="table" aria-label="Header items">
      <div role="row" style={{ display: 'flex', gap: 'var(--space-24)' }}>
        {(['Default', 'Default - 2 Icons'] as const).map(state => (
          <figure key={state} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            <Caption>{`State=${state}`}</Caption>
            <HeaderItem label="Label" filterable={state === 'Default - 2 Icons'} />
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
