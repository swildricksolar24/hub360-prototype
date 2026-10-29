import type { Meta, StoryObj } from '@storybook/react-vite';
import { Overlay } from './Overlay';
import { figma } from '../../storybook/figma';

const meta = {
  title: 'Primitives/Overlay',
  component: Overlay,
  args: { position: 'absolute' },
  argTypes: { position: { control: 'inline-radio', options: ['fixed', 'absolute'] } },
  decorators: [
    Story => (
      <div style={{ position: 'relative', width: 480, height: 300, padding: 'var(--space-24)', background: 'var(--color-surfaces-base)', color: 'var(--color-gray-text-strong)' }} className="text-medium-regular">
        Page content under the scrim
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Overlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The Figma frame is 1920×1200; here it covers a 480×300 box (`position="absolute"`). */
export const Default: Story = {
  args: { position: 'absolute' },
  parameters: { ...figma('717:18047', 'Overlay › Overlay'), controls: { disable: true } },
};
