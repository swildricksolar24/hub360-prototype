import type { Meta, StoryObj } from '@storybook/react-vite';
import { SubMenu, type SubMenuVariant } from './SubMenu';
import { figma } from '../../storybook/figma';

const items = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `item-${i + 1}`, label: 'Label' }));

const meta = {
  title: 'Navigation/SubMenu',
  component: SubMenu,
  args: { items: items(10), value: 'item-4', variant: 'default' },
  argTypes: { variant: { control: 'inline-radio', options: ['default', 'tiny', 'text'] } },
} satisfies Meta<typeof SubMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Every Figma `State` of the Sub Menu set. Figma selects the third item in Tiny and Text; it is selected in all three here. */
export const SubMenuSet: Story = {
  name: 'Sub Menu',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
      {(
        [
          ['default', 10],
          ['tiny', 8],
          ['text', 8],
        ] as [SubMenuVariant, number][]
      ).map(([variant, n]) => (
        <figure key={variant} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
            State={variant === 'default' ? 'Default' : variant === 'tiny' ? 'Tiny' : 'Text'}
          </figcaption>
          <SubMenu items={items(n)} value="item-3" variant={variant} aria-label={`Sub menu ${variant}`} />
        </figure>
      ))}
    </div>
  ),
  parameters: { ...figma('708:1502', 'Sub Menu (Interior Nav) › Sub Menu'), controls: { disable: true } },
};
