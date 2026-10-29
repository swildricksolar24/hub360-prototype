import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox, type CheckboxProps } from './Checkbox';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates, type StateName } from '../../storybook/StateGrid';

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  args: { label: 'Label', size: 'default', defaultChecked: true },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

const STATES: StateName[] = ['Default', 'Hover', 'Press', 'Focus', 'Disabled', 'Error'];

const figmaSet = (nodeId: string, figmaName: string, props: Partial<CheckboxProps>): Story => ({
  render: args => (
    <StateGrid
      states={STATES}
      render={state => <Checkbox {...args} {...props} error={state === 'Error'} disabled={state === 'Disabled'} />}
    />
  ),
  parameters: { ...figma(nodeId, figmaName), ...pseudoStates, controls: { disable: true } },
});

export const Playground: Story = {};

export const Default = figmaSet('397:1330', 'Checkbox › Default', { size: 'default' });
export const DefaultIcon = figmaSet('2499:4513', 'Checkbox › Default - Icon*', { size: 'default', infoIcon: true });
export const Small = figmaSet('363:5386', 'Checkbox › Small', { size: 'small' });
export const SmallIcon = figmaSet('2417:3224', 'Checkbox › Small - Icon', { size: 'small', infoIcon: true });

/** Figma's `Show Checkmark` boolean maps to the native checked state. */
export const Unchecked: Story = {
  args: { defaultChecked: false },
  parameters: figma('397:1330', 'Checkbox › Default (Show Checkmark = false)'),
};
