import type { Meta, StoryObj } from '@storybook/react-vite';
import { NavTier2, type NavTier2Item, type NavTier2Variant } from './NavTier2';
import { figma } from '../../storybook/figma';

const items: NavTier2Item[] = [
  { id: 'hubsight', label: 'HubSight', icon: 'visibility' },
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'warehouses', label: 'Warehouses', icon: 'warehouse' },
  { id: 'items', label: 'Items', icon: 'tasks' },
  { id: 'counts', label: 'Counts', icon: 'sales' },
  { id: 'orders', label: 'Orders', icon: 'orders' },
  { id: 'purchasing', label: 'Purchasing', icon: 'recent-sales' },
  { id: 'receiving', label: 'Receiving', icon: 'receiving' },
  { id: 'shipping', label: 'Shipping', icon: 'service' },
  { id: 'suppliers', label: 'Suppliers', icon: 'suppliers' },
  { id: 'reports', label: 'Reports', icon: 'reports' },
  { id: 'users', label: 'Users', icon: 'users' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

const meta = {
  title: 'Navigation/NavTier2',
  component: NavTier2,
  args: { items, value: 'warehouses', variant: 'default' },
  argTypes: { variant: { control: 'inline-radio', options: ['default', 'collapsed', 'label'] } },
} satisfies Meta<typeof NavTier2>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Figma `State` Default, Collapsed and Label. Figma shows no selected item; Warehouses is selected here. */
export const Tier2: Story = {
  name: 'Tier 2',
  render: args => (
    <div style={{ display: 'flex', gap: 'var(--space-48)', alignItems: 'flex-start' }}>
      {(['default', 'collapsed', 'label'] as NavTier2Variant[]).map(variant => (
        <figure key={variant} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
            State={variant[0].toUpperCase() + variant.slice(1)}
          </figcaption>
          <NavTier2 {...args} variant={variant} aria-label={`Section (${variant})`} />
        </figure>
      ))}
    </div>
  ),
  parameters: { ...figma('708:1647', 'Tier 2 › Tier 2'), controls: { disable: true } },
};
