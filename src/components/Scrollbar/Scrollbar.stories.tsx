import type { Meta, StoryObj } from '@storybook/react-vite';
import { Scrollbar } from './Scrollbar';
import { figma } from '../../storybook/figma';

const LINES = Array.from({ length: 24 }, (_, i) => `Line ${i + 1}: Solar panels convert sunlight into electricity.`);

const Content = () => (
  <div className="text-medium-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
    {LINES.map(line => (
      <p key={line} style={{ margin: 0 }}>{line}</p>
    ))}
  </div>
);

const meta = {
  title: 'Web Components/Scrollbar',
  component: Scrollbar,
  args: { height: 200, label: 'Notes', step: 40, children: <Content /> },
  argTypes: { children: { control: false } },
  decorators: [Story => <div style={{ width: 360 }}><Story /></div>],
} satisfies Meta<typeof Scrollbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Figma frame is 12×137; the thumb is a code addition (Figma has track and chevrons only). */
export const Default: Story = {
  args: { height: 137 },
  parameters: { ...figma('431:266', 'Scrollbar › Scrollbar'), controls: { disable: true } },
};
