import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag, type TagProps } from './Tag';
import { figma } from '../../storybook/figma';
import { StateGrid, type StateName } from '../../storybook/StateGrid';

const meta = {
  title: 'Primitives/Tag',
  component: Tag,
  args: { children: 'Label', variant: 'base', size: 'large', selected: false },
  argTypes: {
    variant: { control: 'inline-radio', options: ['base', 'outline'] },
    size: { control: 'inline-radio', options: ['large', 'small', 'tiny'] },
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma's Tag sets have two states; tags are static read-only labels. */
const STATES: StateName[] = ['Default', 'Selected'];

/** One story per Figma component set: both `State` variants side by side. */
const figmaSet = (nodeId: string, figmaName: string, props: Omit<TagProps, 'children'>): Story => ({
  render: args => (
    <StateGrid
      states={STATES}
      render={state => (
        <Tag {...args} {...props} selected={state === 'Selected'}>
          Label
        </Tag>
      )}
    />
  ),
  parameters: { ...figma(nodeId, figmaName), controls: { disable: true } },
});

export const Playground: Story = {};

export const BaseLarge: Story = { ...figmaSet('318:4725', 'Tag › Base / Large', { variant: 'base', size: 'large' }), name: 'Base / Large' };
export const BaseSmall: Story = { ...figmaSet('339:4909', 'Tag › Base / Small', { variant: 'base', size: 'small' }), name: 'Base / Small' };
export const BaseTiny: Story = { ...figmaSet('2610:6045', 'Tag › Base / Tiny', { variant: 'base', size: 'tiny' }), name: 'Base / Tiny' };
export const OutlineLarge: Story = { ...figmaSet('339:4922', 'Tag › Outline / Large', { variant: 'outline', size: 'large' }), name: 'Outline / Large' };
export const OutlineSmall: Story = { ...figmaSet('3404:2475', 'Tag › Outline / Small', { variant: 'outline', size: 'small' }), name: 'Outline / Small' };
export const OutlineTiny: Story = { ...figmaSet('3404:2482', 'Tag › Outline / Tiny', { variant: 'outline', size: 'tiny' }), name: 'Outline / Tiny' };

/** With `onClick` a tag becomes a toggle button (e.g. a filter): it gets a pointer and a focus ring. */
export const AsFilter: Story = {
  name: 'Clickable (filter)',
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
      <Tag size="small" selected onClick={() => {}}>All</Tag>
      <Tag size="small" onClick={() => {}}>Warehouse</Tag>
      <Tag size="small" onClick={() => {}}>Address</Tag>
    </div>
  ),
};
