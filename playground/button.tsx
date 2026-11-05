/*
 * A one-page playground for trying a single design-system component by hand (not part of the app or its build).
 * Run: npx vite --port 5180 --strictPort, then open http://localhost:5180/playground/button.html
 */
import { StrictMode, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '../design-system/tokens/tokens.css';
import { Button } from '../src/components/Button/Button';
import { Toggle } from '../src/components/Toggle/Toggle';

const FIGMA = 'https://www.figma.com/design/ieTXU4rFsUAmlEsF93zF5T/__Design-System---Base?node-id=3234-4981';

/*
 * Hover, Press and Focus only appear while someone interacts, so the states row draws them as fixed previews by
 * setting the same values Button.module.css uses for those states. Selected and Disabled are the real props.
 */
const STRONG = 'var(--color-brand-teal-fill-strong)';
const RING_4 = 'var(--stroke-width-4)';
const STATES: { name: string; note: string; props?: { selected?: boolean; disabled?: boolean }; style?: CSSProperties }[] = [
  { name: 'Default', note: 'Teal Fill/Weak · 2px Gray Stroke/Weaker' },
  { name: 'Hover', note: '4px border', style: { '--ring-w': RING_4 } as CSSProperties },
  { name: 'Press', note: 'Teal Fill/Strong · 4px border', style: { '--bg': STRONG, '--ring-w': RING_4 } as CSSProperties },
  { name: 'Selected', note: 'Teal Fill/Strong · 4px border', props: { selected: true } },
  {
    name: 'Focus',
    note: 'Teal Fill/Strong · 4px border centered on the edge',
    style: {
      '--bg': STRONG,
      boxShadow: 'inset 0 0 0 var(--stroke-width-2) var(--ring), 0 0 0 var(--stroke-width-2) var(--ring)',
    } as CSSProperties,
  },
  { name: 'Disabled', note: 'Teal Fill/Disabled · 4px Gray Stroke/Disabled', props: { disabled: true } },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
      <h2 className="text-large-bold" style={{ margin: 0 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Playground() {
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [label, setLabel] = useState('Label');
  const [clicks, setClicks] = useState(0);
  const [selected, setSelected] = useState(false);

  // Semantic tokens only switch when data-theme is on <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <main
      style={{
        minHeight: '100vh',
        boxSizing: 'border-box',
        margin: 0,
        padding: 'var(--space-40)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-32)',
        background: 'var(--color-surfaces-base)',
        color: 'var(--color-gray-text-strong)',
        fontFamily: 'var(--font-family-inter)',
      }}
    >
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-16)' }}>
        <div>
          <h1 className="text-heading-3-bold" style={{ margin: 0 }}>
            Brand / Teal / Outline
          </h1>
          <p className="text-medium-regular" style={{ margin: 0, color: 'var(--color-gray-text-weak)' }}>
            <code>{'<Button variant="brand-outline">'}</code> ·{' '}
            <a href={FIGMA} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
              Open in Figma
            </a>
          </p>
        </div>
        <Toggle label="Dark mode" checked={dark} onChange={e => setDark(e.target.checked)} />
      </header>

      <Section title="All states (Figma Property 1)">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 'var(--space-32)' }}>
          {STATES.map(s => (
            <figure key={s.name} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', width: 180 }}>
              <figcaption className="text-small-bold">Property 1={s.name}</figcaption>
              <div style={{ padding: 'var(--space-4)' }}>
                <Button variant="brand-outline" tabIndex={-1} style={s.style} {...s.props}>
                  {label || 'Label'}
                </Button>
              </div>
              <span className="text-tiny-regular" style={{ color: 'var(--color-gray-text-weak)' }}>
                {s.note}
              </span>
            </figure>
          ))}
        </div>
        <p className="text-small-regular" style={{ margin: 0, color: 'var(--color-gray-text-weak)' }}>
          Hover, Press and Focus are fixed previews here; try the real ones below.
        </p>
      </Section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
        <h2 className="text-large-bold" style={{ margin: 0 }}>
          Try it
        </h2>
        <p className="text-medium-regular" style={{ margin: 0, color: 'var(--color-gray-text-weak)' }}>
          Hover it (the border thickens to 4px), hold the mouse down on it (Press: the fill turns solid teal), or Tab
          to it (Focus: solid teal with the 4px border).
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-24)', flexWrap: 'wrap' }}>
          <Button variant="brand-outline" onClick={() => setClicks(c => c + 1)}>
            {label || 'Label'}
          </Button>
          <span className="text-medium-regular" aria-live="polite">
            Clicked {clicks} {clicks === 1 ? 'time' : 'times'}
          </span>
        </div>
        <label className="text-medium-regular" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', color: 'var(--color-gray-text-weak)' }}>
          Label
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            style={{
              padding: 'var(--space-8) var(--space-12)',
              border: 0,
              borderRadius: 'var(--radius-8)',
              background: 'var(--color-gray-fill-weaker)',
              color: 'var(--color-gray-text-strong)',
              font: 'inherit',
            }}
          />
        </label>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
        <h2 className="text-large-bold" style={{ margin: 0 }}>
          Other states
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-24)', flexWrap: 'wrap' }}>
          <Button variant="brand-outline" icon="plus">
            With icon
          </Button>
          <Button variant="brand-outline" selected={selected} onClick={() => setSelected(s => !s)}>
            {selected ? 'Selected' : 'Toggle me'}
          </Button>
          <Button variant="brand-outline" disabled>
            Disabled
          </Button>
        </div>
        <p className="text-small-regular" style={{ margin: 0, color: 'var(--color-gray-text-weak)' }}>
          All six Figma states are coded: Default, Hover, Press, Selected (click the toggle), Focus and Disabled.
        </p>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Playground />
  </StrictMode>,
);
