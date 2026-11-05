import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Toast } from './Toast';
import { Button } from '../Button/Button';
import type { MessageType } from '../Message/Message';
import { figma } from '../../storybook/figma';

const meta = {
  title: 'Components/Feedback/Toast',
  component: Toast,
  args: { type: 'success', title: 'Toronto WH was added.', body: undefined, onClose: fn(), inline: false },
  argTypes: {
    type: { control: 'inline-radio', options: ['info', 'success', 'caution', 'error'] },
    title: { control: 'text' },
    body: { control: 'text' },
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Click "Show toast": it slides down at the top center of the canvas and leaves after 5 seconds (hovering it pauses the
 * timer), or when closed. Each click shows it again.
 */
export const Playground: Story = {
  render: function Render(args) {
    const [count, setCount] = useState(0);
    return (
      <>
        <Button variant="brand" onClick={() => setCount(c => c + 1)}>
          Show toast
        </Button>
        {count > 0 && (
          <Toast
            key={count}
            {...args}
            onClose={() => {
              setCount(0);
              args.onClose();
            }}
          />
        )}
      </>
    );
  },
};

const TYPES: { type: MessageType; figma: string; title: string }[] = [
  { type: 'info', figma: 'Info', title: 'Receiving isn’t designed yet.' },
  { type: 'success', figma: 'Success', title: 'Toronto WH was added.' },
  { type: 'caution', figma: 'Caution', title: '5 items are below their reorder point.' },
  { type: 'error', figma: 'Error', title: 'The upload failed. Try again.' },
];

/** Figma Toast: `Type` (Info, Success, Caution, Error), drawn in place with `inline`. */
export const ToastTypes: Story = {
  name: 'Toast',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)', width: 560, maxWidth: '100%' }}>
      {TYPES.map(t => (
        <figure key={t.type} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
            Type={t.figma}
          </figcaption>
          <Toast inline type={t.type} title={t.title} onClose={() => {}} />
        </figure>
      ))}
    </div>
  ),
  parameters: { ...figma('3079:263', 'Toast › Toast'), controls: { disable: true } },
};
