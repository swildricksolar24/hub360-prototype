import type { Meta, StoryObj } from '@storybook/react-vite';
import { Hyperlink, type HyperlinkProps } from './Hyperlink';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates, type StateName } from '../../storybook/StateGrid';

const meta = {
  title: 'Primitives/Hyperlink',
  component: Hyperlink,
  args: { children: 'Label', size: 'medium', href: '#' },
  argTypes: { size: { control: 'inline-radio', options: ['large', 'medium', 'small'] } },
} satisfies Meta<typeof Hyperlink>;

export default meta;
type Story = StoryObj<typeof meta>;

const STATES: StateName[] = ['Default', 'Hover', 'Press', 'Focus', 'Disabled'];

const figmaSet = (nodeId: string, figmaName: string, props: Partial<HyperlinkProps>): Story => ({
  render: args => (
    <StateGrid
      states={STATES}
      render={state => (
        <Hyperlink {...args} {...props} disabled={state === 'Disabled'}>
          Label
        </Hyperlink>
      )}
    />
  ),
  parameters: { ...figma(nodeId, figmaName), ...pseudoStates, controls: { disable: true } },
});

export const Playground: Story = {};

export const Large = figmaSet('209:3842', 'Hyperlink › Large*', { size: 'large' });
export const Medium = figmaSet('195:3817', 'Hyperlink › Medium', { size: 'medium' });
export const Small = figmaSet('385:5469', 'Hyperlink › Small', { size: 'small' });
