import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContextMenu, MenuItem } from './ContextMenu';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates, type StateName } from '../../storybook/StateGrid';

const meta = {
  title: 'Web Components/ContextMenu',
  component: ContextMenu,
  args: {
    'aria-label': 'Actions',
    items: [
      { label: 'Label', icon: 'account', submenu: true },
      { label: 'Label', icon: 'account', submenu: true },
      { label: 'Label', icon: 'account', submenu: true },
    ],
  },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    items: [
      { label: 'Edit', icon: 'edit' },
      { label: 'Share', icon: 'link-add', submenu: true },
      { label: 'Archive', icon: 'archive', disabled: true },
      { label: 'Delete', icon: 'delete' },
    ],
  },
};

const STATES: StateName[] = ['Default', 'Hover', 'Press', 'Focus', 'Disabled'];

/** Figma "Menu Item" `State` variants, with `Show Icon` and `Show Submenu` on. */
export const MenuItemStates: Story = {
  name: 'Menu Item',
  render: () => (
    <StateGrid
      direction="column"
      states={STATES}
      render={state => (
        <div role="menu" aria-label="Example" style={{ width: 240, background: 'var(--color-surfaces-raised)' }}>
          <MenuItem icon="account" submenu disabled={state === 'Disabled'}>
            Label
          </MenuItem>
        </div>
      )}
    />
  ),
  parameters: { ...figma('485:1008', 'Context Menu › Menu Item'), ...pseudoStates, controls: { disable: true } },
};

/** Figma `Show Icon` and `Show Submenu` turned off. */
export const MenuItemNoIcon: Story = {
  name: 'Menu Item (no icon, no submenu)',
  render: () => (
    <div role="menu" aria-label="Example" style={{ width: 240, background: 'var(--color-surfaces-raised)' }}>
      <MenuItem>Label</MenuItem>
    </div>
  ),
  parameters: { ...figma('485:1008', 'Context Menu › Menu Item'), controls: { disable: true } },
};

/** The single Figma variant: three default Menu Items. Use the arrow keys after tabbing in. */
export const Default: Story = {
  parameters: { ...figma('486:92', 'Context Menu › Context Menu*'), controls: { disable: true } },
};
