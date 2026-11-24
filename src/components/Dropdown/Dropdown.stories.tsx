import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dropdown, type DropdownProps } from './Dropdown';
import { DropdownChips } from './DropdownChips';
import { DropdownStateGrid, STATE_OPTIONS } from './storyGrid';
import { iconNames } from '../Icon/Icon';
import { figma } from '../../storybook/figma';
import { pseudoStates } from '../../storybook/StateGrid';

const meta = {
  title: 'Components/Forms/Dropdown',
  component: Dropdown,
  args: { options: STATE_OPTIONS, label: 'Label', placeholder: 'Select', variant: 'field' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['field', 'button', 'icon'] },
    size: { control: 'inline-radio', options: ['large', 'medium', 'small'] },
    icon: { control: 'select', options: [undefined, ...iconNames] },
    listType: { control: 'inline-radio', options: [undefined, 'default', 'chevron', 'avatar', 'checkbox'] },
    error: { control: 'text' },
  },
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Live controls. Click or press ↓ to open, Enter to choose, Escape to close. */
export const Playground: Story = {
  decorators: [Story => <div style={{ maxWidth: 360, minHeight: 380 }}><Story /></div>],
};

const LABEL_STATES = ['Default', 'Default - Light', 'Hover', 'Press', 'Focus', 'Error', 'Disabled', 'Required'] as const;

export const LabelDefault: Story = {
  render: args => (
    <DropdownStateGrid
      direction="column"
      cellWidth={360}
      states={LABEL_STATES}
      render={state => (
        <Dropdown
          {...args}
          variant="field"
          light={state === 'Default - Light'}
          error={state === 'Error'}
          disabled={state === 'Disabled'}
          required={state === 'Required'}
        />
      )}
    />
  ),
  parameters: { ...figma('481:856', 'Drop Down Button + Label › Default'), ...pseudoStates, controls: { disable: true } },
};

export const LabelChips: Story = {
  render: () => (
    <div style={{ width: 360 }}>
      {/* `plain` is the set's own Surfaces/Overlay fill; `brand` (the default) is the Filter Chip's teal override */}
      <DropdownChips appearance="plain" items={Array.from({ length: 6 }, (_, i) => ({ value: String(i), label: 'Label' }))} />
    </div>
  ),
  parameters: { ...figma('2676:6014', 'Menu Options › Menu Options / Chips'), controls: { disable: true } },
};

const BUTTON_STATES = ['Default', 'Hover', 'Press', 'Focus', 'Disabled', 'Error'] as const;
/** The Drop Down Button sets also have Required (Nov 24, 2026): the 2px Brand Teal Stroke/Weak outline */
const BUTTON_STATES_REQUIRED = [...BUTTON_STATES, 'Required'] as const;

const buttonSet = (
  nodeId: string,
  figmaName: string,
  props: Partial<DropdownProps>,
  states: readonly string[] = BUTTON_STATES,
): Story => ({
  render: args => (
    <DropdownStateGrid
      states={states}
      render={state => (
        <Dropdown
          {...args}
          label={undefined}
          aria-label="Select"
          {...props}
          error={state === 'Error'}
          disabled={state === 'Disabled'}
          required={state === 'Required'}
        />
      )}
    />
  ),
  parameters: { ...figma(nodeId, figmaName), ...pseudoStates, controls: { disable: true } },
});

/* Drop Down Button (text): `variant="button"` with `size` */
export const ButtonLarge = buttonSet('56:936', 'Drop Down Button › Large', { variant: 'button', size: 'large' }, BUTTON_STATES_REQUIRED);
export const ButtonMedium = buttonSet('478:1190', 'Drop Down Button › Medium', { variant: 'button', size: 'medium' }, BUTTON_STATES_REQUIRED);
export const ButtonSmall = buttonSet('3584:1718', 'Drop Down Button › Small', { variant: 'button', size: 'small' }, BUTTON_STATES_REQUIRED);

/* Drop Down Icon Button (icon only): `variant="icon"` with `size` */
const account = { variant: 'icon', icon: 'account', 'aria-label': 'Account' } as const;
export const IconButtonLarge = buttonSet('56:1083', 'Drop Down Icon Button › Large', { ...account, size: 'large' });
export const IconButtonMedium = buttonSet('3595:3716', 'Drop Down Icon Button › Medium', { ...account, size: 'medium' });
export const IconButtonSmall = buttonSet('3595:3747', 'Drop Down Icon Button › Small', { ...account, size: 'small' });

/* Drop Down Icon + Label Button: `variant="button"` with an `icon` and `size` */
export const IconLabelLarge = buttonSet('56:1075', 'Drop Down Icon + Label Button › Large', { variant: 'button', icon: 'account', size: 'large' });
export const IconLabelMedium = buttonSet('3595:4477', 'Drop Down Icon + Label Button › Medium', { variant: 'button', icon: 'account', size: 'medium' });
export const IconLabelSmall = buttonSet('3595:4555', 'Drop Down Icon + Label Button › Small', { variant: 'button', icon: 'account', size: 'small' });

/**
 * Figma Drop Down Menu (Drop Down Label page): the open menu every Drop Down shares, a rounded Surfaces/Overlay panel
 * with an 8px inset and the drop shadow, 40px rows of Large text, the chosen option tinted teal. Shown open on a
 * 240px field, Figma's width.
 */
export const DropDownMenu: Story = {
  name: 'Drop Down Menu',
  render: function Render() {
    const [value, setValue] = useState<string | string[]>('1');
    return (
      <div style={{ width: 240, minHeight: 260 }}>
        <Dropdown
          label="Drop Down Menu"
          hideLabel
          options={[1, 2, 3, 4].map(n => ({ value: String(n), label: `Option ${n}` }))}
          defaultOpen
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
  parameters: { ...figma('3078:320', 'Drop Down Label › Drop Down Menu'), controls: { disable: true } },
};

/** Not a Figma set: the menus open, single-select (field) and multi-select (checkbox rows). */
export const Open: Story = {
  render: function Render(args) {
    const [single, setSingle] = useState<string | string[]>('az');
    const [multi, setMulti] = useState<string | string[]>(['al', 'az']);
    return (
      // Each cell reserves room for its open menu (which is absolutely positioned), so wrapped rows don't overlap
      <div style={{ display: 'flex', gap: 'var(--space-24)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ width: 360, minHeight: 400 }}>
          <Dropdown {...args} label="Single" defaultOpen value={single} onChange={setSingle} />
        </div>
        <div style={{ width: 360, minHeight: 400 }}>
          <Dropdown {...args} label="Multiple" multiple defaultOpen value={multi} onChange={setMulti} />
        </div>
        <div style={{ minHeight: 400 }}>
          <Dropdown {...args} label={undefined} aria-label="Small" variant="button" size="medium" listType="chevron" defaultOpen value={single} onChange={setSingle} />
        </div>
      </div>
    );
  },
  parameters: { controls: { disable: true } },
};

/**
 * Not in Figma: an option's `hint`, a short line under its label. Here an Actions menu with two active items checked:
 * Activate and Merge are off and say why. The hint stays readable on a disabled option (Gray Text/Weak, Small Regular),
 * wraps rather than widening the menu, and is read out with the option (`aria-describedby`).
 */
export const OptionHints: Story = {
  name: 'Option hints',
  render: () => (
    <div style={{ minHeight: 360 }}>
      <Dropdown
        variant="button"
        size="medium"
        label="Actions"
        hideLabel
        placeholder="Actions (2)"
        defaultOpen
        options={[
          { value: 'activate', label: 'Activate', disabled: true, hint: 'All checked items are already active' },
          { value: 'deactivate', label: 'Deactivate' },
          { value: 'merge', label: 'Merge', disabled: true, hint: 'Merge needs items of one type' },
          { value: 'delete', label: 'Delete' },
          { value: 'export', label: 'Export to CSV' },
        ]}
      />
    </div>
  ),
  parameters: { controls: { disable: true } },
};
