import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonGroup, ButtonGroupItem } from './ButtonGroup';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates } from '../../storybook/StateGrid';

const meta = {
  title: 'Primitives/ButtonGroup',
  component: ButtonGroup,
  args: { orientation: 'horizontal', 'aria-label': 'Options', children: null },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    children: { control: false },
  },
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: args => (
    <ButtonGroup {...args} style={args.orientation === 'vertical' ? { width: 360 } : undefined}>
      <ButtonGroupItem>Label</ButtonGroupItem>
      <ButtonGroupItem>Label</ButtonGroupItem>
      <ButtonGroupItem>Label</ButtonGroupItem>
    </ButtonGroup>
  ),
};

/**
 * The parts on their own: the group is spread apart so each part's corners and hairline divider show,
 * like the Figma part sets. Default and Hover rows.
 */
export const PartHorizontal: Story = {
  render: () => (
    <StateGrid
      direction="column"
      states={['Default', 'Hover']}
      render={() => (
        <ButtonGroup aria-label="Parts" style={{ gap: 'var(--space-24)' }}>
          <ButtonGroupItem>Label</ButtonGroupItem>
          <ButtonGroupItem>Label</ButtonGroupItem>
          <ButtonGroupItem>Label</ButtonGroupItem>
        </ButtonGroup>
      )}
    />
  ),
  parameters: { ...figma('28:751', 'Button Group › Part - Horizontal'), ...pseudoStates, controls: { disable: true } },
};

export const PartVertical: Story = {
  render: () => (
    <StateGrid
      states={['Default', 'Hover']}
      render={() => (
        <ButtonGroup aria-label="Parts" orientation="vertical" style={{ gap: 'var(--space-24)', width: 132 }}>
          <ButtonGroupItem>Label</ButtonGroupItem>
          <ButtonGroupItem>Label</ButtonGroupItem>
          <ButtonGroupItem>Label</ButtonGroupItem>
        </ButtonGroup>
      )}
    />
  ),
  parameters: { ...figma('79:1642', 'Button Group › Part - Vertical'), ...pseudoStates, controls: { disable: true } },
};

/** Figma `Position` names which part is hovered (`State=Hover`); Default has none hovered. */
const positionsGrid = (orientation: 'horizontal' | 'vertical', positions: string[]) => (
  <div style={{ display: 'flex', flexDirection: orientation === 'horizontal' ? 'column' : 'row', gap: 'var(--space-24)', flexWrap: 'wrap' }}>
    {positions.map((position, p) => (
      <figure key={position} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
          Position={position}
          {p > 0 ? ', State=Hover' : ''}
        </figcaption>
        <ButtonGroup aria-label="Options" orientation={orientation} style={orientation === 'vertical' ? { width: 360 } : undefined}>
          {[1, 2, 3].map(i => (
            <ButtonGroupItem key={i} className={i === p ? 'sb-hover' : undefined}>
              Label
            </ButtonGroupItem>
          ))}
        </ButtonGroup>
      </figure>
    ))}
  </div>
);

export const Horizontal: Story = {
  render: () => positionsGrid('horizontal', ['Default', 'Left', 'Center', 'Right']),
  parameters: { ...figma('523:795', 'Button Group › Button Group / Horizontal*'), pseudo: { hover: ['.sb-hover'] }, controls: { disable: true } },
};

export const Vertical: Story = {
  render: () => positionsGrid('vertical', ['Default', 'Top', 'Center', 'Bottom']),
  parameters: { ...figma('523:821', 'Button Group › Button Group / Vertical*'), pseudo: { hover: ['.sb-hover'] }, controls: { disable: true } },
};
