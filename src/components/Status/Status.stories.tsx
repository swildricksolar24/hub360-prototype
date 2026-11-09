import type { Meta, StoryObj } from '@storybook/react-vite';
import { Status } from './Status';
import { figma } from '../../storybook/figma';

const meta = {
  title: 'Components/Data Display/Status',
  component: Status,
  args: { active: true },
} satisfies Meta<typeof Status>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const Caption = ({ children }: { children: string }) => (
  <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
    {children}
  </figcaption>
);

/** Figma "Status": both `State` variants. */
export const StatusSet: Story = {
  name: 'Status',
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-40)' }}>
      <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <Caption>State=Active</Caption>
        <Status active />
      </figure>
      <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <Caption>State=Inactive</Caption>
        <Status active={false} />
      </figure>
    </div>
  ),
  parameters: { ...figma('3412:428', 'Data Table › Status'), controls: { disable: true } },
};

/** In a table column the status starts at the left of its cell, so the dots line up and the words end raggedly. */
export const InAColumn: Story = {
  name: 'In a column',
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--space-16)', width: 160 }}>
      <Status active />
      <Status active={false} />
      <Status active />
    </div>
  ),
};
