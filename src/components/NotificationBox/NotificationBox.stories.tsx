import type { Meta, StoryObj } from '@storybook/react-vite';
import { NotificationBox, type NotificationType } from './NotificationBox';
import { figma } from '../../storybook/figma';

const meta = {
  title: 'Web Components/NotificationBox',
  component: NotificationBox,
  args: {
    type: 'chat',
    name: 'Selina Kyle',
    message: 'How much energy does a 400w panel produce?',
    time: '54min ago',
    actionLabel: 'Open message',
    onAction: () => {},
  },
  argTypes: { type: { control: 'inline-radio', options: ['alert', 'chat', 'email', 'read'] } },
} satisfies Meta<typeof NotificationBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const TYPES: NotificationType[] = ['alert', 'chat', 'email', 'read'];

/** The avatar shows the photo placeholder; pass `avatarSrc` for a real photo. */
export const Types: Story = {
  render: args => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
      {TYPES.map(type => (
        <figure key={type} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
            {`Type=${type[0].toUpperCase()}${type.slice(1)}`}
          </figcaption>
          <NotificationBox {...args} type={type} time={type === 'read' ? 'Sat, Jun 14' : '54min ago'} />
        </figure>
      ))}
    </div>
  ),
  parameters: { ...figma('744:4494', 'Notification Box* › Notification Box*'), controls: { disable: true } },
};
