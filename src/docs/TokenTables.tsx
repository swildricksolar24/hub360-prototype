import type { CSSProperties, ReactNode } from 'react';
import tokens from '../../design-system/tokens/tokens.json';

type FigmaExt = { collection: string; figmaName: string; scopes: string[]; modes?: Record<string, unknown> };
type Token = { path: string[]; type: string; value: unknown; figma?: FigmaExt };

const leaves: Token[] = [];
(function walk(node: Record<string, unknown>, path: string[]) {
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$') || typeof child !== 'object' || child === null) continue;
    const c = child as Record<string, unknown>;
    if ('$value' in c) {
      const ext = (c.$extensions as Record<string, FigmaExt> | undefined)?.['com.figma'];
      leaves.push({ path: [...path, key], type: c.$type as string, value: c.$value, figma: ext });
    } else walk(c, [...path, key]);
  }
})(tokens as Record<string, unknown>, []);

const byPath = new Map(leaves.map(t => [t.path.join('.'), t]));
const cssVar = (t: Token) => `--${t.path.join('-')}`;

/** Resolves a color token to its hex value in a Figma mode, following aliases. */
function resolve(value: unknown, mode: string): string {
  if (typeof value === 'string' && value.startsWith('{')) {
    const target = byPath.get(value.slice(1, -1));
    return target ? resolve(target.figma?.modes?.[mode] ?? target.value, mode) : value;
  }
  if (value && typeof value === 'object' && 'color' in value) {
    const { color, alpha } = value as { color: string; alpha: number };
    return resolve(color, mode).slice(0, 7) + Math.round(alpha * 255).toString(16).padStart(2, '0');
  }
  return String(value);
}
const aliasName = (value: unknown) => (typeof value === 'string' && value.startsWith('{') ? byPath.get(value.slice(1, -1))?.figma?.figmaName : undefined);

const cell: CSSProperties = { padding: 'var(--space-8) var(--space-12)', borderBottom: 'var(--stroke-width-1) solid var(--color-gray-stroke-weaker)', verticalAlign: 'middle', textAlign: 'left' };
const code: CSSProperties = { fontFamily: 'ui-monospace, monospace', fontSize: 'var(--font-size-small)' };
const checker = 'repeating-conic-gradient(var(--color-foundation-solid-300) 0% 25%, var(--color-foundation-solid-white) 0% 50%) 50% / 12px 12px';

function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%' }} className="text-small-regular">
      <thead>
        <tr>{head.map(h => <th key={h} style={{ ...cell, fontWeight: 700 }}>{h}</th>)}</tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function Swatch({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
      <span style={{ width: 40, height: 24, borderRadius: 'var(--radius-4)', background: checker, position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 0 0 1px var(--color-gray-stroke-weaker)' }}>
        <span style={{ position: 'absolute', inset: 0, background: color }} />
      </span>
      <span style={code}>{color}</span>
    </div>
  );
}

const NOTES: Record<string, string> = {
  '--color-brand-orange-text-strong': '~2.4:1 on white; fails WCAG AA',
  '--color-brand-teal-text-weak': '~1.6:1 on white; fails WCAG AA',
  '--color-gray-text-disabled': '20% opacity; disabled controls only',
};

/** Color tokens with their Light and Dark values. `semantic` = everything outside `color.foundation`. */
export function ColorTokens({ kind }: { kind: 'semantic' | 'primitive' }) {
  const colors = leaves.filter(t => t.type === 'color' && (t.path[1] === 'foundation') === (kind === 'primitive'));
  const groups = [...new Set(colors.map(t => t.path.slice(1, kind === 'primitive' ? 3 : 2).join('.')))];
  return (
    <>
      {groups.map(group => (
        <section key={group}>
          <h3>{group.replace('foundation.', '').replace(/-/g, ' ')}</h3>
          <Table head={['Token', 'Figma', 'Light', 'Dark', 'Scope / note']}>
            {colors.filter(t => t.path.slice(1).join('.').startsWith(group + '.')).map(t => {
              const modes = t.figma?.modes ?? {};
              return (
                <tr key={cssVar(t)}>
                  <td style={cell}><code style={code}>{cssVar(t)}</code></td>
                  <td style={cell}>
                    {t.figma?.figmaName}
                    {aliasName(modes.Light) && <div style={{ color: 'var(--color-gray-text-weak)' }}>→ {aliasName(modes.Light)}{aliasName(modes.Dark) !== aliasName(modes.Light) && ` / ${aliasName(modes.Dark)}`}</div>}
                  </td>
                  <td style={cell}><Swatch color={resolve(modes.Light ?? t.value, 'Light')} /></td>
                  <td style={cell}><Swatch color={resolve(modes.Dark ?? t.value, 'Dark')} /></td>
                  <td style={cell}>{NOTES[cssVar(t)] ?? (t.figma?.scopes.length ? t.figma.scopes.join(', ') : 'hidden in Figma')}</td>
                </tr>
              );
            })}
          </Table>
        </section>
      ))}
    </>
  );
}

/** Spacing, radius or stroke-width scale with a visual sample. */
export function ScaleTokens({ group }: { group: 'space' | 'radius' | 'stroke-width' }) {
  const scale = leaves.filter(t => t.path[0] === group).sort((a, b) => parseFloat(a.value as string) - parseFloat(b.value as string));
  const sample = (t: Token): ReactNode => {
    const v = `var(${cssVar(t)})`;
    if (group === 'space') return <span style={{ display: 'block', width: v, height: 'var(--space-16)', background: 'var(--color-brand-teal-fill-weak)' }} />;
    if (group === 'radius') return <span style={{ display: 'block', width: 'var(--space-64)', height: 'var(--space-40)', borderRadius: v, background: 'var(--color-gray-fill-weaker)', boxShadow: 'inset 0 0 0 1px var(--color-gray-stroke-weak)' }} />;
    return <span style={{ display: 'block', width: 'var(--space-96)', height: 0, borderTop: `${v} solid var(--color-gray-stroke-strong)` }} />;
  };
  return (
    <Table head={['Token', 'Value', 'Figma', 'Sample']}>
      {scale.map(t => (
        <tr key={cssVar(t)}>
          <td style={cell}><code style={code}>{cssVar(t)}</code></td>
          <td style={cell}>{String(t.value)}</td>
          <td style={cell}>{t.figma?.collection} / {t.figma?.figmaName}</td>
          <td style={cell}>{sample(t)}</td>
        </tr>
      ))}
    </Table>
  );
}

/** Font size / line height variables (Desktop and Mobile) and the generated `.text-*` classes. */
export function TypeTokens() {
  const sizes = leaves.filter(t => t.path[0] === 'font-size');
  const styles = leaves.filter(t => t.path[0] === 'typography' && t.path[1] !== 'annotation');
  return (
    <>
      <Table head={['Scale', 'Desktop', 'Mobile', 'Variables']}>
        {sizes.map(t => {
          const lh = byPath.get(['line-height', t.path[1]].join('.'));
          return (
            <tr key={cssVar(t)}>
              <td style={cell}>{t.figma?.figmaName.replace('Font Size/', '')}</td>
              <td style={cell}>{String(t.figma?.modes?.Desktop)} / {String(lh?.figma?.modes?.Desktop)}</td>
              <td style={cell}>{String(t.figma?.modes?.Mobile)} / {String(lh?.figma?.modes?.Mobile)}</td>
              <td style={cell}><code style={code}>{cssVar(t)}</code><br /><code style={code}>{lh && cssVar(lh)}</code></td>
            </tr>
          );
        })}
      </Table>
      <h3>Text classes</h3>
      <Table head={['Class', 'Sample']}>
        {styles.map(t => {
          const cls = `text-${t.path.slice(1).join('-')}`;
          return (
            <tr key={cls}>
              <td style={cell}><code style={code}>.{cls}</code></td>
              <td style={cell}><span className={cls}>The quick brown fox</span></td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}

export function ShadowTokens() {
  return (
    <Table head={['Token', 'Value', 'Sample']}>
      <tr>
        <td style={cell}><code style={code}>--shadow-drop</code></td>
        <td style={cell}><code style={code}>0 4px 4px 0 #00000040</code> (Figma effect style "Drop Shadow")</td>
        <td style={cell}><span style={{ display: 'block', width: 'var(--space-64)', height: 'var(--space-40)', borderRadius: 'var(--radius-8)', background: 'var(--color-surfaces-overlay)', boxShadow: 'var(--shadow-drop)' }} /></td>
      </tr>
    </Table>
  );
}
