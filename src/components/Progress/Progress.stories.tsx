import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from './Progress';
import { figma } from '../../storybook/figma';

const meta = {
  title: 'Web Components/Progress',
  component: Progress,
  args: { value: 50, max: 100, variant: 'bar', showValue: true, label: 'Upload progress' },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100 } },
    variant: { control: 'inline-radio', options: ['bar', 'circle'] },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const Styles = ({ variant, value }: { variant: 'bar' | 'circle'; value: number }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
    {[false, true].map(showValue => (
      <figure key={String(showValue)} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
          {showValue ? 'Style=With Percentage' : 'Style=Default'}
        </figcaption>
        <Progress variant={variant} value={value} showValue={showValue} />
      </figure>
    ))}
  </div>
);

export const Bar: Story = {
  render: () => <Styles variant="bar" value={50} />,
  parameters: { ...figma('520:583', 'Progress Bar* › Progress Bar*'), controls: { disable: true } },
};

export const Circle: Story = {
  render: () => <Styles variant="circle" value={75} />,
  parameters: { ...figma('520:588', 'Progress Bar* › Progress Circle'), controls: { disable: true } },
};
