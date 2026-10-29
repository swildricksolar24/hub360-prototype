import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PageTracker } from './PageTracker';
import { figma } from '../../storybook/figma';

const meta = {
  title: 'Custom/PageTracker',
  component: PageTracker,
  args: { page: 2, pageCount: 13, pageSize: 10 },
  argTypes: {
    page: { control: { type: 'number', min: 1 } },
    pageCount: { control: { type: 'number', min: 1 } },
  },
} satisfies Meta<typeof PageTracker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Live controls, plus working page and rows-per-page state. */
export const Playground: Story = {
  render: function Render(args) {
    const [page, setPage] = useState(args.page);
    const [pageSize, setPageSize] = useState(args.pageSize ?? 10);
    return (
      <PageTracker
        {...args}
        page={Math.min(page, args.pageCount)}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={size => {
          setPageSize(size);
          setPage(1);
        }}
      />
    );
  },
};

/** Figma Tracker (`State=Default`): page 2 of 13, 10 rows per page. */
export const Tracker: Story = {
  args: { page: 2, pageCount: 13, pageSize: 10 },
  parameters: { ...figma('708:1452', 'Page Tracker › Tracker'), controls: { disable: true } },
};

/** Not in Figma: first page (first / previous disabled) and last page (next / last disabled). */
export const Edges: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-32)' }}>
      <PageTracker page={1} pageCount={13} label="Pagination, first page" />
      <PageTracker page={13} pageCount={13} label="Pagination, last page" />
    </div>
  ),
  parameters: { controls: { disable: true } },
};
