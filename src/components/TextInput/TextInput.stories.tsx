import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextInput, type TextInputProps } from './TextInput';
import { Dropdown } from '../Dropdown/Dropdown';
import { Toggle } from '../Toggle/Toggle';
import { Checkbox } from '../Checkbox/Checkbox';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates, type StateName } from '../../storybook/StateGrid';

const meta = {
  title: 'Primitives/TextInput',
  component: TextInput,
  args: { label: 'Label', placeholder: 'Placeholder' },
  decorators: [Story => <div style={{ maxWidth: 360 }}><Story /></div>],
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const STATES: StateName[] = ['Default', 'Hover', 'Press', 'Focus', 'Disabled', 'Error', 'Required'];

const figmaSet = (nodeId: string, figmaName: string, props: Partial<TextInputProps>): Story => ({
  render: args => (
    <StateGrid
      direction="column"
      states={STATES}
      render={state => (
        <div style={{ width: 360 }}>
          <TextInput
            {...args}
            {...props}
            error={state === 'Error' ? 'Error' : undefined}
            disabled={state === 'Disabled'}
            required={state === 'Required'}
          />
        </div>
      )}
    />
  ),
  parameters: { ...figma(nodeId, figmaName), ...pseudoStates, controls: { disable: true } },
});

export const Playground: Story = {};

export const Default = figmaSet('218:3960', 'Text Input - Label › Default', {});
export const LeftIcon = figmaSet('277:4338', 'Text Input - Label › Left Icon*', { leftIcon: 'account' });
export const RightIcon = figmaSet('303:4430', 'Text Input - Label › Right Icon', { rightIcons: ['visibility'] });
export const RightDoubleIcon = figmaSet('2717:185', 'Text Input - Label › Right Double Icon', { rightIcons: ['visibility', 'visibility'] });

/**
 * A read-only form, e.g. a record before Edit: wrap it in `<fieldset disabled data-readonly>`. The fields can't change,
 * keep their normal look, and don't react (no hover or press, a plain arrow; locked fields can't take focus). The same
 * fields outside the region, on the right, react as usual. Applies to TextInput, NumericInput, TextArea, Dropdown,
 * Checkbox, RadioButton, Toggle, EditableCell and SearchBar.
 */
export const ReadOnlyRegion: Story = {
  name: 'Read-only region',
  decorators: [Story => <Story />],
  render: () => {
    const fields = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)', width: 320 }}>
        <TextInput label="Item Name" defaultValue="REC 325 Solar Panel" />
        <Dropdown label="Category" options={[{ value: 'panels', label: 'Solar Panels' }]} defaultValue="panels" />
        <Toggle label="Lot control" defaultChecked />
        <Checkbox label="Track expiry dates" defaultChecked />
      </div>
    );
    return (
      <div style={{ display: 'flex', gap: 'var(--space-48)', flexWrap: 'wrap' }}>
        <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
            Read-only (before Edit)
          </figcaption>
          <fieldset disabled data-readonly style={{ margin: 0, padding: 0, border: 0 }}>
            {fields}
          </fieldset>
        </figure>
        <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
            Editing
          </figcaption>
          {fields}
        </figure>
      </div>
    );
  },
  parameters: { controls: { disable: true } },
};
