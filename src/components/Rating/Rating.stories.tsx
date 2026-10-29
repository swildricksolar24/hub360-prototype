import type { Meta, StoryObj } from '@storybook/react-vite';
import { Rating } from './Rating';
import { figma } from '../../storybook/figma';

const meta = {
  title: 'Web Components/Rating',
  component: Rating,
  args: { value: 3.5, max: 5, label: 'Label' },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 5, step: 0.5 } },
  },
} satisfies Meta<typeof Rating>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The single Figma variant (`State=Default`): 3½ of 5 stars with a label. */
export const Default: Story = {
  args: { value: 3.5, max: 5, label: 'Label' },
  parameters: { ...figma('408:370', 'Rating › Rating*'), controls: { disable: true } },
};
