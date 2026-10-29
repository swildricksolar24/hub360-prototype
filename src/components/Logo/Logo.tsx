import { useId, type CSSProperties } from 'react';
import styles from './Logo.module.css';
import sideIcon from './parts/logo-side-icon.svg?raw';

/*
 * SVGs in `svg/` are exported from the Figma "Logos*" page with Framelink and kept as brand artwork.
 * Fills Figma binds to a variable were rewritten to `currentColor` so the variable can be applied in CSS:
 *  - parts/logo-side-icon.svg (Logo Side's icon): the four segments use "Logo Color"
 *  - equal-housing-lender.svg, face-id.svg: "Gray Fill/Strong"
 */
const svgs = import.meta.glob('./svg/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const byName = Object.fromEntries(Object.entries(svgs).map(([path, svg]) => [path.slice('./svg/'.length, -'.svg'.length), svg]));

export type LogoName =
  | 'logo-icon'
  | 'logo-full'
  | 'logo-texala'
  | 'logo-side'
  | 'recaptcha'
  | 'equal-housing-lender'
  | 'face-id'
  | 'google'
  | 'microsoft';

/** Every Figma logo set except "_Fake logo". */
export const logoNames: LogoName[] = [
  'logo-icon',
  'logo-full',
  'logo-side',
  'logo-texala',
  'recaptcha',
  'equal-housing-lender',
  'face-id',
  'google',
  'microsoft',
];

export type LogoSideBrand = 'HUB 360' | 'SS 360';

/** Live text of Logo Side, per Figma `Brand` variant. */
const SIDE_TEXT: Record<LogoSideBrand, string> = { 'HUB 360': 'HUB 360', 'SS 360': 'Solar Suite 360' };

/** Figma frame height of each set, used as the default `height`. */
const NATIVE_HEIGHT: Record<LogoName, number> = {
  'logo-icon': 80,
  'logo-full': 118,
  'logo-texala': 36,
  'logo-side': 60,
  recaptcha: 116,
  'equal-housing-lender': 125,
  'face-id': 70,
  google: 48,
  microsoft: 48,
};

const DEFAULT_LABEL: Record<LogoName, string> = {
  'logo-icon': 'Solar Suite 360',
  'logo-full': 'Solar Suite 360',
  'logo-texala': 'Texala Technologies',
  'logo-side': '',
  recaptcha: 'reCAPTCHA',
  'equal-housing-lender': 'Equal Housing Lender',
  'face-id': 'Face ID',
  google: 'Google',
  microsoft: 'Microsoft',
};

export type LogoProps = {
  /** Figma set: Logo Icon, Logo Full, Logo Texala, Logo Side, Recaptcha, Equal Housing Lender*, Face ID Symbol*, Google, Microsoft. */
  name: LogoName;
  /** Logo Side `Brand` variant. Only used when `name` is `logo-side`. */
  brand?: LogoSideBrand;
  /** Rendered height in px; width follows the artwork's aspect ratio. Defaults to the Figma size. */
  height?: number;
  /**
   * Accessible name. Defaults to the brand name (Logo Side reads its own text).
   * Pass `""` when the logo is decorative, e.g. next to the same text.
   */
  label?: string;
  className?: string;
};

/** Gives every `id` in an inline SVG a per-instance prefix so repeated logos don't share masks or gradients. */
function scopeIds(svg: string, scope: string) {
  return svg.replace(/id="([^"]+)"/g, `id="${scope}$1"`).replace(/url\(#([^)]+)\)/g, `url(#${scope}$1)`);
}

export function Logo({ name, brand = 'HUB 360', height, label, className }: LogoProps) {
  const scope = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const h = height ?? NATIVE_HEIGHT[name];
  const classes = [styles.logo, className].filter(Boolean).join(' ');

  if (name === 'logo-side') {
    const text = SIDE_TEXT[brand];
    const style = { '--logo-scale': h / NATIVE_HEIGHT['logo-side'] } as CSSProperties;
    return (
      <span
        className={[classes, styles.side].join(' ')}
        style={style}
        data-name={name}
        role={label === '' ? undefined : 'img'}
        aria-label={label === '' ? undefined : label || text}
        aria-hidden={label === '' ? true : undefined}
      >
        <span className={styles.sideIcon} dangerouslySetInnerHTML={{ __html: scopeIds(sideIcon, scope) }} />
        <span className={styles.sideText}>{text}</span>
      </span>
    );
  }

  const svg = byName[name];
  if (!svg) throw new Error(`Unknown logo "${name}". Available: ${logoNames.join(', ')}`);
  const accessibleName = label ?? DEFAULT_LABEL[name];
  return (
    <span
      className={classes}
      style={{ height: h }}
      data-name={name}
      role={accessibleName ? 'img' : undefined}
      aria-label={accessibleName || undefined}
      aria-hidden={accessibleName ? undefined : true}
      dangerouslySetInnerHTML={{ __html: scopeIds(svg, scope) }}
    />
  );
}
