import type { Meta, StoryObj } from '@storybook/react-vite';
import { Logo, logoNames, type LogoName, type LogoProps } from './Logo';
import { figma } from '../../storybook/figma';

const meta = {
  title: 'Foundations/Logo',
  component: Logo,
  args: { name: 'logo-full' },
  argTypes: {
    name: { control: 'select', options: logoNames },
    brand: { control: 'inline-radio', options: ['HUB 360', 'SS 360'] },
    height: { control: { type: 'number', min: 12, max: 240 } },
  },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** One story per Figma logo set; every set has a single `State=Default` variant. */
const figmaSet = (nodeId: string, figmaName: string, name: LogoName, extra?: Partial<LogoProps>): Story => ({
  args: { name, ...extra },
  parameters: { ...figma(nodeId, `Logos* › ${figmaName}`), controls: { disable: true } },
});

export const LogoIcon = figmaSet('1:141', 'Logo Icon', 'logo-icon');
export const LogoFull = figmaSet('12:820', 'Logo Full', 'logo-full');
export const LogoTexala = figmaSet('79:1443', 'Logo Texala', 'logo-texala');
export const Recaptcha = figmaSet('543:1693', 'Recaptcha', 'recaptcha');
export const EqualHousingLender = figmaSet('588:622', 'Equal Housing Lender*', 'equal-housing-lender');
export const FaceId = figmaSet('593:1117', 'Face ID Symbol*', 'face-id');
export const Google = figmaSet('1902:3795', 'Google', 'google');
export const Microsoft = figmaSet('1902:3803', 'Microsoft', 'microsoft');

/** Logo Side: both `Brand` variants. Icon segments and text follow `--color-logo-color` (teal in light, white in dark). */
export const LogoSide: Story = {
  args: { name: 'logo-side' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)', alignItems: 'flex-start' }}>
      {(['HUB 360', 'SS 360'] as const).map(brand => (
        <figure key={brand} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
            Brand={brand}
          </figcaption>
          <Logo name="logo-side" brand={brand} />
        </figure>
      ))}
    </div>
  ),
  parameters: { ...figma('678:371', 'Logos* › Logo Side'), controls: { disable: true } },
};
