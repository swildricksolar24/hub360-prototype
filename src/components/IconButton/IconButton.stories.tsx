import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton, type IconButtonProps } from './IconButton';
import { iconNames } from '../Icon/Icon';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates, type StateName } from '../../storybook/StateGrid';

const meta = {
  title: 'Primitives/IconButton',
  component: IconButton,
  args: { label: 'Go up', icon: 'arrow-up', variant: 'default', size: 'base' },
  argTypes: { icon: { control: 'select', options: iconNames } },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const STATES: StateName[] = ['Default', 'Hover', 'Press', 'Focus', 'Disabled', 'Selected'];

const figmaSet = (nodeId: string, figmaName: string, props: Partial<IconButtonProps>): Story => ({
  render: args => (
    <StateGrid
      states={STATES}
      render={state => <IconButton {...args} {...props} selected={state === 'Selected' || undefined} disabled={state === 'Disabled'} />}
    />
  ),
  parameters: { ...figma(nodeId, figmaName), ...pseudoStates, controls: { disable: true } },
});

export const Playground: Story = {};

export const Icon = figmaSet('25:355', 'Button Icon › Icon', { variant: 'default' });
export const Brand = figmaSet('2388:4991', 'Button Icon › Brand', { variant: 'brand' });
export const Number = figmaSet('692:1041', 'Button Icon › Number', { variant: 'default', number: 1, label: 'Page 1' });
/** Not its own Figma set: 44px, the height of the Small buttons beside it, as Tier 3 Expanded draws its icon buttons. */
export const Small = figmaSet('2644:3738', 'Tier 3 (Expanded icon buttons)', { size: 'small', icon: 'chevron-right', label: 'Next' });
/** 32px with an 18px icon: the icon buttons in Tier 3 Collapsed and Sticky. */
export const Tiny = figmaSet('3580:1325', 'Button Icon Tiny › Icon', { size: 'tiny', icon: 'chevron-right', label: 'Next' });

/** Not a Figma set: the 40px size used by Message's close button (padding `--space-4`). */
export const Compact = figmaSet('503:3072', 'Message › Close Button', { size: 'compact', icon: 'close-small', label: 'Close' });
