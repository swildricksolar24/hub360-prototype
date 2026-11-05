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
    variant: { control: 'inline-radio', options: ['field', 'button', 'small', 'icon'] },
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

const LABEL_STATES = ['Default', 'Default - Light', 'Hover', 'Press', 'Focus', 'Error', 'Disabled', 'Required', 'Default - No Label'] as const;

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
          hideLabel={state === 'Default - No Label'}
        />
      )}
    />
  ),
  parameters: { ...figma('481:856', 'Drop Down Label › Default'), ...pseudoStates, controls: { disable: true } },
};

export const LabelChips: Story = {
  render: () => (
    <div style={{ width: 360 }}>
      <DropdownChips items={Array.from({ length: 6 }, (_, i) => ({ value: String(i), label: 'Label' }))} />
    </div>
  ),
  parameters: { ...figma('2676:6014', 'Drop Down Label › chips'), controls: { disable: true } },
};

const BUTTON_STATES = ['Default', 'Hover', 'Press', 'Focus', 'Disabled', 'Error'] as const;

const buttonSet = (nodeId: string, figmaName: string, props: Partial<DropdownProps>): Story => ({
  render: args => (
    <DropdownStateGrid
      states={BUTTON_STATES}
      render={state => (
        <Dropdown {...args} label={undefined} aria-label="Select" {...props} error={state === 'Error'} disabled={state === 'Disabled'} />
      )}
    />
  ),
  parameters: { ...figma(nodeId, figmaName), ...pseudoStates, controls: { disable: true } },
});

export const ButtonIcon = buttonSet('56:1083', 'Drop Down Button › Icon*', { variant: 'icon', icon: 'account', 'aria-label': 'Account' });
export const ButtonIconAndLabel = buttonSet('56:1075', 'Drop Down Button › Icon and Label', { variant: 'button', icon: 'account' });
export const ButtonDefault = buttonSet('56:936', 'Drop Down Button › Default', { variant: 'button' });
export const ButtonSmall = buttonSet('478:1190', 'Drop Down Button › Small', { variant: 'small' });

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
          <Dropdown {...args} label={undefined} aria-label="Small" variant="small" listType="chevron" defaultOpen value={single} onChange={setSingle} />
        </div>
      </div>
    );
  },
  parameters: { controls: { disable: true } },
};
