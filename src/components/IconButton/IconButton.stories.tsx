import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton, type IconButtonProps } from './IconButton';
import { iconNames } from '../Icon/Icon';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates, type StateName } from '../../storybook/StateGrid';

const meta = {
  title: 'Primitives/IconButton',
  component: IconButton,
  args: { label: 'Go up', icon: 'arrow-up', variant: 'default', size: 'large' },
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

/** Large: Figma "Button Icon Large (76px)", a 76px square with a 32px icon. */
export const Icon = figmaSet('25:355', 'Button Icon Large › Icon', { variant: 'default' });
export const Brand = figmaSet('2388:4991', 'Button Icon Large › Brand', { variant: 'brand' });
export const Number = figmaSet('692:1041', 'Button Icon Large › Number', { variant: 'default', number: 1, label: 'Page 1' });
/** Medium: Figma "Button Icon Medium (44px)", beside the toolbar's 44px buttons (Tier 3 Expanded, Message's close button). */
export const Medium = figmaSet('3580:1204', 'Button Icon Medium › Icon', { size: 'medium', icon: 'chevron-right', label: 'Next' });
/** Small: Figma "Button Icon Small (32px)", an 18px icon with 8px corners: Tier 3 Collapsed and Sticky. */
export const Small = figmaSet('3580:1325', 'Button Icon Small › Icon', { size: 'small', icon: 'chevron-right', label: 'Next' });
