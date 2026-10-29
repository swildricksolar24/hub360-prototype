import type { Meta, StoryObj } from '@storybook/react-vite';
import { OtpInput } from './OtpInput';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates, type StateName } from '../../storybook/StateGrid';

const meta = {
  title: 'Primitives/OtpInput',
  component: OtpInput,
  args: { label: 'Verification code', length: 6, defaultValue: '' },
} satisfies Meta<typeof OtpInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const STATES: StateName[] = ['Default', 'Hover', 'Press', 'Focus', 'Disabled', 'Error'];

export const Playground: Story = {};

/** The Figma set is a single cell; each state shows one cell holding "0". */
export const OTPInput: Story = {
  name: 'OTP Input',
  render: args => (
    <StateGrid
      states={STATES}
      render={state => (
        <OtpInput {...args} length={1} defaultValue="0" error={state === 'Error'} disabled={state === 'Disabled'} />
      )}
    />
  ),
  parameters: { ...figma('414:1616', 'OTP Input* › OTP Input*'), ...pseudoStates, controls: { disable: true } },
};

export const Filled: Story = {
  args: { defaultValue: '4821' },
};

export const ErrorState: Story = {
  name: 'Error',
  args: { defaultValue: '482193', error: true },
};
