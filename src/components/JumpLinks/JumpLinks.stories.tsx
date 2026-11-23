import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { JumpLinks } from './JumpLinks';
import { NavTier3 } from '../NavTier3/NavTier3';
import { Toggle } from '../Toggle/Toggle';
import { Dropdown } from '../Dropdown/Dropdown';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Chip } from '../Chip/Chip';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates } from '../../storybook/StateGrid';

/** The Item Details sections (Figma 1144:8625). */
const items = [
  { id: 'identification', label: 'Identification / Images' },
  { id: 'tracking', label: 'Tracking / Compliance' },
  { id: 'specifications', label: 'Specifications' },
  { id: 'units', label: 'Units & Packaging' },
  { id: 'warranty', label: 'Warranty' },
  { id: 'replacements', label: 'Replacement' },
  { id: 'notes', label: 'Notes' },
];

const meta = {
  title: 'Components/Navigation/JumpLinks',
  component: JumpLinks,
  args: { items, 'aria-label': 'Details sections' },
} satisfies Meta<typeof JumpLinks>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Click a link: the underline slides to it. In the app the page then scrolls to that card. */
export const Playground: Story = {
  parameters: figma('3584:2032', 'Jump Links'),
};

/**
 * As on Item Details: the jump links inside a NavTier3 (`jumpLinks`, Figma Tier 3 with Jump Links on), at the bottom
 * of the card under the sub menu. Once the page scrolls the full header away, NavTier3 `sticky` keeps the links and
 * the actions in a thin bar (see NavTier3 › Tier 3).
 */
export const UnderTier3: Story = {
  name: 'In Tier 3',
  render: args => {
    const [tab, setTab] = useState('details');
    const [section, setSection] = useState(items[0].id);
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <NavTier3
          jumpLinks={<JumpLinks {...args} value={section} onChange={setSection} />}
          title="REC 325 SOLAR PANEL"
          icon="part"
          breadcrumb={[{ label: 'Inventory' }, { label: 'Items' }, { label: 'REC 325 Solar Panel' }]}
          homeHref="#"
          onBack={() => {}}
          onViewPhoto={() => {}}
          onCollapsedChange={() => {}}
          tag={<Chip variant="tiny">Part</Chip>}
          labels={[
            { label: 'PART #', value: 'PA-0002-AJ89-98HB' },
            { label: 'CATEGORY', value: 'Solar Panels' },
            { label: 'SUBCATEGORY', value: 'Monocrystalline' },
          ]}
          actions={
            <>
              <Toggle contained label="Active" defaultChecked />
              <Dropdown variant="button" size="medium" label="Actions" hideLabel placeholder="Actions" options={[{ value: 'delete', label: 'Delete' }]} />
              <Button size="small" variant="brand">
                Edit
              </Button>
              <IconButton size="small" icon="chevron-left" label="Previous record" />
              <IconButton size="small" icon="chevron-right" label="Next record" />
            </>
          }
          meta="Last Modified: Apr 2, 2026"
          items={['Details', 'Suppliers', 'Cost', 'Where Used', 'Stock', 'Files', 'History'].map(label => ({ id: label.toLowerCase(), label }))}
          value={tab}
          onChange={setTab}
        />
      </div>
    );
  },
  parameters: { ...figma('2644:3738', 'Tier 3 (Jump Links on)'), controls: { disable: true } },
};

/**
 * Link states: Default (Medium/Semi-Bold, Gray Text/Weak), Hover (Gray Text/Strong) and Focus (a 2px Brand Teal ring);
 * the current link (the first here) is Medium/Bold, Gray Text/Strong, with the Brand Teal underline.
 */
export const States: Story = {
  render: () => (
    <StateGrid
      states={['Default', 'Hover', 'Focus']}
      direction="column"
      render={state => <JumpLinks items={items.slice(0, 4)} aria-label={`Jump links, ${state}`} />}
    />
  ),
  parameters: { ...figma('3582:11', 'Jump Link'), ...pseudoStates, controls: { disable: true } },
};

/**
 * Not in Figma: the row stays on one line. When the links don't all fit, the ones that don't move into "More ▾" at the
 * end, a menu of the rest. The picked link always stays in the row (pick "Notes" in the narrowest frame: it takes the
 * last place before More). Resize the browser to see links move in and out of More live.
 */
export const More: Story = {
  name: 'More (narrow)',
  render: args => {
    const [section, setSection] = useState(items[0].id);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
        {[1100, 800, 560, 360].map(width => (
          <figure key={width} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>{`${width}px`}</figcaption>
            <div style={{ width, maxWidth: '100%' }}>
              <JumpLinks {...args} value={section} onChange={setSection} />
            </div>
          </figure>
        ))}
      </div>
    );
  },
  parameters: { controls: { disable: true } },
};

/**
 * `as="tabs"`: the same look as a tab list that switches a view, here Stock's By Warehouse | By Item (Figma "→ Items"
 * Stock, 681:14475). Tab buttons with `aria-selected` and `aria-controls` (`panelId`); ← / → / Home / End move between
 * them and pick. No card-bottom padding or fill, so the row sits inside its card's padding.
 */
export const Tabs: Story = {
  render: function Render() {
    const [view, setView] = useState('warehouse');
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-16)',
          padding: 'var(--space-24)',
          borderRadius: 'var(--radius-12)',
          background: 'var(--color-surfaces-overlay)',
          maxWidth: 720,
        }}
      >
        <JumpLinks
          as="tabs"
          aria-label="Stock view"
          panelId="stock-panel"
          items={[
            { id: 'warehouse', label: 'By Warehouse' },
            { id: 'item', label: 'By Item' },
          ]}
          value={view}
          onChange={setView}
        />
        <div id="stock-panel" role="tabpanel" className="text-medium-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
          {view === 'warehouse' ? 'One row per item per warehouse.' : 'One row per item, added up across warehouses.'}
        </div>
      </div>
    );
  },
  parameters: { ...figma('681:14475', 'Inventory › Items › Stock (By Warehouse | By Item)', 'inventory'), controls: { disable: true } },
};
