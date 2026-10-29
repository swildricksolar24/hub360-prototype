import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { NavTier3, NavTier3Icon, NavTier3Label, NavTier3Labels, type NavTier3Props } from './NavTier3';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Toggle } from '../Toggle/Toggle';
import { Dropdown } from '../Dropdown/Dropdown';
import { Chip } from '../Chip/Chip';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates } from '../../storybook/StateGrid';

const noop = () => {};

/** Figma's actions: Toggle Button ("Active"), a small Drop Down ("Actions"), Save and record arrows. */
const actions = (
  <>
    <Toggle contained label="Active" defaultChecked />
    <Dropdown
      variant="small"
      label="Actions"
      hideLabel
      placeholder="Actions"
      options={[
        { value: 'duplicate', label: 'Duplicate' },
        { value: 'archive', label: 'Archive' },
      ]}
    />
    <Button size="small" variant="brand">
      Save
    </Button>
    <IconButton size="compact" icon="chevron-left" label="Previous record" />
    <IconButton size="compact" icon="chevron-right" label="Next record" />
  </>
);

/** Figma uses a Chip "Tiny / Icon Left" here. */
const tag = (
  <Chip variant="tiny" icon="arrow-up">
    Label
  </Chip>
);

const labels = Array.from({ length: 4 }, () => ({ label: 'Label', value: 'Value' }));
const items = ['Details', 'Contacts', 'Pick / Pack', 'Printers', 'Locations', 'Items', 'Stock', 'History'].map(label => ({
  id: label.toLowerCase(),
  label,
}));

const base: NavTier3Props = {
  title: 'WAREHOUSE',
  icon: 'warehouse',
  onViewPhoto: noop,
  breadcrumb: [{ label: 'Label' }],
  homeHref: '#',
  onBack: noop,
  tag,
  labels,
  actions,
  meta: (
    <>
      Last Modified: <strong>May 18, 2026</strong>
    </>
  ),
  items,
  onCollapsedChange: noop,
};

const meta = {
  title: 'Navigation/NavTier3',
  component: NavTier3,
  args: base,
} satisfies Meta<typeof NavTier3>;

export default meta;
type Story = StoryObj<typeof meta>;

const Caption = ({ children }: { children: string }) => (
  <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
    {children}
  </figcaption>
);

/** Interactive: the double chevron collapses and expands the header. */
export const Playground: Story = {
  render: args => {
    const [collapsed, setCollapsed] = useState(false);
    const [value, setValue] = useState<string | undefined>();
    return <NavTier3 {...args} collapsed={collapsed} onCollapsedChange={setCollapsed} value={value} onChange={setValue} />;
  },
};

export const Tier3: Story = {
  name: 'Tier 3',
  render: args => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
      <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <Caption>State=Expanded</Caption>
        <NavTier3 {...args} />
      </figure>
      <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <Caption>State=Collapsed</Caption>
        <NavTier3 {...args} items={items.map(i => (i.id === 'contacts' ? { ...i, label: 'Contact' } : i))} collapsed />
      </figure>
    </div>
  ),
  parameters: { ...figma('2644:3738', 'Tier 3 › Tier 3'), controls: { disable: true } },
};

export const Labels: Story = {
  name: 'Tier 3 Labels',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
      {[1, 2, 3, 4].map(n => (
        <figure key={n} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <Caption>{`Labels=${n}`}</Caption>
          <NavTier3Labels items={labels.slice(0, n)} />
        </figure>
      ))}
    </div>
  ),
  parameters: { ...figma('2642:3610', 'Tier 3 › Tier 3 Labels'), controls: { disable: true } },
};

export const Label: Story = {
  name: 'Tier 3 Label',
  render: () => <NavTier3Label label="Label" value="Value" />,
  parameters: { ...figma('2642:3631', 'Tier 3 › Tier 3 Label'), controls: { disable: true } },
};

export const RecordIcon: Story = {
  name: 'Tier 3 Icon',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
      {(['large', 'small'] as const).map(size => (
        <figure key={size} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <Caption>{`Size=${size === 'large' ? 'Large' : 'Small'}`}</Caption>
          <StateGrid states={['Default', 'Hover']} render={() => <NavTier3Icon icon="warehouse" size={size} onViewPhoto={noop} />} />
        </figure>
      ))}
    </div>
  ),
  parameters: { ...figma('2648:4086', 'Tier 3 › Tier 3 Icon'), ...pseudoStates, controls: { disable: true } },
};
