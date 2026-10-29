import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon, iconNames } from './Icon';
import { figma } from '../../storybook/figma';

const meta = {
  title: 'Foundations/Icon',
  component: Icon,
  args: { name: 'account', size: 24 },
  argTypes: {
    name: { control: 'select', options: iconNames },
    size: { control: 'select', options: [20, 24, 32] },
    color: { control: 'text' },
  },
  parameters: figma('56:932', 'Icon / Material'),
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const Grid = ({ names }: { names: string[] }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))', gap: 'var(--space-16)' }}>
    {names.map(name => (
      <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-8)' }}>
        <Icon name={name} />
        <span className="text-tiny-regular" style={{ color: 'var(--color-gray-text-weak)' }}>{name}</span>
      </div>
    ))}
  </div>
);

const SET_PREFIXES = ['chevron-', 'arrow-', 'last-'];

/** `Icon` = 95 variants. Figma's variant names map to kebab-case file names. */
export const Material: Story = {
  render: () => <Grid names={iconNames.filter(n => !SET_PREFIXES.some(p => n.startsWith(p)))} />,
  parameters: figma('56:932', 'Icon / Material'),
};

/** `Direction` = Up, Down, Left, Right, Double Down, Double Up. */
export const Chevron: Story = {
  render: () => <Grid names={iconNames.filter(n => n.startsWith('chevron-'))} />,
  parameters: figma('32:920', 'Icon / Chevron'),
};

/** `Direction` = Up, Down, Left, Right. */
export const Arrow: Story = {
  render: () => <Grid names={iconNames.filter(n => n.startsWith('arrow-'))} />,
  parameters: figma('23:137', 'Icon / Arrow'),
};

/** `Direction` = Up, Down, Left, Right. */
export const Last: Story = {
  render: () => <Grid names={iconNames.filter(n => n.startsWith('last-'))} />,
  parameters: figma('692:1076', 'Icon / Last'),
};
