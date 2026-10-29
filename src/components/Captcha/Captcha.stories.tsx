import type { Meta, StoryObj } from '@storybook/react-vite';
import { Captcha } from './Captcha';
import { figma } from '../../storybook/figma';

const meta = {
  title: 'Web Components/Captcha',
  component: Captcha,
  args: { label: "I'm not a robot" },
} satisfies Meta<typeof Captcha>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** `State=Unchecked` / `State=Checked` are the native checkbox state. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
      {[false, true].map(checked => (
        <figure key={String(checked)} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
            {checked ? 'State=Checked' : 'State=Unchecked'}
          </figcaption>
          <Captcha defaultChecked={checked} />
        </figure>
      ))}
    </div>
  ),
  parameters: { ...figma('544:60', 'Captcha › Captcha'), controls: { disable: true } },
};
