import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CardLarge, CardRow } from './Cards';
import { Avatar } from '../Avatar/Avatar';
import { Button } from '../Button/Button';
import { Dropdown } from '../Dropdown/Dropdown';
import { TextInput } from '../TextInput/TextInput';
import { figma } from '../../storybook/figma';

/** Figma's cards are 798px wide. */
const FIGMA_WIDTH = 798;

const meta = {
  title: 'Components/Data Display/Cards',
  component: CardRow,
  args: { title: 'Jordan Davis', subtitle: 'Senior Product Designer · Design', highlighted: false },
  argTypes: {
    media: { control: false },
    action: { control: false },
  },
  decorators: [
    Story => (
      <div style={{ width: FIGMA_WIDTH, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CardRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const photo = <Avatar type="photo" label="Jordan Davis" />;
const changePhoto = <Button variant="primary" size="small">Change Photo</Button>;

/** Live controls for Card / Row / Small. */
export const Playground: Story = {
  render: args => <CardRow {...args} media={photo} action={changePhoto} />,
};

/** Figma Card / Row / Small: `Property 1` Default and Variant2 (the teal `highlighted` card). */
export const CardRowSmall: Story = {
  name: 'Card / Row / Small',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
      {[false, true].map(highlighted => (
        <figure key={String(highlighted)} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
            Property 1={highlighted ? 'Variant2' : 'Default'}
          </figcaption>
          <CardRow media={photo} title="Jordan Davis" subtitle="Senior Product Designer · Design" action={changePhoto} highlighted={highlighted} />
        </figure>
      ))}
    </div>
  ),
  parameters: { ...figma('3085:7384', 'Cards › Card / Row / Small'), controls: { disable: true } },
};

const STATES = [
  { value: 'AZ', label: 'Arizona' },
  { value: 'CA', label: 'California' },
  { value: 'NV', label: 'Nevada' },
];

/** A row of two fields, 12px apart, as Figma lays out City · State and the emergency contact. */
const Pair = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--space-12)' }}>{children}</div>
);

/** Figma Card / Large: a titled card holding the profile form. Locked fields are read-only with the lock icon. */
export const CardLargeStory: Story = {
  name: 'Card / Large',
  render: () => (
    <CardLarge title="Personal Information">
      <TextInput label="Full Name" defaultValue="Jordan Davis" />
      <TextInput label="Preferred Name" defaultValue="Jordan" />
      <TextInput label="Job Title" defaultValue="Senior Product Designer" rightIcons={['lock']} readOnly />
      <TextInput label="Department" defaultValue="Design" rightIcons={['lock']} readOnly />
      <TextInput label="Work Email" defaultValue="jordan.davis@acme.com" rightIcons={['lock']} readOnly />
      <TextInput label="Work Phone" defaultValue="123-456-7891" />
      <Pair>
        <TextInput label="City" defaultValue="Phoenix" />
        <Dropdown label="State" options={STATES} defaultValue="AZ" />
      </Pair>
      <TextInput label="Employee ID" defaultValue="ACM-004822" rightIcons={['lock']} readOnly />
      <TextInput label="Manager" defaultValue="Harvey Dent" rightIcons={['lock']} readOnly />
      <Pair>
        <TextInput label="Emergency Contact" defaultValue="Tim Drake" />
        <TextInput label="Emergency Contact Phone Number" defaultValue="(123)456-7891" />
      </Pair>
    </CardLarge>
  ),
  parameters: { ...figma('3085:7392', 'Cards › Card / Large'), controls: { disable: true } },
};
