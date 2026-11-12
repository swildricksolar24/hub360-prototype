import type { Meta, StoryObj } from '@storybook/react-vite';
import { Footer } from './Footer';
import { figma } from '../../storybook/figma';

const meta = {
  title: 'Components/Navigation/Footer',
  component: Footer,
  args: {
    copyright: '© 2026 HUB360, All Rights Reserved',
    version: 'Version: 0.246',
    links: [
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Terms of Service', href: '#terms' },
      { label: 'Cookie Policy', href: '#cookies' },
      { label: 'Accessibility Statement', href: '#accessibility' },
    ],
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const FooterSet: Story = {
  name: 'Footer',
  parameters: { ...figma('1544:2832', 'Footer › Footer'), controls: { disable: true } },
};

/**
 * The version stays centered between the end of the copyright and the start of the links, whatever their widths:
 * the app shell's 1024px minimum, a 1440px and a 1920px window (scroll sideways to see the widest).
 */
export const CenteredVersion: Story = {
  name: 'Centered version',
  render: args => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)', padding: 'var(--space-24) 0', overflowX: 'auto' }}>
      {[1024, 1440, 1920].map(width => (
        <div key={width} style={{ width, flex: 'none' }}>
          <p className="text-small-regular" style={{ margin: '0 0 var(--space-8)', color: 'var(--color-gray-text-weak)' }}>{`${width}px`}</p>
          <Footer {...args} />
        </div>
      ))}
    </div>
  ),
  parameters: { controls: { disable: true } },
};
