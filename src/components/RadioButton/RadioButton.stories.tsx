import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioButton, type RadioButtonProps } from './RadioButton';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates, type StateName } from '../../storybook/StateGrid';

const meta = {
  title: 'Primitives/RadioButton',
  component: RadioButton,
  args: { label: 'Label', defaultChecked: true },
} satisfies Meta<typeof RadioButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const STATES: StateName[] = ['Default', 'Hover', 'Press', 'Focus', 'Disabled', 'Error'];

const figmaSet = (nodeId: string, figmaName: string, props: Partial<RadioButtonProps>): Story => ({
  render: args => (
    <StateGrid
      states={STATES}
      render={state => (
        <RadioButton
          {...args}
          {...props}
          name={`${nodeId}-${state}`}
          error={state === 'Error'}
          disabled={state === 'Disabled'}
        />
      )}
    />
  ),
  parameters: { ...figma(nodeId, figmaName), ...pseudoStates, controls: { disable: true } },
});

export const Playground: Story = {};

export const Default = figmaSet('397:1297', 'Radio Button › Default*', {});
export const Hint = figmaSet('2330:3837', 'Radio Button › Hint*', { description: 'Description' });

/** Figma's `Show Selected` boolean maps to the native checked state. */
export const Unselected: Story = {
  args: { defaultChecked: false },
  parameters: figma('397:1297', 'Radio Button › Default* (Show Selected = false)'),
};

/** Radios that share a `name` form one group; arrow keys move the selection. */
export const Group: Story = {
  render: () => (
    <div role="radiogroup" aria-label="Plan" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
      <RadioButton name="plan" value="basic" label="Basic" description="For individuals" defaultChecked />
      <RadioButton name="plan" value="team" label="Team" description="Up to 20 people" />
      <RadioButton name="plan" value="enterprise" label="Enterprise" description="Contact sales" disabled />
    </div>
  ),
  parameters: { controls: { disable: true } },
};
