import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumb } from './Breadcrumb';
import { figma } from '../../storybook/figma';

const meta = {
  title: 'Components/Navigation/Breadcrumb',
  component: Breadcrumb,
  args: {
    homeHref: '#',
    items: [{ label: 'Label', href: '#' }, { label: 'Label', href: '#' }, { label: 'Label' }],
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

const levels = (n: number) => Array.from({ length: n }, (_, i) => ({ label: 'Label', href: i < n - 1 ? '#' : undefined }));

export const Playground: Story = {};

/** Figma Breadcrumb › Parts: `Position=Start` (home + chevron + label) and `Position=Next` (chevron + label). */
export const Parts: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
      <Breadcrumb homeHref="#" items={[{ label: 'Label' }]} aria-label="Position=Start" />
      <Breadcrumb homeHref="#" items={levels(2)} aria-label="Position=Start + Next" />
    </div>
  ),
  parameters: { ...figma('1537:1525', 'Breadcrumb › Parts'), controls: { disable: true } },
};

/** Figma Breadcrumb › Default, `Levels` 1–4. */
export const Default: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
      {[1, 2, 3, 4].map(n => (
        <figure key={n} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
            Levels={n}
          </figcaption>
          <Breadcrumb homeHref="#" items={levels(n)} aria-label={`Breadcrumb, ${n} levels`} />
        </figure>
      ))}
    </div>
  ),
  parameters: { ...figma('1537:1545', 'Breadcrumb › Default'), controls: { disable: true } },
};
