import type { CSSProperties } from 'react';
import styles from './Icon.module.css';

const svgs = import.meta.glob('./svg/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const byName = Object.fromEntries(Object.entries(svgs).map(([path, svg]) => [path.slice('./svg/'.length, -'.svg'.length), svg]));

/** Every icon exported from the Figma Icon Library (Material, Chevron, Arrow and Last sets). */
export const iconNames = Object.keys(byName).sort();

export type IconProps = {
  /** File name in `svg/`, e.g. `close-small`, `chevron-down`. */
  name: string;
  /** Rendered size in px. Figma uses 20, 24 and 32. */
  size?: number;
  /** Any CSS color. Defaults to `--color-gray-fill-strong`, the Figma icon fill. */
  color?: string;
  /** Accessible name. Without it the icon is decorative and hidden from assistive tech. */
  label?: string;
  className?: string;
};

export function Icon({ name, size = 24, color, label, className }: IconProps) {
  const svg = byName[name];
  if (!svg) throw new Error(`Unknown icon "${name}". Available: ${iconNames.join(', ')}`);
  const style: CSSProperties = { width: size, height: size, color };
  return (
    <span
      className={[styles.icon, className].filter(Boolean).join(' ')}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
