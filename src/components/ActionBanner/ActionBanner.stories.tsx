import type { Meta, StoryObj } from '@storybook/react-vite';
import { ActionBanner } from './ActionBanner';
import { Button } from '../Button/Button';
import { figma } from '../../storybook/figma';

const actions = (
  <>
    <Button size="small" variant="outline">
      Send to Another Printer
    </Button>
    <Button size="small" variant="brand">
      Retry Job
    </Button>
  </>
);

const meta = {
  title: 'Components/Feedback/ActionBanner',
  component: ActionBanner,
  args: {
    title: '1 job failed · out of labels',
    children: 'Packing labels for SO-10480 failed at 2:14 PM. Load a new roll of 4 × 6 labels, then retry. Jobs waiting behind it are held so they print in order.',
    actions,
  },
  argTypes: { actions: { control: false } },
  // Banners sit on a page or card, like the printer's Print Jobs list
  decorators: [Story => <div style={{ padding: 'var(--space-24)', background: 'var(--color-surfaces-base)' }}>{Story()}</div>],
} satisfies Meta<typeof ActionBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * Figma "Action Banner" (Base, "- Action Banner" page, 3506:3; first drawn on Inventory › printer › Print Jobs) with its text and its two
 * actions, outline "Send to Another Printer" and brand "Retry Job": at full width, and on a narrow card where the
 * actions wrap under the text (which keeps at least 320px).
 */
export const ActionBannerSet: Story = {
  name: 'Action Banner',
  render: args => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
      <ActionBanner {...args} />
      <div style={{ width: 560, maxWidth: '100%' }}>
        <ActionBanner {...args} />
      </div>
    </div>
  ),
  parameters: { ...figma('3506:3', 'Action Banner'), controls: { disable: true } },
};
