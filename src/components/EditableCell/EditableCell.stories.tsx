import type { Meta, StoryObj } from '@storybook/react-vite';
import { EditableCell } from './EditableCell';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates, type StateName } from '../../storybook/StateGrid';

const meta = {
  title: 'Primitives/EditableCell',
  component: EditableCell,
  args: { label: 'Quantity', defaultValue: '0' },
  decorators: [Story => <div style={{ width: 120 }}><Story /></div>],
} satisfies Meta<typeof EditableCell>;

export default meta;
type Story = StoryObj<typeof meta>;

const STATES: StateName[] = ['Default', 'Hover', 'Error'];
const OPTIONS = ['0', '1', '2', '3'];

export const Playground: Story = {};

/** Every Figma variant: Type (Input, Select, Read Only) × State (Default, Hover, Error). */
export const EditableCellSet: Story = {
  name: 'Editable Cell',
  decorators: [Story => <Story />],
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
      {(['input', 'select'] as const).map(type => (
        <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <p className="text-small-semi-bold" style={{ margin: 0, color: 'var(--color-gray-text-weak)' }}>
            Type={type === 'input' ? 'Input' : 'Select'}
          </p>
          <StateGrid
            states={STATES}
            render={state => (
              <div style={{ width: 120 }}>
                {type === 'input' ? (
                  <EditableCell label="Quantity" defaultValue="0" error={state === 'Error'} />
                ) : (
                  <EditableCell type="select" label="Quantity" options={OPTIONS} defaultValue="0" error={state === 'Error'} />
                )}
              </div>
            )}
          />
        </div>
      ))}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <p className="text-small-semi-bold" style={{ margin: 0, color: 'var(--color-gray-text-weak)' }}>
          Type=Read Only
        </p>
        <StateGrid
          states={['Default']}
          render={() => (
            <div style={{ width: 120 }}>
              <EditableCell type="read-only" label="Quantity" value="0" />
            </div>
          )}
        />
      </div>
    </div>
  ),
  parameters: { ...figma('2903:32', 'Editable Cell › Editable Cell'), ...pseudoStates, controls: { disable: true } },
};

/** Cells inside a table row, one per column. */
export const InTable: Story = {
  decorators: [Story => <Story />],
  render: () => (
    <table style={{ borderSpacing: 'var(--space-8)' }}>
      <thead>
        <tr className="text-small-semi-bold" style={{ color: 'var(--color-gray-text-weak)', textAlign: 'left' }}>
          <th>Item</th>
          <th>Qty</th>
          <th>Unit</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={{ width: 160 }}>
            <EditableCell type="read-only" label="Item" value="Solar panel" />
          </td>
          <td style={{ width: 120 }}>
            <EditableCell label="Qty" inputType="number" defaultValue="12" />
          </td>
          <td style={{ width: 120 }}>
            <EditableCell type="select" label="Unit" options={['ea', 'box', 'pallet']} defaultValue="ea" />
          </td>
        </tr>
      </tbody>
    </table>
  ),
  parameters: { controls: { disable: true } },
};
