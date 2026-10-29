import type { Meta, StoryObj } from '@storybook/react-vite';
import { DropdownTree, type TreeNode } from './DropdownTree';
import { DropdownStateGrid } from '../Dropdown/storyGrid';
import { figma } from '../../storybook/figma';
import { pseudoStates } from '../../storybook/StateGrid';

const CITIES: TreeNode[] = [
  { id: 'al', label: 'Alabama', children: [{ id: 'bhm', label: 'Birmingham' }, { id: 'mgm', label: 'Montgomery' }] },
  { id: 'ak', label: 'Alaska', children: [{ id: 'anc', label: 'Anchorage' }, { id: 'jnu', label: 'Juneau' }] },
  { id: 'az', label: 'Arizona', children: [{ id: 'phx', label: 'Phoenix' }, { id: 'tus', label: 'Tucson' }] },
  { id: 'ar', label: 'Arkansas', children: [{ id: 'lit', label: 'Little Rock' }] },
];

const meta = {
  title: 'Web Components/DropdownTree',
  component: DropdownTree,
  args: { nodes: CITIES, label: 'City', placeholder: 'Select a City' },
  decorators: [Story => <div style={{ maxWidth: 360, minHeight: 320 }}><Story /></div>],
} satisfies Meta<typeof DropdownTree>;

export default meta;
type Story = StoryObj<typeof meta>;

/** ↓ opens; ↑/↓ move, → expands, ← collapses, Enter chooses a city, Escape closes. */
export const Playground: Story = {};

const STATES = ['Default', 'Active', 'Active Open', 'Active Hover', 'Selected'] as const;

export const DropdownTreeSet: Story = {
  name: 'Dropdown Tree',
  render: args => (
    <DropdownStateGrid
      direction="column"
      cellWidth={360}
      states={STATES}
      render={state => {
        const open = state.startsWith('Active');
        const chosen = state === 'Active Hover' || state === 'Selected';
        return (
          <div
            style={{ minHeight: open ? (state === 'Active Hover' ? 300 : 210) : undefined }}
            className={state === 'Active' ? 'hover-field' : state === 'Active Hover' ? 'hover-juneau' : undefined}
          >
            <DropdownTree {...args} defaultOpen={open} defaultValue={chosen ? 'jnu' : null} defaultExpanded={[]} />
          </div>
        );
      }}
    />
  ),
  decorators: [Story => <Story />],
  parameters: {
    ...figma('462:1445', 'Dropdown Tree* › Dropdown Tree*'),
    pseudo: {
      ...pseudoStates.pseudo,
      // Figma `Active` shows the field in its hover fill; `Active Hover` highlights the Juneau row
      hover: ['.hover-field > div > div:first-child', '.hover-juneau [role="treeitem"]:nth-child(4)'],
    },
    controls: { disable: true },
  },
};
