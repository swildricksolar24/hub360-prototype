import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag, type TagProps } from './Tag';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates, type StateName } from '../../storybook/StateGrid';

const meta = {
  title: 'Primitives/Tag',
  component: Tag,
  args: { children: 'Label', variant: 'default' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'outline', 'small', 'tiny'] },
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

const STATES: StateName[] = ['Default', 'Hover', 'Press', 'Focus', 'Disabled', 'Selected'];

/** One story per Figma component set: every `State` variant side by side. */
const figmaSet = (nodeId: string, figmaName: string, props: Omit<TagProps, 'children'>): Story => ({
  render: args => (
    <StateGrid
      states={STATES}
      render={state => (
        <Tag {...args} {...props} selected={state === 'Selected' || undefined} disabled={state === 'Disabled'}>
          Label
        </Tag>
      )}
    />
  ),
  parameters: { ...figma(nodeId, figmaName), ...pseudoStates, controls: { disable: true } },
});

export const Playground: Story = {};

export const Default = figmaSet('318:4725', 'Tag › Default*', { variant: 'default' });
export const Outline = figmaSet('339:4922', 'Tag › Outline*', { variant: 'outline' });
export const Small = figmaSet('339:4909', 'Tag › Small', { variant: 'small' });
export const Tiny = figmaSet('2610:6045', 'Tag › Tiny', { variant: 'tiny' });
