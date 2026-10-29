import type { Meta, StoryObj } from '@storybook/react-vite';
import { DropdownSelector, DropdownSelectorChip, DropdownSelectorGallery, type DropdownSelectorOption, type DropdownSelectorProps } from './DropdownSelector';
import { ListBox, ListBoxItem } from '../ListBox/ListBox';
import { SearchInput } from '../SearchBar/SearchBar';
import { DropdownStateGrid, STATE_OPTIONS } from '../Dropdown/storyGrid';
import { figma } from '../../storybook/figma';
import { pseudoStates } from '../../storybook/StateGrid';
import styles from './DropdownSelector.module.css';

const PHOTOS: DropdownSelectorOption[] = Array.from({ length: 18 }, (_, i) => ({ value: `p${i + 1}`, label: `Photo ${i + 1}` }));

const meta = {
  title: 'Web Components/DropdownSelector',
  component: DropdownSelector,
  args: { options: STATE_OPTIONS, placeholder: 'Select', display: 'list', showIcon: true },
  argTypes: { display: { control: 'inline-radio', options: ['list', 'chips', 'gallery'] } },
  decorators: [Story => <div style={{ maxWidth: 350, minHeight: 320 }}><Story /></div>],
} satisfies Meta<typeof DropdownSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Click to open; type to filter, ↓ to enter the list, Space to toggle, Escape to close. */
export const Playground: Story = {};

const AUTOCOMPLETE_STATES = ['Default', 'Hover', 'Active', 'Active Input', 'Selected', 'Disabled'] as const;
type AutoState = (typeof AUTOCOMPLETE_STATES)[number];

const autocompleteSet = (
  nodeId: string,
  figmaName: string,
  props: Partial<DropdownSelectorProps>,
  states: readonly AutoState[] = AUTOCOMPLETE_STATES,
): Story => ({
  render: args => (
    <DropdownStateGrid
      direction="column"
      cellWidth={350}
      states={states}
      render={state => {
        const open = state === 'Active' || state === 'Active Input';
        return (
          <div style={{ minHeight: open ? 330 : undefined }}>
            <DropdownSelector
              {...args}
              {...props}
              options={props.display === 'gallery' ? PHOTOS : STATE_OPTIONS}
              defaultOpen={open}
              defaultSearch={state === 'Active Input' ? 'Ar' : ''}
              defaultValue={state === 'Selected' ? (props.display === 'gallery' ? ['p2', 'p5'] : ['az', 'ar']) : []}
              disabled={state === 'Disabled'}
            />
          </div>
        );
      }}
    />
  ),
  decorators: [Story => <Story />],
  parameters: { ...figma(nodeId, figmaName), ...pseudoStates, controls: { disable: true } },
});

export const AutocompleteDropdown = autocompleteSet('451:779', 'Drop Down - Selector › Autocomplete / Dropdown', { display: 'list' });
export const AutocompleteDropdownChips = autocompleteSet('2747:6026', 'Drop Down - Selector › Autocomplete / Dropdown / Chips', { display: 'chips' });
export const AutocompleteDropdownPhotoLibrary = autocompleteSet(
  '2781:1158',
  'Drop Down - Selector › Autocomplete / Dropdown / Photo Library',
  { display: 'gallery' },
  ['Default', 'Hover', 'Active', 'Selected', 'Disabled'],
);

const ROW_STATES = ['Default', 'Hover', 'Indent', 'Indent Hover'] as const;

/** One row of the holder; `level` 1 is Figma `State=Indent`. */
export const DropdownSelectorRow: Story = {
  name: 'Dropdown Selector',
  render: () => (
    <DropdownStateGrid
      direction="column"
      cellWidth={218}
      states={ROW_STATES}
      render={state => (
        <ul role="listbox" aria-label={state} className={state.endsWith('Hover') ? 'state-hover' : undefined} style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          <ListBoxItem
            appearance="selector"
            type={state.startsWith('Indent') ? 'default' : 'checkbox'}
            level={state.startsWith('Indent') ? 1 : 0}
            label="Label"
            tabIndex={0}
          />
        </ul>
      )}
    />
  ),
  decorators: [Story => <Story />],
  parameters: {
    ...figma('455:455', 'Drop Down - Selector › Dropdown Selector'),
    ...pseudoStates,
    controls: { disable: true },
  },
};

const HOLDER_STATES = ['Default', 'Scrollbar', 'Gallery'] as const;

/** The list container on its own: four rows, a scrolling list, and the photo grid with its search field. */
export const DropdownHolder: Story = {
  render: () => (
    <DropdownStateGrid
      cellWidth={350}
      states={HOLDER_STATES}
      render={state =>
        state === 'Gallery' ? (
          <div className={styles.popup} style={{ position: 'static' }}>
            <SearchInput compact aria-label="Search photos" />
            <DropdownSelectorGallery aria-label="Photos" options={PHOTOS} value={['p3']} onToggle={() => {}} />
          </div>
        ) : (
          <div className={styles.holder}>
            <ListBox
              aria-label={state}
              appearance="selector"
              type="checkbox"
              multiple
              options={(state === 'Scrollbar' ? STATE_OPTIONS : STATE_OPTIONS.slice(0, 4)).map(o => ({ ...o, label: 'Label' }))}
              value={[]}
            />
          </div>
        )
      }
    />
  ),
  decorators: [Story => <Story />],
  parameters: { ...figma('455:472', 'Drop Down - Selector › Dropdown Holder'), controls: { disable: true } },
};

export const Chip: Story = {
  render: () => <DropdownSelectorChip label="Label" />,
  parameters: { ...figma('455:696', 'Drop Down - Selector › Chip'), controls: { disable: true } },
};
