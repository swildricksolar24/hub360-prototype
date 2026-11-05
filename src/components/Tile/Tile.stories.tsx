import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Tile } from './Tile';
import { iconNames } from '../Icon/Icon';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates } from '../../storybook/StateGrid';

/** Figma's tile is 256px wide; the tile fills its parent, so the stories give it that width. */
const FIGMA_WIDTH = 256;

const meta = {
  title: 'Components/Data Display/Tile',
  component: Tile,
  args: { label: 'Inventory Value', value: '$1,842,310', note: '+3.2% vs last 30 days', icon: 'dollar-sign', onClick: fn() },
  argTypes: {
    label: { control: 'text', table: { category: 'Content' } },
    value: { control: 'text', table: { category: 'Content' } },
    note: { control: 'text', table: { category: 'Content', defaultValue: { summary: 'none' } } },
    icon: { control: 'select', options: [undefined, ...iconNames], table: { category: 'Content', defaultValue: { summary: 'none' } } },
    onClick: { table: { category: 'Behavior' } },
    href: { control: 'text', table: { category: 'Behavior', defaultValue: { summary: 'none (a button)' } } },
    target: { control: 'select', options: [undefined, '_self', '_blank'], table: { category: 'Behavior' } },
    rel: { control: 'text', table: { category: 'Behavior' } },
    disabled: { control: 'boolean', table: { category: 'Behavior', defaultValue: { summary: 'false' } } },
  },
  decorators: [
    Story => (
      <div style={{ width: FIGMA_WIDTH, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tile>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Live controls. */
export const Playground: Story = {};

/** Figma Tile / KPI: `Property 1` (Default, Hover), plus keyboard focus, which Figma doesn't draw. */
export const TileKPI: Story = {
  name: 'Tile / KPI',
  decorators: [Story => <Story />],
  render: () => (
    <StateGrid
      states={['Default', 'Hover', 'Focus']}
      render={() => (
        <div style={{ width: FIGMA_WIDTH }}>
          <Tile label="Label" value="0" note="vs last 30 days" icon="dashboard" onClick={() => {}} />
        </div>
      )}
    />
  ),
  parameters: { ...figma('3168:3913', 'Tiles › Tile / KPI'), ...pseudoStates, controls: { disable: true } },
};

const KPIS = [
  { icon: 'dollar-sign', label: 'Inventory Value', value: '$1,842,310', note: '+3.2% vs last 30 days' },
  { icon: 'caution', label: 'Below Reorder Point', value: '14 items', note: '5 with no open PO' },
  { icon: 'orders', label: 'Open Orders', value: '37', note: '12 due this week' },
  { icon: 'archive', label: 'In Transit', value: '3' },
];

/**
 * Tiles in a row, as on the Inventory Dashboard. Each tile stretches to its grid cell, the note is optional, and on a
 * tile narrower than about 216px the value steps down to Heading 4.
 */
export const Row: Story = {
  decorators: [Story => <Story />],
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 'var(--space-12)', maxWidth: 1100 }}>
      {KPIS.map(k => (
        <Tile key={k.label} {...k} onClick={() => {}} />
      ))}
    </div>
  ),
  parameters: { controls: { disable: true } },
};

/** With `href` the tile is a link instead of a button. */
export const AsLink: Story = {
  args: { href: '#' },
};
