import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { NavTab, NavTabBar, NavTabSmall } from './NavTabBar';
import { figma } from '../../storybook/figma';
import { StateGrid, pseudoStates } from '../../storybook/StateGrid';

const tabs = [1, 2, 3, 4].map(n => ({ id: `t${n}`, label: `Label ${n}` }));
const noop = () => {};

const meta = {
  title: 'Navigation/NavTabBar',
  component: NavTabBar,
  args: { tabs, activeId: 't1', onHome: noop, onAdd: noop, onClose: noop },
} satisfies Meta<typeof NavTabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const Caption = ({ children }: { children: string }) => (
  <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
    {children}
  </figcaption>
);

/** Interactive: select, close and add tabs. */
export const Playground: Story = {
  render: args => {
    const [list, setList] = useState(args.tabs);
    const [active, setActive] = useState(args.activeId);
    return (
      <NavTabBar
        {...args}
        tabs={list}
        activeId={active}
        onSelect={setActive}
        onClose={id => setList(l => l.filter(t => t.id !== id))}
        onAdd={() => {
          const id = `t${Date.now()}`;
          setList(l => [...l, { id, label: `Label ${l.length + 1}` }]);
          setActive(id);
        }}
      />
    );
  },
};

export const TabBar: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
      {['First', 'Second', 'Third', 'Fourth'].map((name, i) => (
        <figure key={name} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <Caption>{`Active Tab=${name}`}</Caption>
          <NavTabBar tabs={tabs} activeId={tabs[i].id} onHome={noop} onAdd={noop} onClose={noop} aria-label={`Active tab ${name}`} />
        </figure>
      ))}
    </div>
  ),
  parameters: { ...figma('2133:4457', 'Tab Bar (Main Nav) › Tab Bar'), controls: { disable: true } },
};

export const TabButton: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-24)', padding: 'var(--space-8)', background: 'var(--color-surfaces-raised)' }}>
      {[
        { name: 'First / Last', active: false, divider: false },
        { name: 'Active', active: true, divider: false },
        { name: 'Inactive', active: false, divider: true },
      ].map(s => (
        <figure key={s.name} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <Caption>{`State=${s.name}`}</Caption>
          <div role="tablist" aria-label={s.name}>
            <NavTab label="Label" active={s.active} divider={s.divider} onClose={noop} />
          </div>
        </figure>
      ))}
    </div>
  ),
  parameters: { ...figma('1994:336', 'Tab Bar (Main Nav) › Tab Button'), controls: { disable: true } },
};

export const TabLabel: Story = {
  render: () => (
    <div style={{ padding: 'var(--space-8)', background: 'var(--color-surfaces-raised)' }}>
      <StateGrid
        states={['Default', 'Hover']}
        render={state => (
          <div role="tablist" aria-label={state}>
            <NavTab label="Label" onClose={noop} />
          </div>
        )}
      />
    </div>
  ),
  parameters: { ...figma('1994:326', 'Tab Bar (Main Nav) › Tab Label'), ...pseudoStates, controls: { disable: true } },
};

export const TabSmall: Story = {
  render: () => (
    <div style={{ padding: 'var(--space-8)', background: 'var(--color-surfaces-raised)' }}>
      <StateGrid states={['Default', 'Hover']} render={() => <NavTabSmall icon="plus" label="New tab" />} />
    </div>
  ),
  parameters: { ...figma('2049:540', 'Tab Bar (Main Nav) › Tab Small'), ...pseudoStates, controls: { disable: true } },
};
