import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, type BadgeColor } from './Badge';
import { figma } from '../../storybook/figma';

const meta = {
  title: 'Primitives/Badge',
  component: Badge,
  args: { children: '4', shape: 'round', color: 'amber' },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

const COLORS: BadgeColor[] = ['amber', 'blue', 'green', 'red', 'black'];

const Row = ({ shape, label }: { shape: 'round' | 'pill'; label: string }) => (
  <div style={{ display: 'flex', gap: 'var(--space-24)' }}>
    {COLORS.map(color => (
      <figure key={color} style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-8)' }}>
        <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)', textTransform: 'capitalize' }}>
          Color={color}
        </figcaption>
        <Badge shape={shape} color={color}>{label}</Badge>
      </figure>
    ))}
  </div>
);

export const Playground: Story = {};

export const Round: Story = {
  render: () => <Row shape="round" label="4" />,
  parameters: { ...figma('416:1806', 'Badge › Round'), controls: { disable: true } },
};

export const Pill: Story = {
  render: () => <Row shape="pill" label="444" />,
  parameters: { ...figma('416:1819', 'Badge › Pill'), controls: { disable: true } },
};
