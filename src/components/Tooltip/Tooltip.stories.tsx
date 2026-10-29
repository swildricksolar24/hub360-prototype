import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip, type TooltipPosition } from './Tooltip';
import { Button } from '../Button/Button';
import { figma } from '../../storybook/figma';

const meta = {
  title: 'Primitives/Tooltip',
  component: Tooltip,
  args: { label: 'Label', size: 'small', position: 'top', open: false, children: <Button size="small" variant="outline">Hover or focus me</Button> },
  argTypes: {
    size: { control: 'inline-radio', options: ['large', 'small'] },
    position: { control: 'inline-radio', options: ['top', 'bottom', 'left', 'right'] },
    children: { control: false },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  decorators: [Story => <div style={{ padding: 'var(--space-96) var(--space-256)' }}><Story /></div>],
};

const POSITIONS: TooltipPosition[] = ['top', 'right', 'bottom', 'left'];

// Each cell leaves room for the tooltip on every side (cell sizes are story layout only)
const CELL = { large: { width: 520, height: 200 }, small: { width: 220, height: 110 } };

const Grid = ({ size }: { size: 'large' | 'small' }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-24)' }}>
    {POSITIONS.map(position => (
      <figure key={position} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
          {`Position=${position[0].toUpperCase()}${position.slice(1)}`}
        </figcaption>
        <div style={{ ...CELL[size], display: 'grid', placeItems: 'center', boxShadow: 'inset 0 0 0 var(--stroke-width-outline) var(--color-gray-stroke-disabled)' }}>
          <Tooltip label="Label" size={size} position={position} open>
            <Button size="tiny">Trigger</Button>
          </Tooltip>
        </div>
      </figure>
    ))}
  </div>
);

/** Shown with `open`; in use they appear on hover and focus. */
export const Large: Story = {
  render: () => <Grid size="large" />,
  parameters: { ...figma('435:368', 'Tooltip* › Large*'), controls: { disable: true } },
};

export const Small: Story = {
  render: () => <Grid size="small" />,
  parameters: { ...figma('497:785', 'Tooltip* › Small*'), controls: { disable: true } },
};
