import type { Meta, StoryObj } from '@storybook/react-vite';
import { LastModified } from './LastModified';
import { figma } from '../../storybook/figma';

const meta = {
  title: 'Primitives/LastModified',
  component: LastModified,
  args: { date: '2026-05-18T12:00:00', label: 'Last Updated:', locale: 'en-US' },
} satisfies Meta<typeof LastModified>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Date: Story = {
  parameters: { ...figma('2328:3773', 'Last Modified › Date'), controls: { disable: true } },
};
