import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion, AccordionItem } from './Accordion';
import { iconNames } from '../Icon/Icon';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates } from '../../storybook/StateGrid';

const meta = {
  title: 'Web Components/Accordion',
  component: Accordion,
  args: { label: 'Label', icon: 'account', defaultOpen: false },
  argTypes: {
    icon: { control: 'select', options: [undefined, ...iconNames] },
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

const items = [1, 2, 3, 4].map(i => (
  <AccordionItem key={i} icon="check">
    Label
  </AccordionItem>
));

export const Playground: Story = {
  render: args => (
    <div style={{ width: 258 }}>
      <Accordion {...args}>{items}</Accordion>
    </div>
  ),
};

/** Figma "Categories": `Type=Category` (the header) and `Type=Item`, each Default and Hover. */
export const Categories: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)', width: 378 }}>
      <StateGrid
        direction="column"
        states={['Default', 'Hover']}
        render={() => (
          <div style={{ width: 378 }}>
            <Accordion label="Label" icon="account" />
          </div>
        )}
      />
      <StateGrid
        direction="column"
        states={['Default', 'Hover']}
        render={() => (
          <div style={{ width: 378, background: 'var(--color-surfaces-overlay)' }}>
            <AccordionItem icon="account">Label</AccordionItem>
          </div>
        )}
      />
    </div>
  ),
  parameters: { ...figma('476:5', 'Drop Down - Accordion › Categories'), ...pseudoStates, controls: { disable: true } },
};

/** Figma "Drop Down - Accordion": `State=Default` (closed) and `State=Open`. */
export const DropDownAccordion: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)', width: 258 }}>
      <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>State=Default</figcaption>
        <Accordion label="Label" icon="account">{items}</Accordion>
      </figure>
      <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>State=Open</figcaption>
        <Accordion label="Label" icon="account" defaultOpen>
          {items}
        </Accordion>
      </figure>
    </div>
  ),
  parameters: { ...figma('477:64', 'Drop Down - Accordion › Drop Down - Accordion*'), controls: { disable: true } },
};
