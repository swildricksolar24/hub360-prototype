import type { Meta, StoryObj } from '@storybook/react-vite';
import { MultiselectDropdown } from './MultiselectDropdown';
import { DropdownStateGrid, STATE_OPTIONS } from '../Dropdown/storyGrid';
import { figma } from '../../storybook/figma';
import { pseudoStates } from '../../storybook/StateGrid';

const meta = {
  title: 'Web Components/MultiselectDropdown',
  component: MultiselectDropdown,
  args: { options: STATE_OPTIONS, label: 'States', placeholder: 'Select' },
  decorators: [Story => <div style={{ maxWidth: 360, minHeight: 240 }}><Story /></div>],
} satisfies Meta<typeof MultiselectDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Click or ↓ to open, Space/Enter to toggle, Escape to close; press a chip to remove it. */
export const Playground: Story = {};

const STATES = ['Default', 'Active', 'Active Hover', 'Active Selected', 'Selected'] as const;

export const MultiselectDropdownSet: Story = {
  name: 'Multiselect Dropdown',
  render: args => (
    <DropdownStateGrid
      direction="column"
      cellWidth={360}
      states={STATES}
      render={state => {
        const open = state.startsWith('Active');
        const selected = state.endsWith('Selected');
        return (
          <div style={{ minHeight: open ? 210 : undefined }} className={state === 'Active Hover' ? 'hover-third' : undefined}>
            <MultiselectDropdown {...args} options={STATE_OPTIONS.slice(0, 4)} defaultOpen={open} defaultValue={selected ? ['az'] : []} />
          </div>
        );
      }}
    />
  ),
  decorators: [Story => <Story />],
  parameters: {
    ...figma('455:647', 'Multiselect Dropdown* › Multiselect Dropdown*'),
    // Figma `Active Hover` highlights the third row (Arizona)
    pseudo: { ...pseudoStates.pseudo, hover: ['.hover-third [role="option"]:nth-child(3)'] },
    controls: { disable: true },
  },
};
