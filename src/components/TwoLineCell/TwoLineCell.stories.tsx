import type { Meta, StoryObj } from '@storybook/react-vite';
import { TwoLineCell } from './TwoLineCell';
import { Hyperlink } from '../Hyperlink/Hyperlink';
import { DataTable } from '../DataTable/DataTable';
import { figma } from '../../storybook/figma';

/** Figma "Two Line Cell" (- Data Table (New) page), from the Inventory file's Items Overview Item column. */
const source = (story: string) => {
  const p = figma('3520:431', 'Two Line Cell');
  return { ...p, docs: { description: { story: `${story} ${p.docs.description.story}` } } };
};

const meta = {
  title: 'Components/Data Display/TwoLineCell',
  component: TwoLineCell,
  args: { title: 'PA-1001', description: 'REC Alpha Pure-R 410W' },
  argTypes: { title: { control: 'text' }, description: { control: 'text' } },
} satisfies Meta<typeof TwoLineCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: source('A title with a description under it, 2px apart.'),
};

/** The title as a link (Hyperlink small), as in the Items list: it keeps the link look, with the lines still 2px apart. */
export const LinkTitle: Story = {
  render: () => (
    <TwoLineCell
      title={
        <Hyperlink size="small" href="#">
          PA-1001
        </Hyperlink>
      }
      description="REC Alpha Pure-R 410W"
    />
  ),
  parameters: { ...source('Link title.'), controls: { disable: true } },
};

const ITEMS = [
  { id: 'PA-1001', name: 'REC Alpha Pure-R 410W', type: 'Part' },
  { id: 'AS-2040', name: 'Rooftop racking assembly, 12-panel, flush mount with rail splices and end clamps', type: 'Assembly' },
  { id: 'KT-3007', name: 'Starter kit', type: 'Kit' },
];

/** In a DataTable Item column: the description ends with an ellipsis when the column is narrow (hover for the full name). */
export const InTable: Story = {
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <DataTable
        aria-label="Items"
        columns={[
          { key: 'item', label: 'Item', width: 240, minWidth: 140 },
          { key: 'type', label: 'Type', width: 120 },
        ]}
        rows={ITEMS}
        cells={item => ({
          item: (
            <TwoLineCell
              title={
                <Hyperlink size="small" href="#">
                  {item.id}
                </Hyperlink>
              }
              description={item.name}
            />
          ),
          type: item.type,
        })}
      />
    </div>
  ),
  parameters: { ...source('In a table.'), controls: { disable: true } },
};
