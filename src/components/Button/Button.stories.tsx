import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, type ButtonProps } from './Button';
import { iconNames } from '../Icon/Icon';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates, type StateName } from '../../storybook/StateGrid';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  args: { children: 'Label', variant: 'primary', size: 'large' },
  argTypes: {
    icon: { control: 'select', options: [undefined, ...iconNames] },
    iconPosition: { control: 'inline-radio', options: ['left', 'right'] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const STATES: StateName[] = ['Default', 'Hover', 'Press', 'Selected', 'Focus', 'Disabled'];

/** One story per Figma component set: every `State` variant side by side. */
const figmaSet = (nodeId: string, figmaName: string, props: Omit<ButtonProps, 'children'>, width?: number): Story => ({
  render: args => (
    <StateGrid
      states={STATES}
      render={state => (
        <div style={{ width }}>
          <Button {...args} {...props} selected={state === 'Selected' || undefined} disabled={state === 'Disabled'}>
            Label
          </Button>
        </div>
      )}
    />
  ),
  parameters: { ...figma(nodeId, figmaName), ...pseudoStates, controls: { disable: true } },
});

export const Playground: Story = {};

// Button Large (Figma page "- Button Large")
export const LargePrimary: Story = { ...figmaSet('629:933', 'Button Large › Solid / Gray / Base', { size: 'large', variant: 'primary' }), name: 'Solid / Gray / Base' };
export const LargePrimaryIcon: Story = { ...figmaSet('629:917', 'Button Large › Solid / Gray / Icon', { size: 'large', variant: 'primary', icon: 'arrow-up' }), name: 'Solid / Gray / Icon' };
export const LargeGrayOutline: Story = { ...figmaSet('3368:236', 'Button Large › Solid / Gray / Outline', { size: 'large', variant: 'gray-outline' }), name: 'Solid / Gray / Outline' };
export const LargeOutline: Story = { ...figmaSet('24:214', 'Button Large › Clear / Base', { size: 'large', variant: 'outline' }), name: 'Clear / Base' };
export const LargeOutlineIcon: Story = { ...figmaSet('25:230', 'Button Large › Clear /  Icon', { size: 'large', variant: 'outline', icon: 'arrow-up' }), name: 'Clear / Icon' };
export const LargeBrandTeal: Story = { ...figmaSet('1751:3499', 'Button Large › Solid / Teal / Base', { size: 'large', variant: 'brand' }), name: 'Solid / Teal / Base' };
export const LargeBrandTealIcon: Story = { ...figmaSet('1751:3521', 'Button Large › Solid / Teal / Icon', { size: 'large', variant: 'brand', icon: 'arrow-up' }), name: 'Solid / Teal / Icon' };
export const LargeBrandTealOutline: Story = { ...figmaSet('3234:4981', 'Button Large › Solid / Teal / Outline', { size: 'large', variant: 'brand-outline' }), name: 'Solid / Teal / Outline' };
export const LargeBrandOrange: Story = { ...figmaSet('1751:3510', 'Button Large › Solid / Orange / Base', { size: 'large', variant: 'brand-orange' }), name: 'Solid / Orange / Base' };
export const LargeBrandOrangeIcon: Story = { ...figmaSet('1751:3532', 'Button Large › Solid / Orange / Icon', { size: 'large', variant: 'brand-orange', icon: 'arrow-up' }), name: 'Solid / Orange / Icon' };
export const LargeOrangeOutline: Story = { ...figmaSet('3368:249', 'Button Large › Solid / Orange / Outline', { size: 'large', variant: 'orange-outline' }), name: 'Solid / Orange / Outline' };

// Button Block
export const BlockPrimary = figmaSet('25:408', 'Button Block › Primary', { size: 'large', variant: 'primary', block: true }, 440);
export const BlockPrimaryIcon = figmaSet('25:376', 'Button Block › Primary / Icon', { size: 'large', variant: 'primary', block: true, icon: 'arrow-up' }, 440);
export const BlockOutline = figmaSet('25:430', 'Button Block › Primary / Outline', { size: 'large', variant: 'outline', block: true }, 440);
export const BlockBrand = figmaSet('1751:3585', 'Button Block › Brand / Default*', { size: 'large', variant: 'brand', block: true }, 360);
export const BlockBrandIcon = figmaSet('1751:3596', 'Button Block › Brand / Icon*', { size: 'large', variant: 'brand', block: true, icon: 'arrow-up' }, 360);

// Button Medium
export const MediumPrimary = figmaSet('401:417', 'Button Medium › Primary / Default', { size: 'medium', variant: 'primary' });
export const MediumPrimaryIcon = figmaSet('401:401', 'Button Medium › Primary / Icon', { size: 'medium', variant: 'primary', icon: 'account' });
export const MediumOutline = figmaSet('401:363', 'Button Medium › Outline / Default', { size: 'medium', variant: 'outline' });
export const MediumOutlineIcon = figmaSet('401:347', 'Button Medium › Outline / Icon*', { size: 'medium', variant: 'outline', icon: 'account' });
export const MediumBrand = figmaSet('1751:3632', 'Button Medium › Brand / Default', { size: 'medium', variant: 'brand' });
export const MediumBrandIconLeft = figmaSet('1751:3643', 'Button Medium › Brand / Default / Icon - Left*', { size: 'medium', variant: 'brand', icon: 'account' });
export const MediumBrandIconRight = figmaSet('2392:572', 'Button Medium › Brand / Default / Icon - Right*', { size: 'medium', variant: 'brand', icon: 'account', iconPosition: 'right' });
export const MediumBrandOutline = figmaSet('3290:6405', 'Button Medium › Brand / Small / Outline', { size: 'medium', variant: 'brand-outline' });
export const MediumBrandRed = figmaSet('3358:6168', 'Button Medium › Solid / Red / Base', { size: 'medium', variant: 'brand-red' });
export const SmallRedOutline: Story = { ...figmaSet('3392:197', 'Button Medium › Clear / Red', { size: 'medium', variant: 'red-outline' }), name: 'Clear / Red' };
export const MediumBrandSecondary =figmaSet('2548:3743', 'Button Medium › Brand / Secondary*', { size: 'medium', variant: 'brand-secondary' });
export const MediumBrandSecondaryIconLeft = figmaSet('2734:1004', 'Button Medium › Brand / Secondary / Icon - Left*', { size: 'medium', variant: 'brand-secondary', icon: 'account' });
export const MediumBrandSecondaryIconRight = figmaSet('2734:1035', 'Button Medium › Brand / Secondary / Icon - Right*', { size: 'medium', variant: 'brand-secondary', icon: 'account', iconPosition: 'right' });

// Button Small
export const SmallPrimary = figmaSet('2193:6401', 'Button Small › Solid / Gray / Base', { size: 'small', variant: 'primary' });
export const SmallText = figmaSet('2193:6668', 'Button Small › Text / White', { size: 'small', variant: 'text' });
export const SmallBrand = figmaSet('3298:407', 'Button Small › Solid / Teal / Base', { size: 'small', variant: 'brand' });
