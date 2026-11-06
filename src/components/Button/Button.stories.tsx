import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, type ButtonProps } from './Button';
import { iconNames } from '../Icon/Icon';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates, type StateName } from '../../storybook/StateGrid';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  args: { children: 'Label', variant: 'primary', size: 'base' },
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

/** Like figmaSet, but the story is named after the Figma set. */
const named = (name: string, story: Story): Story => ({ ...story, name });

// Button Large (Figma page "- Button Large")
export const BasePrimary = named('Solid / Gray / Base', figmaSet('629:933', 'Button Large › Solid / Gray / Base', { size: 'base', variant: 'primary' }));
export const BasePrimaryIcon = named('Solid / Gray / Icon', figmaSet('629:917', 'Button Large › Solid / Gray / Icon', { size: 'base', variant: 'primary', icon: 'arrow-up' }));
export const BaseGrayOutline = named('Solid / Gray / Outline', figmaSet('3368:236', 'Button Large › Solid / Gray / Outline', { size: 'base', variant: 'gray-outline' }));
export const BaseOutline = named('Clear / Base', figmaSet('24:214', 'Button Large › Clear / Base', { size: 'base', variant: 'outline' }));
export const BaseOutlineIcon = named('Clear / Icon', figmaSet('25:230', 'Button Large › Clear /  Icon', { size: 'base', variant: 'outline', icon: 'arrow-up' }));
export const BaseBrandTeal = named('Solid / Teal / Base', figmaSet('1751:3499', 'Button Large › Solid / Teal / Base', { size: 'base', variant: 'brand' }));
export const BaseBrandTealIcon = named('Solid / Teal / Icon', figmaSet('1751:3521', 'Button Large › Solid / Teal / Icon', { size: 'base', variant: 'brand', icon: 'arrow-up' }));
export const BaseBrandTealOutline = named('Solid / Teal / Outline', figmaSet('3234:4981', 'Button Large › Solid / Teal / Outline', { size: 'base', variant: 'brand-outline' }));
export const BaseBrandOrange = named('Solid / Orange', figmaSet('1751:3510', 'Button Large › Solid / Orange / ', { size: 'base', variant: 'brand-orange' }));
export const BaseBrandOrangeIcon = named('Solid / Orange / Icon', figmaSet('1751:3532', 'Button Large › Solid / Orange / Icon', { size: 'base', variant: 'brand-orange', icon: 'arrow-up' }));
export const BaseOrangeOutline = named('Solid / Orange / Outline', figmaSet('3368:249', 'Button Large › Solid / Orange / Outline', { size: 'base', variant: 'orange-outline' }));

// Button Block
export const BlockPrimary = figmaSet('25:408', 'Button Block › Primary', { size: 'base', variant: 'primary', block: true }, 440);
export const BlockPrimaryIcon = figmaSet('25:376', 'Button Block › Primary / Icon', { size: 'base', variant: 'primary', block: true, icon: 'arrow-up' }, 440);
export const BlockOutline = figmaSet('25:430', 'Button Block › Primary / Outline', { size: 'base', variant: 'outline', block: true }, 440);
export const BlockBrand = figmaSet('1751:3585', 'Button Block › Brand / Default*', { size: 'base', variant: 'brand', block: true }, 360);
export const BlockBrandIcon = figmaSet('1751:3596', 'Button Block › Brand / Icon*', { size: 'base', variant: 'brand', block: true, icon: 'arrow-up' }, 360);

// Button Small
export const SmallPrimary = figmaSet('401:417', 'Button Small › Primary / Default', { size: 'small', variant: 'primary' });
export const SmallPrimaryIcon = figmaSet('401:401', 'Button Small › Primary / Icon', { size: 'small', variant: 'primary', icon: 'account' });
export const SmallOutline = figmaSet('401:363', 'Button Small › Outline / Default', { size: 'small', variant: 'outline' });
export const SmallOutlineIcon = figmaSet('401:347', 'Button Small › Outline / Icon*', { size: 'small', variant: 'outline', icon: 'account' });
export const SmallBrand = figmaSet('1751:3632', 'Button Small › Brand / Default', { size: 'small', variant: 'brand' });
export const SmallBrandIconLeft = figmaSet('1751:3643', 'Button Small › Brand / Default / Icon - Left*', { size: 'small', variant: 'brand', icon: 'account' });
export const SmallBrandIconRight = figmaSet('2392:572', 'Button Small › Brand / Default / Icon - Right*', { size: 'small', variant: 'brand', icon: 'account', iconPosition: 'right' });
export const SmallBrandOutline = figmaSet('3290:6405', 'Button Small › Brand / Small / Outline', { size: 'small', variant: 'brand-outline' });
export const SmallBrandRed = figmaSet('3358:6168', 'Button Small Brand › Brand / Small / Red', { size: 'small', variant: 'brand-red' });
export const SmallBrandSecondary =figmaSet('2548:3743', 'Button Small › Brand / Secondary*', { size: 'small', variant: 'brand-secondary' });
export const SmallBrandSecondaryIconLeft = figmaSet('2734:1004', 'Button Small › Brand / Secondary / Icon - Left*', { size: 'small', variant: 'brand-secondary', icon: 'account' });
export const SmallBrandSecondaryIconRight = figmaSet('2734:1035', 'Button Small › Brand / Secondary / Icon - Right*', { size: 'small', variant: 'brand-secondary', icon: 'account', iconPosition: 'right' });

// Button Tiny
export const TinyPrimary = figmaSet('2193:6401', 'Button Tiny › Primary', { size: 'tiny', variant: 'primary' });
export const TinyText = figmaSet('2193:6668', 'Button Tiny › Text', { size: 'tiny', variant: 'text' });
export const TinyBrand = figmaSet('3298:407', 'Button Tiny › Primary / Tiny / Brand', { size: 'tiny', variant: 'brand' });
