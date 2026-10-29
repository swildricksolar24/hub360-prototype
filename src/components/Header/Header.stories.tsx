import type { Meta, StoryObj } from '@storybook/react-vite';
import { Header, type HeaderAction } from './Header';
import { Logo } from '../Logo/Logo';
import { Avatar } from '../Avatar/Avatar';
import { figma } from '../../storybook/figma';

const actions = (counts: boolean): HeaderAction[] => [
  { id: 'notifications', icon: 'notification', label: 'Notifications', count: counts ? 2 : undefined },
  { id: 'chat', icon: 'chat', label: 'Messages', count: counts ? 4 : undefined },
  { id: 'email', icon: 'email', label: 'Email', count: counts ? 8 : undefined, disabled: !counts },
  { id: 'help', icon: 'question-mark-help', label: 'Help', disabled: true },
];

const meta = {
  title: 'Navigation/Header',
  component: Header,
  args: { logo: <Logo name="logo-side" />, avatar: <Avatar size="medium" label="Account" />, actions: actions(false) },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * Both Figma `State` variants. Figma draws Email and Help as `State=Disabled` buttons in Default,
 * and Email as enabled in Notifications; that is copied here.
 */
export const HeaderSet: Story = {
  name: 'Header',
  render: args => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
      <Header {...args} actions={actions(false)} />
      <Header {...args} actions={actions(true)} />
    </div>
  ),
  parameters: { ...figma('708:1883', 'Header (Main Nav) › Header'), controls: { disable: true } },
};
