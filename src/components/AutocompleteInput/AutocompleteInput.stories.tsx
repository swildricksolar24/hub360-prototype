import type { Meta, StoryObj } from '@storybook/react-vite';
import { AutocompleteInput, type AutocompleteInputProps } from './AutocompleteInput';
import { figma } from '../../storybook/figma';
import { pseudoStates } from '../../storybook/StateGrid';

const OPTIONS = ['Smashburger', 'Smart & Final', 'Smallville', 'Smashing Pumpkins', 'Safeway', 'Starbucks', 'Subway'];

const meta = {
  title: 'Primitives/AutocompleteInput',
  component: AutocompleteInput,
  args: { label: 'Search places', options: OPTIONS },
  decorators: [Story => <div style={{ maxWidth: 350, minHeight: 260 }}><Story /></div>],
} satisfies Meta<typeof AutocompleteInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Figma `State`: Default, Activated Search (focused), Active Input (suggestions open), Selected. */
const STATES: { name: string; cell?: string; props: Partial<AutocompleteInputProps> }[] = [
  { name: 'Default', props: {} },
  { name: 'Activated Search', cell: 'state-focus', props: {} },
  { name: 'Active Input', cell: 'state-focus', props: { defaultValue: 'Sma', defaultOpen: true } },
  { name: 'Selected', props: { defaultValue: 'Smashburger' } },
];

export const TextInputAutocomplete: Story = {
  name: 'Text Input - Autocomplete',
  render: args => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
      {STATES.map(({ name, cell, props }) => (
        <figure key={name} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', minHeight: name === 'Active Input' ? 260 : undefined }}>
          <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
            State={name}
          </figcaption>
          <div className={cell} style={{ width: 350 }}>
            <AutocompleteInput {...args} {...props} />
          </div>
        </figure>
      ))}
    </div>
  ),
  parameters: {
    ...figma('449:2189', 'Text Input - Autocomplete* › Text Input - Autocomplete*'),
    ...pseudoStates,
    controls: { disable: true },
  },
};
