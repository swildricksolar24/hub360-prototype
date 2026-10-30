import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../../components/Button/Button';
import { AppModal, type AppModalProps } from './AppModal';

/** The app's screens live in the Figma "_Sign In / Shell" file, not the design-system library (figma() links there). */
const SHELL_FILE = 'https://www.figma.com/design/Dicn7aHuXXE7dmCg57RwwB/_Sign-In---Shell?node-id=782-12791';

function AppModalDemo(args: Omit<AppModalProps, 'open' | 'onClose'>) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button size="small" variant="outline" onClick={() => setOpen(true)}>
        Open modal
      </Button>
      <AppModal
        {...args}
        open={open}
        onClose={() => setOpen(false)}
        primaryAction={args.primaryAction && { ...args.primaryAction, onClick: () => setOpen(false) }}
      />
    </>
  );
}

const meta = {
  title: 'App/AppModal',
  component: AppModal,
  args: {
    open: true,
    onClose: () => {},
    title: 'Modal Title',
    description: 'Modal Body',
    primaryAction: { label: 'Label', onClick: () => {} },
  },
  parameters: { layout: 'fullscreen', design: { type: 'figma', url: SHELL_FILE } },
  render: ({ open: _open, onClose: _onClose, ...args }) => <AppModalDemo {...args} />,
} satisfies Meta<typeof AppModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The app's standard modal (800px "Dialog / Modal" over the Overlay). Switch the Theme toolbar for dark. */
export const Playground: Story = {};

/** A real use in the app: confirming Sign Out from the account menu. */
export const SignOutConfirm: Story = {
  args: {
    title: 'Sign out of HUB 360?',
    description: "You'll need to sign in again to get back to your open tabs.",
    primaryAction: { label: 'Sign Out', onClick: () => {} },
  },
};

/** Long content scrolls inside the body (Figma `Style=Scrollbar`). */
export const Scrollable: Story = {
  args: {
    title: 'Terms update',
    description: Array.from({ length: 12 }, () => 'Long body text that scrolls inside the modal.').join(' '),
    scrollable: true,
    primaryAction: { label: 'Accept', onClick: () => {} },
  },
};
