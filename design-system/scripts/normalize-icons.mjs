// Normalizes SVGs exported from the Figma Icon Library into src/components/Icon/svg.
// Figma exports them with the file's dark-mode colors and a 10% background rect baked in;
// this strips the rect and makes every paint `currentColor` so the Icon component sets the color.
// Safe to re-run. Usage: node design-system/scripts/normalize-icons.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'components', 'Icon', 'svg');
let changed = 0;

for (const file of readdirSync(dir).filter(f => f.endsWith('.svg'))) {
  const path = join(dir, file);
  const before = readFileSync(path, 'utf8');
  const after = before
    // full-size translucent background from the icon component's own fill
    .replace(/<rect width="24" height="24" fill="[^"]+" fill-opacity="0\.1"\s*\/>\s*/g, '')
    .replace(/(fill|stroke)="(?!none|url\()[^"]+"/g, '$1="currentColor"')
    // masks work on luminance, so their paint must stay white
    .replace(/(<mask[^>]*?)fill="currentColor"/g, '$1fill="white"')
    // the 90% opacity comes from the Gray Fill/Strong token, which the component applies instead
    .replace(/\s(fill-opacity|stroke-opacity|opacity)="0\.9"/g, '');
  if (after !== before) { writeFileSync(path, after); changed++; }
}
console.log(`Normalized ${changed} icon(s) in ${dir}`);
