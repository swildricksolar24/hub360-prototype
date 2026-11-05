import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { NavTier4, type NavTier4Item } from './NavTier4';
import { Button } from '../Button/Button';
import { Dropdown } from '../Dropdown/Dropdown';
import { SearchInput } from '../SearchBar/SearchBar';
import { figma } from '../../storybook/figma';

const OVERVIEW: NavTier4Item[] = ['Overview', 'Part', 'Assembly', 'Kit', 'Stock'].map(label => ({ id: label.toLowerCase(), label }));
const TABLE_VIEW: NavTier4Item[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'stock', label: 'Stock' },
];
const TABLE_VIEW_2: NavTier4Item[] = [...TABLE_VIEW, { id: 'structure', label: 'Structure' }];

/** Figma's Table View toolbar: View All, Columns, Upload, Actions, Search (fills the rest) and Add New. */
const toolbar = (
  <>
    <Dropdown
      variant="small"
      label="View"
      hideLabel
      placeholder="View All"
      options={[
        { value: 'all', label: 'View All' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ]}
    />
    <Button variant="primary" size="small" icon="edit">
      Columns
    </Button>
    <Button variant="primary" size="small" icon="upload">
      Upload
    </Button>
    <Dropdown
      variant="small"
      label="Actions"
      hideLabel
      placeholder="Actions"
      options={[
        { value: 'export', label: 'Export' },
        { value: 'archive', label: 'Archive' },
      ]}
    />
    <div style={{ flex: 1, minWidth: 200 }}>
      <SearchInput aria-label="Search" />
    </div>
    <Button variant="brand" size="small" icon="plus">
      Add New
    </Button>
  </>
);

const meta = {
  title: 'Components/Navigation/NavTier4',
  component: NavTier4,
  args: { 'aria-label': 'Warehouse views', items: TABLE_VIEW, activeId: 'overview', onSelect: fn() },
  argTypes: { toolbar: { control: false } },
} satisfies Meta<typeof NavTier4>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Click the view buttons to switch the selected one. */
export const Playground: Story = {
  render: function Render(args) {
    const [active, setActive] = useState(args.activeId);
    return (
      <NavTier4
        {...args}
        activeId={active}
        onSelect={id => {
          setActive(id);
          args.onSelect(id);
        }}
        toolbar={toolbar}
      />
    );
  },
};

const VARIANTS = [
  { name: 'Overview', items: OVERVIEW, toolbar: undefined },
  { name: 'Table View', items: TABLE_VIEW, toolbar },
  { name: 'Table View - 2', items: TABLE_VIEW_2, toolbar },
];

/** Figma Tier 4: `Property 1=Warehouse` × `Property 2` (Overview, Table View, Table View - 2). */
export const Tier4: Story = {
  name: 'Tier 4',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-32)' }}>
      {VARIANTS.map(v => (
        <figure key={v.name} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
            Property 2={v.name}
          </figcaption>
          <NavTier4 aria-label="Warehouse views" items={v.items} activeId="overview" onSelect={() => {}} toolbar={v.toolbar} />
        </figure>
      ))}
    </div>
  ),
  parameters: { ...figma('3091:12939', 'Tier 4 › Tier 4'), controls: { disable: true } },
};
