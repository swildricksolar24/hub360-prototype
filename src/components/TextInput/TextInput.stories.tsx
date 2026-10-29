import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextInput, type TextInputProps } from './TextInput';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates, type StateName } from '../../storybook/StateGrid';

const meta = {
  title: 'Components/TextInput',
  component: TextInput,
  args: { label: 'Label', placeholder: 'Placeholder' },
  decorators: [Story => <div style={{ maxWidth: 360 }}><Story /></div>],
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const STATES: StateName[] = ['Default', 'Hover', 'Press', 'Focus', 'Disabled', 'Error', 'Required'];

const figmaSet = (nodeId: string, figmaName: string, props: Partial<TextInputProps>): Story => ({
  render: args => (
    <StateGrid
      direction="column"
      states={STATES}
      render={state => (
        <div style={{ width: 360 }}>
          <TextInput
            {...args}
            {...props}
            error={state === 'Error' ? 'Error' : undefined}
            disabled={state === 'Disabled'}
            required={state === 'Required'}
          />
        </div>
      )}
    />
  ),
  parameters: { ...figma(nodeId, figmaName), ...pseudoStates, controls: { disable: true } },
});

export const Playground: Story = {};

export const Default = figmaSet('218:3960', 'Text Input - Label › Default', {});
export const LeftIcon = figmaSet('277:4338', 'Text Input - Label › Left Icon*', { leftIcon: 'account' });
export const RightIcon = figmaSet('303:4430', 'Text Input - Label › Right Icon', { rightIcons: ['visibility'] });
export const RightDoubleIcon = figmaSet('2717:185', 'Text Input - Label › Right Double Icon', { rightIcons: ['visibility', 'visibility'] });
