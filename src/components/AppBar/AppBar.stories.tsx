import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppBar } from './AppBar';
import { Logo } from '../Logo/Logo';
import { Dropdown } from '../Dropdown/Dropdown';
import { figma } from '../../storybook/figma';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
];

const meta = {
  title: 'Navigation/AppBar',
  component: AppBar,
  args: { logo: <Logo name="logo-side" />, onMenuClick: () => {} },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AppBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The five Figma "Drop Down Label › Default" filters are the AppBar's `children`. */
export const AppBarSet: Story = {
  name: 'AppBar',
  render: args => (
    <AppBar {...args}>
      {[1, 2, 3, 4, 5].map(n => (
        <div key={n} style={{ width: 100 }}>
          <Dropdown label="Label" placeholder="Select" options={FILTER_OPTIONS} />
        </div>
      ))}
    </AppBar>
  ),
  parameters: { ...figma('477:906', 'AppBar* › AppBar*'), controls: { disable: true } },
};
