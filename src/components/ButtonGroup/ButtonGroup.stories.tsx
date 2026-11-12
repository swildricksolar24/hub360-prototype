import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button/Button';
import { Dropdown } from '../Dropdown/Dropdown';
import { ButtonGroup, ButtonGroupItem } from './ButtonGroup';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates } from '../../storybook/StateGrid';

const meta = {
  title: 'Components/Forms/ButtonGroup',
  component: ButtonGroup,
  args: { orientation: 'horizontal', size: 'default', 'aria-label': 'Options', children: null },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    size: { control: 'inline-radio', options: ['default', 'small'] },
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
 * like the Figma part sets. Default, Hover and Selected rows (Figma), plus Press (code only: like the teal
 * Button › Brand, for selected and unselected parts alike).
 */
export const PartHorizontal: Story = {
  render: () => (
    <StateGrid
      direction="column"
      states={['Default', 'Hover', 'Selected', 'Press']}
      render={state => (
        <ButtonGroup aria-label="Parts" style={{ gap: 'var(--space-24)' }}>
          {[1, 2, 3].map(i => (
            <ButtonGroupItem key={i} aria-pressed={state === 'Selected' || undefined}>
              Label
            </ButtonGroupItem>
          ))}
        </ButtonGroup>
      )}
    />
  ),
  parameters: { ...figma('28:751', 'Button Group › Part - Horizontal'), ...pseudoStates, controls: { disable: true } },
};

export const PartVertical: Story = {
  render: () => (
    <StateGrid
      states={['Default', 'Hover', 'Press']}
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

/**
 * Figma Part - Horizontal `Size=Small` and the Selected states: the toolbar switch (Overview | Stock) at 44px, beside a
 * small Button and Dropdown so the heights can be compared. The chosen part has `aria-pressed="true"`.
 */
export const SmallSwitch: Story = {
  render: function Render() {
    const [mode, setMode] = useState('overview');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)', alignItems: 'flex-start' }}>
        {(['default', 'small'] as const).map(size => (
          <div key={size} style={{ display: 'flex', gap: 'var(--space-12)', alignItems: 'center' }}>
            <ButtonGroup aria-label={`Show (${size})`} size={size}>
              {['overview', 'stock', 'structure'].map(v => (
                <ButtonGroupItem key={v} aria-pressed={mode === v} onClick={() => setMode(v)}>
                  {v[0].toUpperCase() + v.slice(1)}
                </ButtonGroupItem>
              ))}
            </ButtonGroup>
            {size === 'small' && (
              <>
                <Dropdown variant="small" label="View" hideLabel placeholder="View All" options={[{ value: 'all', label: 'View All' }]} />
                <Button variant="primary" size="small" icon="upload">
                  Upload
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
    );
  },
  parameters: { ...figma('28:751', 'Button Group › Part - Horizontal'), controls: { disable: true } },
};
