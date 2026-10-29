import type { Meta, StoryObj } from '@storybook/react-vite';
import { RangeSlider } from './RangeSlider';
import { figma } from '../../storybook/figma';
import { pseudoStates } from '../../storybook/StateGrid';

const dollars = (v: number) => `$${v}`;

const meta = {
  title: 'Web Components/RangeSlider',
  component: RangeSlider,
  args: { label: 'Budget', min: 0, max: 100, step: 1, defaultValue: 50, format: dollars },
  decorators: [Story => <div style={{ maxWidth: 1080, padding: 'var(--space-16) var(--space-24)' }}><Story /></div>],
} satisfies Meta<typeof RangeSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Figma `State`: Default and Active (thumb dragged or focused). */
export const RangeSliderSet: Story = {
  name: 'Range Slider',
  render: args => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-32)' }}>
      {(['Default', 'Active'] as const).map(state => (
        <figure key={state} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
          <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
            State={state}
          </figcaption>
          <div className={state === 'Active' ? 'state-press' : undefined}>
            <RangeSlider {...args} />
          </div>
        </figure>
      ))}
    </div>
  ),
  parameters: { ...figma('398:1585', 'Slider* › Range Slider*'), ...pseudoStates, controls: { disable: true } },
};

export const CustomMarks: Story = {
  args: { min: 0, max: 1000, step: 50, defaultValue: 250, marks: [0, 250, 500, 750, 1000] },
};

export const Disabled: Story = {
  args: { disabled: true },
};
