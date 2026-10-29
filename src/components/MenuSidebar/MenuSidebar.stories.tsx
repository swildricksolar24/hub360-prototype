import type { Meta, StoryObj } from '@storybook/react-vite';
import { MenuSidebar, MenuSidebarItem } from './MenuSidebar';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates, type StateName } from '../../storybook/StateGrid';

const meta = {
  title: 'Navigation/MenuSidebar',
  component: MenuSidebar,
  args: {
    'aria-label': 'Account menu',
    items: [
      { id: 'back', label: 'Label', icon: 'chevron-left' },
      { id: 'account', label: 'Label', icon: 'account' },
      { id: 'tasks', label: 'Label', icon: 'checkbox-checked' },
    ],
  },
  decorators: [Story => <div style={{ width: 340 }}>{Story()}</div>],
} satisfies Meta<typeof MenuSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

const STATES: StateName[] = ['Default', 'Disabled', 'Focus', 'Hover', 'Press'];

export const Playground: Story = {};

export const Item: Story = {
  render: () => (
    <StateGrid
      states={STATES}
      direction="column"
      render={state => (
        <div style={{ width: 240 }}>
          <MenuSidebarItem label="Label" icon="account" disabled={state === 'Disabled'} />
        </div>
      )}
    />
  ),
  parameters: { ...figma('490:750', 'Menu Sidebar* › Menu Sidebar Item'), ...pseudoStates, controls: { disable: true } },
};

export const Sidebar: Story = {
  name: 'Menu Sidebar',
  parameters: { ...figma('490:809', 'Menu Sidebar* › Menu Sidebar*'), controls: { disable: true } },
};
