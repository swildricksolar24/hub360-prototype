import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SignaturePad } from './SignaturePad';
import { figma } from '../../storybook/figma';

/** A looping scribble, roughly where Figma's sample signature sits. */
const SAMPLE = [
  Array.from({ length: 60 }, (_, i) => {
    const t = i / 59;
    return { x: 40 + t * 340, y: 140 + Math.sin(t * Math.PI * 6) * 45 * (1 - t * 0.5) - t * 30 };
  }),
];

const meta = {
  title: 'Web Components/SignaturePad',
  component: SignaturePad,
  args: { label: 'Sign Below', onSave: fn(), onClear: fn(), onSignedChange: fn() },
  decorators: [Story => <div style={{ maxWidth: 719 }}><Story /></div>],
} satisfies Meta<typeof SignaturePad>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Figma `State`: Default (empty) and Active (being signed / signed). */
export const SignaturePadSet: Story = {
  name: 'Signature Pad',
  render: args => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-32)' }}>
      {(['Default', 'Active'] as const).map(state => (
        <figure key={state} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
            State={state}
          </figcaption>
          <SignaturePad {...args} defaultStrokes={state === 'Active' ? SAMPLE : undefined} />
        </figure>
      ))}
    </div>
  ),
  parameters: { ...figma('399:486', 'Signature* › Signature Pad*'), controls: { disable: true } },
};

export const Disabled: Story = {
  args: { disabled: true },
};
