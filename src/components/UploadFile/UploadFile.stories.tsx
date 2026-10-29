import type { Meta, StoryObj } from '@storybook/react-vite';
import { UploadFile } from './UploadFile';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates } from '../../storybook/StateGrid';

const meta = {
  title: 'Web Components/UploadFile',
  component: UploadFile,
  args: { accept: '.jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.csv', multiple: false, onFiles: files => console.log(files.map(f => f.name)) },
} satisfies Meta<typeof UploadFile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
  render: args => <StateGrid direction="column" states={['Default', 'Hover']} render={() => <UploadFile {...args} />} />,
  parameters: { ...figma('2334:4353', 'Upload Document › Upload File'), ...pseudoStates, controls: { disable: true } },
};
