import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { NavTier3, NavTier3Icon, NavTier3Label, NavTier3Labels, type NavTier3Props } from './NavTier3';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Toggle } from '../Toggle/Toggle';
import { Dropdown } from '../Dropdown/Dropdown';
import { Chip } from '../Chip/Chip';
import { JumpLinks } from '../JumpLinks/JumpLinks';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates } from '../../storybook/StateGrid';

const noop = () => {};

/**
 * Expanded actions (Figma): Toggle Button ("Active"), a small Drop Down ("Actions"), Save and record arrows. Collapsed and
 * Sticky use the tiny versions (tinyActions below).
 */
const actions = (
  <>
    <Toggle contained label="Active" defaultChecked />
    <Dropdown
      variant="button" size="medium"
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
    <IconButton size="small" icon="chevron-left" label="Previous record" />
    <IconButton size="small" icon="chevron-right" label="Next record" />
  </>
);

/**
 * Figma's Collapsed and Sticky use the tiny controls (32px): Toggle Button Tiny, Drop Down Button › Tiny, Button Tiny
 * Brand and Button Icon Tiny. The page passes them; NavTier3 shows whatever `actions` it gets.
 */
const tinyActions = (
  <>
    <Toggle contained size="tiny" label="Active" defaultChecked />
    <Dropdown
      variant="button" size="small"
      label="Actions"
      hideLabel
      placeholder="Actions"
      options={[
        { value: 'duplicate', label: 'Duplicate' },
        { value: 'archive', label: 'Archive' },
      ]}
    />
    <Button size="tiny" variant="brand">
      Save
    </Button>
    <IconButton size="tiny" icon="chevron-left" label="Previous record" />
    <IconButton size="tiny" icon="chevron-right" label="Next record" />
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

/** Figma Tier 3's Jump Links: seven links, the first one current. */
const jumpItems = ['Identification / Images', 'Tracking / Compliance', 'Specifications', 'Units & Packaging', 'Warranty', 'Replacement', 'Notes'].map(
  (label, i) => ({ id: `section-${i + 1}`, label }),
);
const jumpLinks = <JumpLinks items={jumpItems} aria-label="Page sections" />;

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
  title: 'Components/Navigation/NavTier3',
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

/**
 * Interactive: the double chevron collapses and expands the header; the switches show Figma's Jump Links row and the
 * Sticky bar (in the app, the bar a page shows once the full header has scrolled away).
 */
export const Playground: Story = {
  args: { sticky: false },
  argTypes: { sticky: { control: 'boolean' }, jumpLinks: { control: false } },
  render: function Render(args) {
    const [collapsed, setCollapsed] = useState(false);
    const [value, setValue] = useState<string | undefined>();
    const [withLinks, setWithLinks] = useState(true);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
        <Toggle label="Jump Links" checked={withLinks} onChange={e => setWithLinks(e.target.checked)} />
        <NavTier3
          {...args}
          actions={collapsed || args.sticky ? tinyActions : args.actions}
          jumpLinks={withLinks ? jumpLinks : undefined}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};

/**
 * Figma's three states, each with Jump Links on: Expanded and Collapsed show the links under the rest of the card;
 * Sticky is a thin bar with the links and the actions. Without `jumpLinks` there is no links row (Figma's default).
 */
export const Tier3: Story = {
  name: 'Tier 3',
  render: args => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
      <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <Caption>State=Expanded</Caption>
        <NavTier3 {...args} jumpLinks={jumpLinks} />
      </figure>
      <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <Caption>State=Collapsed</Caption>
        <NavTier3
          {...args}
          actions={tinyActions}
          items={items.map(i => (i.id === 'contacts' ? { ...i, label: 'Contact' } : i))}
          jumpLinks={jumpLinks}
          collapsed
        />
      </figure>
      <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <Caption>State=Sticky</Caption>
        <NavTier3 {...args} actions={tinyActions} jumpLinks={jumpLinks} sticky />
      </figure>
      <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <Caption>State=Expanded, Jump Links off</Caption>
        <NavTier3 {...args} />
      </figure>
    </div>
  ),
  parameters: { ...figma('2644:3738', 'Tier 3 › Tier 3'), controls: { disable: true } },
};

/**
 * Not in Figma: in Collapsed everything stays inside the card. As the card narrows, the title steps down from
 * Heading 2 to Heading 3 and Heading 4 (the section buttons are always the 32px Sub Menu Tiny, as in Figma); then the
 * Heading 4 title is cut with an ellipsis down to 48px, and the sections that don't fit move into
 * "More ▾" (the current one stays in the row; 1000 and 800px frames). Then the title text hides behind the icon
 * (tooltip on hover), then one "Stock ▾" section picker replaces the row (720px), and on the narrowest cards the
 * actions move to a second line (650px). Resize the browser to see the steps change live.
 */
export const CollapsedNarrow: Story = {
  name: 'Collapsed › Many sections',
  render: args => {
    const [value, setValue] = useState('stock');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
        {[1700, 1400, 1000, 800, 720, 650].map(width => (
          <figure key={width} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            <Caption>{`${width}px`}</Caption>
            <div style={{ width, maxWidth: '100%' }}>
              <NavTier3 {...args} actions={tinyActions} collapsed value={value} onChange={setValue} />
            </div>
          </figure>
        ))}
      </div>
    );
  },
  parameters: { controls: { disable: true } },
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
