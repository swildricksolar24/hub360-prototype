import { useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Modal, ModalPanel, type ModalProps } from './Modal';
import { Overlay } from '../Overlay/Overlay';
import { Button } from '../Button/Button';
import { TextInput } from '../TextInput/TextInput';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates } from '../../storybook/StateGrid';

const LONG_BODY =
  'Body. Solar panels convert sunlight into electricity. A 400 W panel produces roughly 1.2 to 3 kWh per day, depending on location, tilt and shading. ' +
  'Production varies by season, and inverters, wiring and temperature reduce output further. Use the production estimate in the proposal to size the system.';

const DefaultActions = () => (
  <>
    <Button size="small" variant="outline">Label</Button>
    <Button size="small" variant="primary">Label</Button>
  </>
);

/** Button has no destructive variant; the Figma "Modal - Dynamic" footer uses Semantic Fill/Error Strong on a Primary button. */
const destructive = {
  '--bg': 'var(--color-semantic-fill-error-strong)',
  '--fg': 'var(--color-foundation-solid-white)',
} as CSSProperties;

/** Opens a real modal <dialog> from a button. */
function ModalDemo(args: Omit<ModalProps, 'open' | 'onClose'>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="small" variant="brand" onClick={() => setOpen(true)}>
        Open modal
      </Button>
      <Modal
        {...args}
        open={open}
        onClose={() => setOpen(false)}
        actions={
          args.actions ?? (
            <>
              <Button size="small" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="small" variant="brand" onClick={() => setOpen(false)}>Confirm</Button>
            </>
          )
        }
      />
    </>
  );
}

const meta = {
  title: 'Web Components/Modal',
  component: Modal,
  args: { open: false, title: 'Title', description: 'Body', variant: 'default', scrollable: false },
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'sectioned', 'confirm'] },
    open: { control: false },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Click the button: focus moves into the dialog, Escape or the scrim closes it, focus returns to the button. */
export const Playground: Story = {
  render: ({ open: _open, onClose: _onClose, ...args }) => <ModalDemo {...args} />,
};

const Caption = ({ children }: { children: string }) => (
  <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
    {children}
  </figcaption>
);

export const DialogModal: Story = {
  name: 'Dialog / Modal',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
      <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <Caption>Style=Default</Caption>
        <ModalPanel title="Title" description="Body" actions={<DefaultActions />} onClose={() => {}} />
      </figure>
      <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <Caption>Style=Scrollbar</Caption>
        <ModalPanel title="Title" description={LONG_BODY} scrollable actions={<DefaultActions />} onClose={() => {}} />
      </figure>
    </div>
  ),
  parameters: { ...figma('429:687', 'Modal* › Dialog / Modal'), controls: { disable: true } },
};

/** Toggle and Select from Figma's header and form are other components; Buttons and TextInputs stand in. */
export const ModalDynamic: Story = {
  name: 'Modal - Dynamic',
  render: () => (
    <ModalPanel
      variant="sectioned"
      title="Title"
      description="Description"
      headerActions={
        <>
          <Button size="small" variant="primary">Label</Button>
          <Button size="small" variant="primary">Select</Button>
        </>
      }
      onClose={() => {}}
      footerStart={<Button size="small" style={destructive}>Label</Button>}
      actions={
        <>
          <Button size="small" variant="outline">Label</Button>
          <Button size="small" variant="brand">Label</Button>
        </>
      }
    >
      <p className="text-tiny-regular" style={{ margin: 0, color: 'var(--color-gray-text-weak)' }}>*Indicates required field</p>
      <TextInput label="Label" placeholder="Select" required />
      <TextInput label="Label" placeholder="Placeholder" required />
      <TextInput label="Label" placeholder="Placeholder" />
      <TextInput label="Label" placeholder="Select" />
      <TextInput label="Label" placeholder="Select" />
    </ModalPanel>
  ),
  parameters: { ...figma('2684:8355', 'Modal* › Modal - Dynamic'), controls: { disable: true } },
};

export const ModalDialog: Story = {
  name: 'Modal - Dialog',
  render: () => (
    <ModalPanel
      variant="confirm"
      title="Title"
      description="Description"
      actions={
        <>
          <Button size="small" variant="outline">Cancel</Button>
          <Button size="small" variant="brand">Confirm</Button>
        </>
      }
    />
  ),
  parameters: { ...figma('2831:8727', 'Modal* › Modal - Dialog*'), controls: { disable: true } },
};

/**
 * Figma "Modal Screen*": Overlay plus an 800px Dialog / Modal, shown here in a 960×600 frame
 * (absolute Overlay) so it doesn't cover the docs page. `Modal` renders the same thing in a real <dialog>.
 */
export const ModalScreen: Story = {
  name: 'Modal Screen',
  render: () => (
    <div style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 960, height: 600, background: 'var(--color-surfaces-base)' }}>
      <Overlay position="absolute" />
      <ModalPanel title="Title" description="Body" width={800} actions={<DefaultActions />} onClose={() => {}} />
    </div>
  ),
  parameters: { ...figma('805:922', 'Modal Screen › Modal Screen*'), controls: { disable: true } },
};

/**
 * The close button's states: Figma "Button / Icon Only / Small / Secondary" (44px). Hover fades from
 * Gray Fill/Weaker to Gray Fill/Hover; Press uses Gray Fill/Press; keyboard Focus adds a 2px ring.
 */
export const CloseButton: Story = {
  name: 'Close Button',
  render: () => (
    <StateGrid
      states={['Default', 'Hover', 'Press', 'Focus']}
      render={() => <ModalPanel title="Title" width={320} onClose={() => {}} />}
    />
  ),
  parameters: { ...figma('690:3483', 'Button / Icon Only / Small / Secondary'), ...pseudoStates, controls: { disable: true } },
};
