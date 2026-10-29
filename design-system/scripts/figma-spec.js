// Read-only Figma spec extractor. Paste into a `use_figma` call (Figma MCP) and set SETS / PAGES.
// For each component set it returns the property definitions, the first variant in full
// (layout, padding/gap/radius with their variable names, fills/strokes as variable names,
// text styles, nested instances one level deep) and every other variant as a diff against it.
// «Name» marks a variable that is remote or not in this file's local collections.
const SETS = ['25:355'];             // component set or component node IDs
const PAGES = ['26:517'];            // pages those nodes live on (loaded before reading)

for (const pid of PAGES) await (await figma.getNodeByIdAsync(pid)).loadAsync();
const vcache = {};
const hexA = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('') + (c.a !== undefined && c.a < 1 ? Math.round(c.a * 255).toString(16).padStart(2, '0') : '');
const vn = async id => {
  if (vcache[id]) return vcache[id];
  const v = await figma.variables.getVariableByIdAsync(id);
  let name = v ? v.name : `?${id}`;
  if (v) { const col = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId); if (!col || col.remote || v.remote) name = `«${name}»`; }
  return (vcache[id] = name);
};
const paint = async ps => !Array.isArray(ps) ? 'mixed' : (await Promise.all(ps.filter(p => p.visible !== false).map(async p =>
  p.type !== 'SOLID' ? p.type : p.boundVariables?.color ? await vn(p.boundVariables.color.id) : hexA({ ...p.color, a: p.opacity })))).join('+') || '-';
const num = async (n, k) => { const b = n.boundVariables?.[k]; const v = n[k]; if (v === undefined || v === figma.mixed) return undefined; if (!v && !b) return undefined; return b ? `${v}{${await vn(b.id)}}` : `${+(+v).toFixed(2)}`; };
async function spec(n, depth = 0) {
  const s = { t: n.type[0], n: n.name, sz: `${Math.round(n.width)}x${Math.round(n.height)}` };
  if (n.visible === false) s.hidden = true;
  if ('layoutMode' in n && n.layoutMode !== 'NONE') {
    s.al = `${n.layoutMode[0]} ${n.primaryAxisAlignItems}/${n.counterAxisAlignItems}`;
    s.gap = await num(n, 'itemSpacing');
    const p = await Promise.all(['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].map(k => num(n, k)));
    if (p.some(Boolean)) s.pad = p.map(x => x ?? '0').join(' ');
  }
  if ('layoutSizingHorizontal' in n && n.parent && n.parent.type !== 'COMPONENT_SET') s.sizing = `${n.layoutSizingHorizontal[0]}/${n.layoutSizingVertical[0]}`;
  if ('topLeftRadius' in n) s.r = await num(n, 'topLeftRadius');
  if ('fills' in n && n.fills?.length) { const f = await paint(n.fills); if (f !== '-') s.fill = f; }
  if ('strokes' in n && n.strokes?.length) { s.stroke = await paint(n.strokes); s.sw = await num(n, typeof n.strokeWeight === 'number' ? 'strokeWeight' : 'strokeTopWeight'); }
  if (n.effects?.length) s.fx = n.effects.filter(e => e.visible !== false).map(e => `${e.type} ${e.offset?.x ?? ''},${e.offset?.y ?? ''} ${e.radius} ${e.color ? hexA(e.color) : ''}`).join('|');
  if (n.type === 'TEXT') { s.ts = typeof n.textStyleId === 'string' && n.textStyleId ? (await figma.getStyleByIdAsync(n.textStyleId))?.name : 'raw'; s.txt = n.characters.slice(0, 40); }
  if (n.type === 'INSTANCE') {
    const mc = await n.getMainComponentAsync();
    s.main = mc ? (mc.parent?.type === 'COMPONENT_SET' ? `${mc.parent.name} › ${mc.name}` : mc.name) + ` (${mc.id})` : '?';
    if (depth >= 1) return s;
  }
  if ('children' in n && n.children.length) s.c = await Promise.all(n.children.map(c => spec(c, depth + (n.type === 'INSTANCE' ? 1 : 0))));
  return s;
}
function flat(s, path = '', out = {}) { for (const [k, v] of Object.entries(s)) { if (k === 'c') v.forEach((ch, i) => flat(ch, `${path}/${i}:${ch.n}`, out)); else out[`${path}.${k}`] = v; } return out; }
const result = [];
for (const id of SETS) {
  const node = await figma.getNodeByIdAsync(id);
  const isSet = node.type === 'COMPONENT_SET';
  const defsOwner = isSet ? node : node.parent?.type === 'COMPONENT_SET' ? node.parent : node;
  const props = Object.entries(defsOwner.componentPropertyDefinitions ?? {}).map(([k, d]) => `${k.split('#')[0]}:${d.type}${d.type === 'VARIANT' ? '(' + d.variantOptions.join('|') + ')' : '=' + JSON.stringify(d.defaultValue)}`);
  const variants = isSet ? node.children : [node];
  const base = await spec(variants[0]);
  const bf = flat(base);
  const diffs = {};
  for (const v of variants.slice(1)) {
    const f = flat(await spec(v)); const d = {};
    for (const k of new Set([...Object.keys(bf), ...Object.keys(f)])) if (k !== '.n' && JSON.stringify(bf[k]) !== JSON.stringify(f[k])) d[k] = f[k] ?? null;
    diffs[v.name] = d;
  }
  result.push({ id, name: node.name, description: node.description?.slice(0, 200), props, base0: variants[0].name, base, diffs });
}
return result;
