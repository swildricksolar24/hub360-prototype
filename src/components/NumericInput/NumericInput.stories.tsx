import type { Meta, StoryObj } from '@storybook/react-vite';
import { NumericInput } from './NumericInput';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates, type StateName } from '../../storybook/StateGrid';

const meta = {
  title: 'Primitives/NumericInput',
  component: NumericInput,
  args: { label: 'Label', placeholder: '$0.00', step: 1 },
  decorators: [Story => <div style={{ maxWidth: 361 }}><Story /></div>],
} satisfies Meta<typeof NumericInput>;

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
          <NumericInput {...args} error={state === 'Error' ? 'Error' : undefined} disabled={state === 'Disabled'} />
        </div>
      )}
    />
  ),
  parameters: { ...figma('397:691', 'Text Input - Numeric* › Text Input - Numeric*'), ...pseudoStates, controls: { disable: true } },
};

/** Steps by 0.25 between 0 and 10. */
export const WithBounds: Story = {
  args: { defaultValue: 9.5, min: 0, max: 10, step: 0.25 },
};
