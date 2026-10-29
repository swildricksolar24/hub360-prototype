import type { Meta, StoryObj } from '@storybook/react-vite';
import { HelpArticleRow, HelpCategoryCard } from './HelpCenter';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates } from '../../storybook/StateGrid';

const ARTICLE = {
  title: 'Create a transfer order',
  meta: 'Inventory · 4 min read',
  path: 'Inventory › Orders',
  snippet: 'Move stock from one warehouse to another. The order shows In Transit until the destination warehouse receives it.',
};
const CATEGORY = { title: 'Inventory', description: 'Warehouses, items, stock and orders', count: '24 articles' };

const meta = {
  title: 'Custom/HelpCenter',
  component: HelpArticleRow,
  args: { ...ARTICLE, type: 'compact', href: '#' },
  argTypes: { type: { control: 'inline-radio', options: ['compact', 'result'] } },
} satisfies Meta<typeof HelpArticleRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Live controls for Help Article Row. */
export const Playground: Story = {
  render: args => (
    <div style={{ width: 720, maxWidth: '100%' }}>
      <HelpArticleRow {...args} />
    </div>
  ),
};

/** Figma Help Article Row: `Type` (Compact, Result) × `State` (Default, Hover). */
export const HelpArticleRows: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-32)' }}>
      {(['compact', 'result'] as const).map(type => (
        <StateGrid
          key={type}
          states={['Default', 'Hover']}
          direction="column"
          render={() => (
            <div style={{ width: 720, maxWidth: '100%' }}>
              <HelpArticleRow {...ARTICLE} type={type} href="#" />
            </div>
          )}
        />
      ))}
    </div>
  ),
  parameters: { ...figma('2903:53', 'Help Center › Help Article Row'), ...pseudoStates, controls: { disable: true } },
};

/** Figma Help Category Card: `State` (Default, Hover). */
export const HelpCategoryCards: Story = {
  render: () => <StateGrid states={['Default', 'Hover']} render={() => <HelpCategoryCard {...CATEGORY} href="#" />} />,
  parameters: { ...figma('2921:7899', 'Help Center › Help Category Card'), ...pseudoStates, controls: { disable: true } },
};
