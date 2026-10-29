import type { Meta, StoryObj } from '@storybook/react-vite';
import { NavTier1, SideSubMenu, TopNavigation, type NavItem, type TopNavigationSize } from './NavTier1';
import { figma } from '../../storybook/figma';

const sections: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'tasks', label: 'Tasks', icon: 'tasks' },
  { id: 'schedule', label: 'Schedule', icon: 'schedule' },
  { id: 'sites', label: 'Sites', icon: 'home' },
  { id: 'accounts', label: 'Accounts', icon: 'account' },
  { id: 'projects', label: 'Projects', icon: 'reports' },
  { id: 'service', label: 'Service', icon: 'service' },
  { id: 'sales', label: 'Sales', icon: 'sales' },
  { id: 'reports', label: 'Reports', icon: 'reports' },
  { id: 'users', label: 'Users', icon: 'users' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

const settings: NavItem[] = [
  { id: 'personal', label: 'Personal Information', icon: 'account' },
  { id: 'security', label: 'Security & Login', icon: 'lock' },
  { id: 'notifications', label: 'Notifications', icon: 'notification' },
  { id: 'preferences', label: 'Preferences', icon: 'preferences' },
  { id: 'work', label: 'Work Profile', icon: 'recent-sales' },
  { id: 'privacy', label: 'Privacy', icon: 'shield' },
  { id: 'devices', label: 'Devices & Sessions', icon: 'devices' },
  { id: 'data', label: 'Account & Data', icon: 'data' },
  { id: 'sign-out', label: 'Sign out', icon: 'sign-out' },
];

const meta = {
  title: 'Navigation/NavTier1',
  component: NavTier1,
  args: { items: sections, value: 'dashboard', compact: false },
} satisfies Meta<typeof NavTier1>;

export default meta;
type Story = StoryObj<typeof meta>;

const Caption = ({ children }: { children: string }) => (
  <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
    {children}
  </figcaption>
);

export const Playground: Story = {};

/** Figma `State=Default` and `State=Compact`. Figma shows no selected item; Dashboard is selected here. */
export const Tier1: Story = {
  name: 'Tier 1',
  render: args => (
    <div style={{ display: 'flex', gap: 'var(--space-48)', alignItems: 'flex-start' }}>
      {[false, true].map(compact => (
        <figure key={String(compact)} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <Caption>{compact ? 'State=Compact' : 'State=Default'}</Caption>
          <NavTier1 {...args} compact={compact} aria-label={compact ? 'Main (compact)' : 'Main'} />
        </figure>
      ))}
    </div>
  ),
  parameters: { ...figma('708:1635', 'Tier 1 › Tier 1'), controls: { disable: true } },
};

export const SideSubMenuSet: Story = {
  name: 'Side Sub Menu',
  render: () => <SideSubMenu title="Title" items={settings} />,
  parameters: { ...figma('2131:4190', 'Tier 1 › Side Sub Menu'), controls: { disable: true } },
};

const subItems = Array.from({ length: 6 }, (_, i) => ({ id: `s${i + 1}`, label: 'Label' }));

export const TopNavigationSet: Story = {
  name: 'Top Navigation',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
      {(['large', 'medium', 'small'] as TopNavigationSize[]).map(size => (
        <figure key={size} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <Caption>{`Size=${size[0].toUpperCase()}${size.slice(1)}`}</Caption>
          <TopNavigation
            size={size}
            breadcrumb={[{ label: 'Dashboard' }]}
            homeHref="#"
            items={subItems}
            value="s4"
            aria-label={`Section (${size})`}
          />
        </figure>
      ))}
    </div>
  ),
  parameters: { ...figma('2172:4052', 'Tier 1 › Top Navigation'), controls: { disable: true } },
};
