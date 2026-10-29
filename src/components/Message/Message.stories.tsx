import type { Meta, StoryObj } from '@storybook/react-vite';
import { Message, type MessageType } from './Message';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates } from '../../storybook/StateGrid';

const meta = {
  title: 'Components/Message',
  component: Message,
  args: { title: 'Title', body: 'Body', type: 'neutral', onClose: () => {} },
  decorators: [Story => <div style={{ maxWidth: 357 }}><Story /></div>],
} satisfies Meta<typeof Message>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Figma `State=Hover` is the close button's hover state. */
export const Neutral: Story = {
  render: args => (
    <StateGrid direction="column" states={['Default', 'Hover']} render={() => <div style={{ width: 357 }}><Message {...args} type="neutral" /></div>} />
  ),
  parameters: {
    ...figma('503:3072', 'Message › Message (State)'),
    ...pseudoStates,
    controls: { disable: true },
  },
};

const TYPES: MessageType[] = ['info', 'success', 'caution', 'error'];

/** Figma `Type` × `State`; Hover is the close button's hover state. */
export const Types: Story = {
  render: args => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
      {TYPES.map(type => (
        <StateGrid
          key={type}
          states={['Default', 'Hover']}
          render={() => (
            <div style={{ width: 357 }}>
              <Message {...args} type={type} title={`Title (${type})`} />
            </div>
          )}
        />
      ))}
    </div>
  ),
  parameters: {
    ...figma('503:3176', 'Message › Message (Type)'),
    ...pseudoStates,
    controls: { disable: true },
  },
};
