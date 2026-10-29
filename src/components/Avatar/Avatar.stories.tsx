import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar, type AvatarSize, type AvatarType } from './Avatar';
import { iconNames } from '../Icon/Icon';
import { figma } from '../../storybook/figma';

const meta = {
  title: 'Primitives/Avatar',
  component: Avatar,
  args: { size: 'large', type: 'initial', initials: 'JR', label: 'Jordan Reyes' },
  argTypes: {
    size: { control: 'inline-radio', options: ['large', 'medium', 'small'] },
    type: { control: 'inline-radio', options: ['default', 'initial', 'photo', 'icon'] },
    icon: { control: 'select', options: iconNames },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

const Caption = ({ children }: { children: string }) => (
  <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
    {children}
  </figcaption>
);

const TYPES: AvatarType[] = ['default', 'initial', 'photo'];
const FIGMA_TYPE: Record<string, string> = { default: 'Default', initial: 'Initial', photo: 'Photo' };

const TypeRow = ({ size }: { size: AvatarSize }) => (
  <div style={{ display: 'flex', gap: 'var(--space-24)', alignItems: 'flex-start' }}>
    {TYPES.map(type => (
      <figure key={type} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <Caption>{`Type=${FIGMA_TYPE[type]}`}</Caption>
        <Avatar size={size} type={type} initials="JR" />
      </figure>
    ))}
  </div>
);

export const Playground: Story = {};

export const Large: Story = {
  render: () => <TypeRow size="large" />,
  parameters: { ...figma('424:278', 'Avatar* › Large'), controls: { disable: true } },
};

export const Medium: Story = {
  render: () => <TypeRow size="medium" />,
  parameters: { ...figma('429:13', 'Avatar* › Medium'), controls: { disable: true } },
};

export const Small: Story = {
  render: () => <TypeRow size="small" />,
  parameters: { ...figma('429:22', 'Avatar* › Small'), controls: { disable: true } },
};

const SIZES: AvatarSize[] = ['large', 'medium', 'small'];

/** Figma "Icon*" (`Size`); the photo placeholder is shown because remote images aren't loaded. */
export const IconAvatar: Story = {
  name: 'Icon',
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-24)', alignItems: 'flex-start' }}>
      {SIZES.map(size => (
        <figure key={size} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <Caption>{`Size=${size[0].toUpperCase()}${size.slice(1)}`}</Caption>
          <Avatar size={size} type="icon" />
        </figure>
      ))}
    </div>
  ),
  parameters: { ...figma('1786:3173', 'Avatar* › Icon*'), controls: { disable: true } },
};
