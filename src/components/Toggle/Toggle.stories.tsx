import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toggle, type ToggleProps } from './Toggle';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates } from '../../storybook/StateGrid';

const meta = {
  title: 'Primitives/Toggle',
  component: Toggle,
  args: { label: 'Label', size: 'small', position: 'left' },
  argTypes: {
    size: { control: 'inline-radio', options: ['small', 'large'] },
    position: { control: 'inline-radio', options: ['left', 'right'] },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma's Toggle `State` axis is On / Off / Disabled (no Hover, Press or Focus). */
type ToggleState = 'Off' | 'On' | 'Disabled';
const STATES: ToggleState[] = ['Off', 'On', 'Disabled'];

const states = (props: Partial<ToggleProps>) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-24)', alignItems: 'flex-start' }}>
    {STATES.map(state => (
      <figure key={state} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
          State={state}
        </figcaption>
        <Toggle
          aria-label={props.label ? undefined : 'Toggle'}
          {...props}
          defaultChecked={state === 'On'}
          disabled={state === 'Disabled'}
        />
      </figure>
    ))}
  </div>
);

export const Playground: Story = {};

/** Toggle › Label: Position × Size × State. */
export const Label: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-32)' }}>
      {(['small', 'large'] as const).map(size =>
        (['left', 'right'] as const).map(position => (
          <div key={size + position} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            <p className="text-small-semi-bold" style={{ margin: 0, color: 'var(--color-gray-text-weak)' }}>
              Size={size === 'small' ? 'Small' : 'Large'}, Position={position === 'left' ? 'Left' : 'Right'}
            </p>
            {states({ label: 'Label', size, position })}
          </div>
        )),
      )}
    </div>
  ),
  parameters: { ...figma('2282:1930', 'Toggle › Label'), controls: { disable: true } },
};

export const Large: Story = {
  render: () => states({ size: 'large' }),
  parameters: { ...figma('404:186', 'Toggle › Large'), controls: { disable: true } },
};

export const Small: Story = {
  render: () => states({ size: 'small' }),
  parameters: { ...figma('2283:1939', 'Toggle › Small'), controls: { disable: true } },
};

export const ToggleButton: Story = {
  render: () => states({ label: 'Label', size: 'small', contained: true }),
  parameters: { ...figma('2634:295', 'Toggle › Toggle Button'), controls: { disable: true } },
};

/** Focus ring is a code-only addition: Figma has no focus state for Toggle. */
export const Focus: Story = {
  render: () => (
    <StateGrid states={['Focus']} render={() => <Toggle label="Label" defaultChecked />} />
  ),
  parameters: { ...pseudoStates, controls: { disable: true } },
};
