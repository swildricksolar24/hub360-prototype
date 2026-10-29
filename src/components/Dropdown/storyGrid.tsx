import type { ReactNode } from 'react';

/** Cell classes that `pseudoStates` (src/storybook/StateGrid.tsx) targets. */
const PSEUDO: Record<string, string> = { Hover: 'state-hover', Press: 'state-press', Focus: 'state-focus' };

/**
 * Like StateGrid, but for the dropdown sets whose Figma `State` axis mixes in values such as
 * "Default - Light", "Press - Alt" or "Active Open". `Hover`, `Press` and `Focus` cells get the
 * pseudo-state classes, so spread `pseudoStates` into the story parameters as usual.
 */
export function DropdownStateGrid<S extends string>({
  states,
  render,
  direction = 'row',
  cellWidth,
  caption = s => `State=${s}`,
}: {
  states: readonly S[];
  render: (state: S) => ReactNode;
  direction?: 'row' | 'column';
  cellWidth?: number;
  /** Cell caption; defaults to `State=<state>`. */
  caption?: (state: S) => string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: direction, flexWrap: 'wrap', gap: 'var(--space-24)', alignItems: 'flex-start' }}>
      {states.map(state => (
        <figure key={state} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', width: cellWidth }}>
          <figcaption className="text-small-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
            {caption(state)}
          </figcaption>
          <div className={PSEUDO[state] ?? PSEUDO[state.split('State=')[1] ?? '']}>{render(state)}</div>
        </figure>
      ))}
    </div>
  );
}

/** Sample options used across the dropdown stories (Figma uses US states). */
export const STATE_OPTIONS = [
  { value: 'al', label: 'Alabama' },
  { value: 'ak', label: 'Alaska' },
  { value: 'az', label: 'Arizona' },
  { value: 'ar', label: 'Arkansas' },
  { value: 'ca', label: 'California' },
  { value: 'co', label: 'Colorado' },
  { value: 'ct', label: 'Connecticut' },
  { value: 'de', label: 'Delaware' },
];
