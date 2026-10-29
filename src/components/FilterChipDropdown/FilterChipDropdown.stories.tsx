import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilterChipDropdown } from './FilterChipDropdown';
import { DropdownStateGrid, STATE_OPTIONS } from '../Dropdown/storyGrid';
import { figma } from '../../storybook/figma';
import { pseudoStates } from '../../storybook/StateGrid';

const meta = {
  title: 'Web Components/FilterChipDropdown',
  component: FilterChipDropdown,
  args: { options: STATE_OPTIONS, label: 'Label', placeholder: 'Select', chipsAppearance: 'brand' },
  argTypes: {
    chipsAppearance: { control: 'inline-radio', options: ['brand', 'plain'] },
    error: { control: 'text' },
  },
  decorators: [Story => <div style={{ maxWidth: 360, minHeight: 420 }}><Story /></div>],
} satisfies Meta<typeof FilterChipDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Choose options from the menu; press a chip to remove it. */
export const Playground: Story = { args: { defaultValue: ['az', 'ar'] } };

const STATES = ['Default', 'Default - Light', 'Hover', 'Press', 'Press - Alt', 'Focus', 'Error', 'Disabled', 'Required'] as const;
const SIX = STATE_OPTIONS.slice(0, 6).map(o => o.value);

export const Default: Story = {
  render: args => (
    <DropdownStateGrid
      direction="column"
      cellWidth={360}
      states={STATES}
      render={state => (
        <FilterChipDropdown
          {...args}
          defaultValue={state.startsWith('Press') ? SIX : []}
          chipsAppearance={state === 'Press - Alt' ? 'plain' : 'brand'}
          light={state === 'Default - Light'}
          error={state === 'Error'}
          disabled={state === 'Disabled'}
          required={state === 'Required'}
        />
      )}
    />
  ),
  decorators: [Story => <Story />],
  parameters: { ...figma('2678:7113', 'Drop Down - Filter Chip › Default'), ...pseudoStates, controls: { disable: true } },
};

/** Not a Figma set: the menu open with checkbox rows. */
export const Open: Story = { args: { defaultValue: ['al', 'az'], defaultOpen: true } };
