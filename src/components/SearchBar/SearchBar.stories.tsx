import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchBar, SearchInput, SearchResultRow, type SearchResult } from './SearchBar';
import { DropdownStateGrid } from '../Dropdown/storyGrid';
import { figma } from '../../storybook/figma';
import { pseudoStates } from '../../storybook/StateGrid';

const PEOPLE: SearchResult[] = [
  { id: '1', name: 'Ana Ortiz', description: 'Solar Topps', detail: { label: 'Title', value: 'Project Manager' } },
  { id: '2', name: 'Ben Carter', description: 'Solar Topps', detail: { label: 'Title', value: 'Installer' } },
  { id: '3', name: 'Chloe Nguyen', description: 'Texala', initials: 'CN', tag: 'Primary Role' },
  { id: '4', name: 'Dev Patel', description: 'Texala', initials: 'DP', tag: 'Sales' },
];

const meta = {
  title: 'Web Components/SearchBar',
  component: SearchBar,
  args: { placeholder: 'Search', disabled: false },
  decorators: [Story => <div style={{ maxWidth: 744, minHeight: 460 }}><Story /></div>],
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Type to filter; ↓/↑ highlight, Enter chooses, Escape closes. */
export const Playground: Story = {
  render: function Render(args) {
    const [query, setQuery] = useState('');
    const [picked, setPicked] = useState<string>();
    const results = query ? PEOPLE.filter(p => p.name.toLowerCase().includes(query.toLowerCase())) : [];
    return (
      <>
        <SearchBar {...args} value={query} onChange={setQuery} results={results} onSelect={r => setPicked(r.name)} />
        <p className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)', marginTop: 'var(--space-16)' }}>
          Chosen: {picked ?? '—'}
        </p>
      </>
    );
  },
};

const INPUT_STATES = ['Default', 'Hover', 'Focus', 'Disabled', 'Active'] as const;

export const SearchInputSet: Story = {
  name: 'Search Input',
  render: () => (
    <DropdownStateGrid
      direction="column"
      cellWidth={744}
      states={INPUT_STATES}
      render={state =>
        state === 'Active' ? (
          <div style={{ minHeight: 230 }}>
            <SearchBar defaultValue="a" defaultOpen results={PEOPLE.slice(0, 2)} />
          </div>
        ) : (
          <SearchInput aria-label="Search" disabled={state === 'Disabled'} />
        )
      }
    />
  ),
  parameters: { ...figma('605:10332', 'Search Bar › Search Input'), ...pseudoStates, controls: { disable: true } },
};

const ROW_STATES = ['Type=Default, State=Default', 'Type=Default, State=Hover', 'Type=With Icon, State=Default', 'Type=With Icon, State=Hover'] as const;

export const SearchedListType: Story = {
  render: () => (
    <DropdownStateGrid
      direction="column"
      cellWidth={628}
      caption={s => s}
      states={ROW_STATES}
      render={state => (
        <ul role="listbox" aria-label={state} style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          <SearchResultRow
            result={
              state.includes('Icon')
                ? { id: 'x', name: 'Name', description: 'Company', initials: 'AB', tag: 'Primary Role' }
                : { id: 'x', name: 'Name', description: 'Company', detail: { label: 'Title', value: 'Placeholder' } }
            }
            active={state.endsWith('State=Hover')}
          />
        </ul>
      )}
    />
  ),
  parameters: { ...figma('2539:4739', 'Search Bar › Searched List Type'), controls: { disable: true } },
};
