import type { Meta, StoryObj } from '@storybook/react-vite';
import { Timeline, TimelineConnector, TimelineStep, type TimelineStepPosition, type TimelineStepState } from './Timeline';
import { figma } from '../../storybook/figma';

const meta = {
  title: 'Web Components/Timeline',
  component: Timeline,
  args: { steps: ['Step', 'Step', 'Step', 'Step'], current: 2, label: 'Order progress' },
  argTypes: { current: { control: { type: 'range', min: 0, max: 4 } } },
  decorators: [Story => <div style={{ width: 464 }}><Story /></div>],
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const TimeLine: Story = {
  parameters: { ...figma('440:1994', 'Timeline › TimeLine'), controls: { disable: true } },
};

const STATES: TimelineStepState[] = ['done', 'current', 'upcoming'];
const POSITIONS: TimelineStepPosition[] = ['start', 'middle', 'end'];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** State × Property. Each cell is a one-step list, 64px wide so the connector halves show. */
export const StatusStep: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, max-content)', gap: 'var(--space-24) var(--space-48)' }}>
      {STATES.flatMap(state =>
        POSITIONS.map(position => (
          <figure key={`${state}-${position}`} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
              {`State=${cap(state)}, Property=${cap(position)}`}
            </figcaption>
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', width: 64 }}>
              <TimelineStep label="Step" state={state} position={position} />
            </ol>
          </figure>
        )),
      )}
    </div>
  ),
  parameters: { ...figma('2899:7484', 'Timeline › Status Step'), controls: { disable: true } },
};

export const StatusConnector: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-24)' }}>
      {(['done', 'upcoming'] as const).map(state => (
        <figure key={state} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
            {`State=${cap(state)}`}
          </figcaption>
          <TimelineConnector state={state} />
        </figure>
      ))}
    </div>
  ),
  parameters: { ...figma('2900:5', 'Timeline › Status Connector'), controls: { disable: true } },
};
