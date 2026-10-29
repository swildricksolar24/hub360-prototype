import type { Meta, StoryObj } from '@storybook/react-vite';
import { MainDropDown } from './MainDropDown';
import { iconNames } from '../Icon/Icon';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates, type StateName } from '../../storybook/StateGrid';

const WORKSPACES = [
  { value: 'st', label: 'Solar Topps' },
  { value: 'tx', label: 'Texala' },
  { value: 'h360', label: 'HUB 360' },
];

const meta = {
  title: 'Custom/MainDropDown',
  component: MainDropDown,
  args: { options: WORKSPACES, 'aria-label': 'Workspace', icon: 'account', defaultValue: 'st' },
  argTypes: { icon: { control: 'select', options: iconNames } },
  decorators: [Story => <div style={{ minHeight: 220 }}><Story /></div>],
} satisfies Meta<typeof MainDropDown>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Click or ↓ to open; Enter chooses and closes; Escape closes. */
export const Playground: Story = {};

const STATES: StateName[] = ['Default', 'Hover', 'Press', 'Focus', 'Disabled'];

export const MainDropDownSet: Story = {
  name: 'Main Drop Down',
  render: args => (
    <StateGrid states={STATES} render={state => <MainDropDown {...args} label="Label" disabled={state === 'Disabled'} />} />
  ),
  parameters: { ...figma('711:13334', 'Main Drop Down* › Main Drop Down*'), ...pseudoStates, controls: { disable: true } },
};

/** Not a Figma set: the menu open. */
export const Open: Story = { args: { defaultOpen: true } };
