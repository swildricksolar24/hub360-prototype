import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumb } from './Breadcrumb';
import { figma } from '../../storybook/figma';

const meta = {
  title: 'Navigation/Breadcrumb',
  component: Breadcrumb,
  args: {
    size: 'small',
    homeHref: '#',
    items: [{ label: 'Label', href: '#' }, { label: 'Label', href: '#' }, { label: 'Label' }],
  },
  argTypes: { size: { control: 'inline-radio', options: ['small', 'default'] } },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

const levels = (n: number) => Array.from({ length: n }, (_, i) => ({ label: 'Label', href: i < n - 1 ? '#' : undefined }));

export const Playground: Story = {};

/** Figma Primitive › Breadcrumb › Parts: `Position=Start` (home + chevron + label) and `Position=Next` (chevron + label). */
export const Parts: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
      <Breadcrumb size="small" homeHref="#" items={[{ label: 'Label' }]} aria-label="Position=Start" />
      <Breadcrumb size="small" homeHref="#" items={levels(2)} aria-label="Position=Start + Next" />
    </div>
  ),
  parameters: { ...figma('1537:1525', 'Breadcrumb (Primitive) › Parts'), controls: { disable: true } },
};

/** Figma Primitive › Breadcrumb › Default, `Levels` 1–4. */
export const Default: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
      {[1, 2, 3, 4].map(n => (
        <figure key={n} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
            Levels={n}
          </figcaption>
          <Breadcrumb size="small" homeHref="#" items={levels(n)} aria-label={`Breadcrumb, ${n} levels`} />
        </figure>
      ))}
    </div>
  ),
  parameters: { ...figma('1537:1545', 'Breadcrumb (Primitive) › Default'), controls: { disable: true } },
};

/** Figma Web Components › Breadcrumb. */
export const Web: Story = {
  args: { size: 'default', items: [{ label: 'Folder 1', href: '#' }, { label: 'Folder 2' }] },
  parameters: { ...figma('483:1252', 'Breadcrumb (Web) › Breadcrumb'), controls: { disable: true } },
};
