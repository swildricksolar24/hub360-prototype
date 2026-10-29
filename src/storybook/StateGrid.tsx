import type { ReactNode } from 'react';

export type StateName = 'Default' | 'Hover' | 'Press' | 'Focus' | 'Selected' | 'Disabled' | 'Error' | 'Required';

/** Cell classes that storybook-addon-pseudo-states targets (see `pseudoStates`). */
const PSEUDO_CLASS: Partial<Record<StateName, string>> = {
  Hover: 'state-hover',
  Press: 'state-press',
  Focus: 'state-focus',
};

/**
 * Spread into a story's `parameters` so the Hover / Press / Focus cells render their pseudo-state.
 * The addon marks each matched element (`.x:hover` also matches `.x.pseudo-hover`), so every
 * element inside the cell is targeted; that also covers `:is(:hover, …)` and `:focus-within` rules.
 */
export const pseudoStates = {
  pseudo: {
    hover: ['.state-hover *'],
    active: ['.state-press *'],
    focusVisible: ['.state-focus *'],
    focusWithin: ['.state-focus *'],
  },
};

type Props = {
  states: StateName[];
  render: (state: StateName) => ReactNode;
  direction?: 'row' | 'column';
};

/** Shows one component in each of its Figma states, labelled with the Figma variant name. */
export function StateGrid({ states, render, direction = 'row' }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: direction, flexWrap: 'wrap', gap: 'var(--space-24)', alignItems: 'flex-start' }}>
      {states.map(state => (
        <figure key={state} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
            State={state}
          </figcaption>
          <div className={PSEUDO_CLASS[state]}>{render(state)}</div>
        </figure>
      ))}
    </div>
  );
}
