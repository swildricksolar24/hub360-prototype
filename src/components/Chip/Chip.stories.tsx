import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip, type ChipProps } from './Chip';
import { iconNames } from '../Icon/Icon';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates, type StateName } from '../../storybook/StateGrid';

const meta = {
  title: 'Primitives/Chip',
  component: Chip,
  args: { children: 'Label', variant: 'default', icon: 'arrow-up', iconPosition: 'left' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'secondary', 'outline', 'tiny'] },
    icon: { control: 'select', options: [undefined, ...iconNames] },
    iconPosition: { control: 'inline-radio', options: ['left', 'right'] },
  },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

const STATES: StateName[] = ['Default', 'Hover', 'Press', 'Focus', 'Disabled', 'Selected'];

/** One story per Figma component set: every `State` variant side by side. */
const figmaSet = (nodeId: string, figmaName: string, props: Omit<ChipProps, 'children'>): Story => ({
  render: args => (
    <StateGrid
      states={STATES}
      render={state => (
        <Chip {...args} {...props} selected={state === 'Selected' || undefined} disabled={state === 'Disabled'}>
          Label
        </Chip>
      )}
    />
  ),
  parameters: { ...figma(nodeId, figmaName), ...pseudoStates, controls: { disable: true } },
});

export const Playground: Story = {};

export const DefaultLeftIcon = figmaSet('318:4812', 'Chip › Default / Left Icon*', { variant: 'default', icon: 'arrow-up', iconPosition: 'left' });
export const DefaultRightIcon = figmaSet('318:4850', 'Chip › Default / Right Icon*', { variant: 'default', icon: 'close-small', iconPosition: 'right' });
export const SecondaryLeftIcon = figmaSet('342:4942', 'Chip › Secondary / Left Icon*', { variant: 'secondary', icon: 'arrow-up', iconPosition: 'left' });
export const SecondaryRightIcon = figmaSet('342:4973', 'Chip › Secondary / Right Icon', { variant: 'secondary', icon: 'arrow-up', iconPosition: 'right' });
export const OutlineLeftIcon = figmaSet('342:5005', 'Chip › Outline / Left Icon*', { variant: 'outline', icon: 'arrow-up', iconPosition: 'left' });
export const OutlineRightIcon = figmaSet('342:5036', 'Chip › Outline / Right Icon*', { variant: 'outline', icon: 'arrow-up', iconPosition: 'right' });
export const TinyIconLeft = figmaSet('2644:4046', 'Chip › Tiny / Icon Left', { variant: 'tiny', icon: 'arrow-up', iconPosition: 'left' });
export const TinyIconRight = figmaSet('2673:5696', 'Chip › Tiny / Icon Right', { variant: 'tiny', icon: 'arrow-up', iconPosition: 'right' });
