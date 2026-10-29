import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, type CardMode } from './Card';
import { figma } from '../../storybook/figma';

/** Stand-in for the Figma "_Fake logo" placeholder (a gray disc with a "C"). */
const FakeLogo = () => (
  <span
    aria-hidden
    className="text-heading-2-bold"
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      background: 'var(--color-gray-fill-strong)',
      color: 'var(--color-gray-fill-inverse-strong)',
    }}
  >
    C
  </span>
);

const meta = {
  title: 'Web Components/Card',
  component: Card,
  args: { title: 'Label', mode: 'edit', media: <FakeLogo /> },
  argTypes: {
    mode: { control: 'inline-radio', options: ['edit', 'save', 'active', 'title'] },
    media: { control: false },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const MODES: CardMode[] = ['edit', 'save', 'active', 'title'];
const FIGMA_MODE: Record<CardMode, string> = { edit: 'Edit', save: 'Save', active: 'Active', title: 'Title' };

/** Every Figma `Mode` variant. */
export const Modes: Story = {
  render: args => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
      {MODES.map(mode => (
        <figure key={mode} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
            Mode={FIGMA_MODE[mode]}
          </figcaption>
          <Card {...args} mode={mode} />
        </figure>
      ))}
    </div>
  ),
  parameters: { ...figma('2220:3790', 'Card › Card*'), controls: { disable: true } },
};
