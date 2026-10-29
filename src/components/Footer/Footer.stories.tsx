import type { Meta, StoryObj } from '@storybook/react-vite';
import { Footer } from './Footer';
import { figma } from '../../storybook/figma';

const meta = {
  title: 'Navigation/Footer',
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
  parameters: { ...figma('1544:2832', 'Footer (Interior Nav) › Footer'), controls: { disable: true } },
};
