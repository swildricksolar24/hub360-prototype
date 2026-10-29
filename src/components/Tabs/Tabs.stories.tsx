import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tab, TabPanel, Tabs, type TabsSize } from './Tabs';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates, type StateName } from '../../storybook/StateGrid';

const LOREM =
  'Lorem ipsum dolor sit amet consectetur. Vulputate eu morbi enim a sagittis ac at in velit. Venenatis rutrum sem neque blandit arcu vel interdum. Dolor urna semper id amet maecenas tellus et dignissim id. Arcu erat diam blandit a suspendisse mi.';

const items = ['Label', 'Label', 'Label', 'Label', 'Label'].map((label, i) => ({
  id: `tab-${i + 1}`,
  label,
  content: i === 1 ? LOREM : `Panel ${i + 1}. ${LOREM}`,
}));

const meta = {
  title: 'Navigation/Tabs',
  component: Tabs,
  args: { items, defaultValue: 'tab-2', size: 'small', 'aria-label': 'Example tabs' },
  argTypes: { size: { control: 'inline-radio', options: ['small', 'tiny'] } },
  decorators: [Story => <div style={{ width: 560 }}>{Story()}</div>],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma `State=Current Tab` is shown as `Selected`. */
const STATES: StateName[] = ['Default', 'Selected', 'Disabled', 'Focus', 'Hover'];

const tabSet = (nodeId: string, figmaName: string, size: TabsSize): Story => ({
  render: () => (
    <StateGrid
      states={STATES}
      render={state => (
        <div role="tablist" aria-label={`State ${state}`}>
          <Tab size={size} selected={state === 'Selected'} disabled={state === 'Disabled'}>
            Label
          </Tab>
        </div>
      )}
    />
  ),
  parameters: { ...figma(nodeId, figmaName), ...pseudoStates, controls: { disable: true } },
});

export const Playground: Story = {};

export const TabSmall = tabSet('494:266', 'Tab Bar* › Tab / Small', 'small');
export const TabTiny = tabSet('742:4310', 'Tab Bar* › Tab / Tiny*', 'tiny');

export const TabContent: Story = {
  render: () => (
    <div style={{ width: 440 }}>
      <TabPanel>{LOREM}</TabPanel>
    </div>
  ),
  parameters: { ...figma('494:454', 'Tab Bar* › Tab Content'), controls: { disable: true } },
};

export const TabBar: Story = {
  parameters: { ...figma('494:338', 'Tab Bar* › Tab Bar*'), controls: { disable: true } },
};

/** Not in Figma: a disabled tab is skipped by the arrow keys. */
export const WithDisabledTab: Story = {
  args: { size: 'tiny', items: items.map((t, i) => (i === 3 ? { ...t, disabled: true } : t)) },
};
