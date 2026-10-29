import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton, type SkeletonShape } from './Skeleton';
import { figma } from '../../storybook/figma';

const meta = {
  title: 'Primitives/Skeleton',
  component: Skeleton,
  args: { shape: 'bar' },
  argTypes: { shape: { control: 'inline-radio', options: ['circle', 'square', 'bar', 'block'] } },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const SHAPES: SkeletonShape[] = ['circle', 'square', 'bar', 'block'];

export const Shapes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
      {SHAPES.map(shape => (
        <figure key={shape} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
            {`Shape=${shape[0].toUpperCase()}${shape.slice(1)}`}
          </figcaption>
          <Skeleton shape={shape} />
        </figure>
      ))}
    </div>
  ),
  parameters: { ...figma('521:345', 'Skeleton* › Skeleton*'), controls: { disable: true } },
};
