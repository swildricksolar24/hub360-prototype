import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextArea } from './TextArea';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates, type StateName } from '../../storybook/StateGrid';

const meta = {
  title: 'Primitives/TextArea',
  component: TextArea,
  args: { label: 'Label', placeholder: 'Placeholder' },
  decorators: [Story => <div style={{ maxWidth: 361 }}><Story /></div>],
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const STATES: StateName[] = ['Default', 'Hover', 'Press', 'Focus', 'Disabled', 'Error'];

export const Playground: Story = {};

export const Default: Story = {
  render: args => (
    <StateGrid
      direction="column"
      states={STATES}
      render={state => (
        <div style={{ width: 361 }}>
          <TextArea {...args} error={state === 'Error' ? 'Error' : undefined} disabled={state === 'Disabled'} />
        </div>
      )}
    />
  ),
  parameters: { ...figma('303:4524', 'Text Area › Default'), ...pseudoStates, controls: { disable: true } },
};

/** Required is a code-only state (Figma's Text Area has none); it matches Text Input - Label. */
export const Required: Story = {
  args: { required: true },
};
