import type { Meta, StoryObj } from '@storybook/react-vite';
import { SideMenuButton, type SideMenuButtonProps } from './SideMenuButton';
import { iconNames } from '../Icon/Icon';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates, type StateName } from '../../storybook/StateGrid';

const meta = {
  title: 'Navigation/SideMenuButton',
  component: SideMenuButton,
  args: { label: 'Label', icon: 'arrow-up', tier: 1, variant: 'default' },
  argTypes: {
    icon: { control: 'select', options: iconNames },
    tier: { control: 'inline-radio', options: [1, 2] },
    variant: { control: 'inline-radio', options: ['default', 'compact', 'label'] },
  },
} satisfies Meta<typeof SideMenuButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const STATES: StateName[] = ['Default', 'Hover', 'Press', 'Selected', 'Focus', 'Disabled'];

const figmaSet = (nodeId: string, figmaName: string, props: Partial<SideMenuButtonProps>): Story => ({
  render: args => (
    <StateGrid
      states={STATES}
      render={state => (
        <SideMenuButton {...args} {...props} selected={state === 'Selected' || undefined} disabled={state === 'Disabled'} />
      )}
    />
  ),
  parameters: { ...figma(nodeId, figmaName), ...pseudoStates, controls: { disable: true } },
});

export const Playground: Story = {};

export const Tier1Default = figmaSet('683:2282', 'Button Side Menu › Side Menu / Tier 1 / Default', { tier: 1, variant: 'default' });
export const Tier1Compact = figmaSet('2171:2645', 'Button Side Menu › Side Menu / Tier 1 /Compact', { tier: 1, variant: 'compact' });
export const Tier2Default = figmaSet('685:196', 'Button Side Menu › Side Menu / Tier 2 / Default', { tier: 2, variant: 'default' });
export const Tier2Label = figmaSet('2190:5985', 'Button Side Menu › Side Menu / Tier 2 / Label', { tier: 2, variant: 'label' });
export const Tier2Compact = figmaSet('2171:2677', 'Button Side Menu › Side Menu / Tier 2 / Compact', { tier: 2, variant: 'compact' });
