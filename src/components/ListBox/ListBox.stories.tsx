import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListBox, ListBoxItem, ListBoxCategory, type ListBoxItemProps, type ListBoxOption } from './ListBox';
import { TreeList, type TreeNode } from './TreeList';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates, type StateName } from '../../storybook/StateGrid';

const OPTIONS: ListBoxOption[] = [
  { value: 'al', label: 'Alabama', initials: 'AL' },
  { value: 'ak', label: 'Alaska', initials: 'AK' },
  { value: 'az', label: 'Arizona', initials: 'AZ' },
  { value: 'ar', label: 'Arkansas', initials: 'AR' },
  { value: 'ca', label: 'California', initials: 'CA', disabled: true },
  { value: 'co', label: 'Colorado', initials: 'CO' },
];

const meta = {
  title: 'Primitives/ListBox',
  component: ListBox,
  args: { options: OPTIONS, type: 'default', appearance: 'list', multiple: false, 'aria-label': 'States' },
  argTypes: {
    type: { control: 'inline-radio', options: ['default', 'chevron', 'avatar', 'checkbox'] },
    appearance: { control: 'inline-radio', options: ['list', 'selector'] },
  },
  decorators: [Story => <div style={{ width: 200 }}><Story /></div>],
} satisfies Meta<typeof ListBox>;

export default meta;
type Story = StoryObj<typeof meta>;

const STATES: StateName[] = ['Default', 'Hover', 'Press', 'Focus', 'Disabled', 'Error'];

/** One List Item set: the item in every Figma `State`, each inside its own one-option listbox. */
const itemSet = (nodeId: string, figmaName: string, props: Omit<ListBoxItemProps, 'label'>, states = STATES): Story => ({
  render: () => (
    <StateGrid
      direction="column"
      states={states}
      render={state => (
        <ul role="listbox" aria-label={`${figmaName} ${state}`} style={{ width: 200, margin: 0, padding: 0, listStyle: 'none' }}>
          <ListBoxItem
            label="Label"
            initials="AB"
            tabIndex={0}
            {...props}
            disabled={state === 'Disabled'}
            error={state === 'Error'}
          />
        </ul>
      )}
    />
  ),
  parameters: { ...figma(nodeId, figmaName), ...pseudoStates, controls: { disable: true } },
});

/** Live controls. Arrow keys move, Enter/Space choose, letters jump. */
export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<string | string[]>(args.multiple ? [] : 'az');
    return <ListBox {...args} value={value} onChange={setValue} />;
  },
};

export const ListItemIcon = itemSet('432:998', 'ListBox › List Item / Icon', { type: 'chevron' });
export const ListItemAvatar = itemSet('432:1109', 'ListBox › List Item / Avatar', { type: 'avatar' });
export const ListItemTree = itemSet('500:2049', 'ListBox › List Item / Tree', { type: 'tree', expanded: true });
export const ListItemCheckbox = itemSet('432:1053', 'ListBox › List Item / Checkbox', { type: 'checkbox', selected: true });
export const ListItemDefault = itemSet('433:1149', 'ListBox › List Item / Default', { type: 'default' });

export const ListItemCategory: Story = {
  render: () => <ListBoxCategory>Category</ListBoxCategory>,
  parameters: { ...figma('433:1484', 'ListBox › List Item / Category'), controls: { disable: true } },
};

const SIX = OPTIONS.map(o => ({ ...o, disabled: false }));
const GROUPED: ListBoxOption[] = [
  ...SIX.slice(0, 2),
  ...SIX.slice(2).map(o => ({ ...o, group: 'Category' })),
];

/** Figma `Type`: Default, Category, Checkbox, Avatar, Chevron. */
export const ListViews: Story = {
  render: function Render() {
    const [single, setSingle] = useState<string | string[]>('');
    const [multi, setMulti] = useState<string | string[]>(['al', 'ak', 'az', 'ar', 'ca', 'co']);
    const cell = (title: string, el: ReactNode) => (
      <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', width: 200 }}>
        <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>{title}</figcaption>
        {el}
      </figure>
    );
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-24)', alignItems: 'flex-start' }}>
        {cell('Type=Default', <ListBox aria-label="Default" options={SIX} value={single} onChange={setSingle} />)}
        {cell('Type=Category', <ListBox aria-label="Category" options={GROUPED} value={single} onChange={setSingle} />)}
        {cell('Type=Checkbox', <ListBox aria-label="Checkbox" type="checkbox" multiple options={SIX} value={multi} onChange={setMulti} />)}
        {cell('Type=Avatar', <ListBox aria-label="Avatar" type="avatar" options={SIX} value={single} onChange={setSingle} />)}
        {cell('Type=Chevron', <ListBox aria-label="Chevron" type="chevron" options={SIX} value={single} onChange={setSingle} />)}
      </div>
    );
  },
  decorators: [Story => <Story />],
  parameters: { ...figma('433:1231', 'ListBox › ListViews*'), controls: { disable: true } },
};

const TREE: TreeNode[] = [
  { id: 'west', label: 'West', children: [{ id: 'az', label: 'Arizona' }, { id: 'ca', label: 'California' }] },
  {
    id: 'south',
    label: 'South',
    children: [
      { id: 'al', label: 'Alabama' },
      { id: 'ar', label: 'Arkansas', type: 'avatar', initials: 'AR' },
      { id: 'tx', label: 'Texas', type: 'checkbox' },
    ],
  },
];

/** Figma shows one collapsed and one expanded Tree row, then Default, Avatar and Checkbox rows. ←/→ collapse and expand. */
export const TreeListSet: Story = {
  name: 'Tree List',
  render: function Render() {
    const [value, setValue] = useState<string | null>('tx');
    return <TreeList aria-label="Regions" nodes={TREE} defaultExpanded={['south']} value={value} onChange={id => setValue(id)} />;
  },
  parameters: { ...figma('501:2238', 'ListBox › Tree List*'), controls: { disable: true } },
};
