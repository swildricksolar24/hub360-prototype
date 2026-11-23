const FILE_URLS = {
  /** The design system ("__Design System - Base"), where the components' main sets live. */
  base: 'https://www.figma.com/design/ieTXU4rFsUAmlEsF93zF5T/__Design-System---Base',
  /** "1. Inventory Management", for pieces drawn only on its pages (e.g. the Item Details jump links). */
  inventory: 'https://www.figma.com/design/7FlRxkXbbjUhWJ3t1MMrVr/1.-Inventory-Management',
};
export type FigmaFile = keyof typeof FILE_URLS;

/** Link to a node in a Figma file (the design system file unless another is named). */
export const figmaUrl = (nodeId: string, file: FigmaFile = 'base') => `${FILE_URLS[file]}?node-id=${nodeId.replace(':', '-')}`;

/**
 * Story parameters that connect a story to its Figma component set:
 * the Design panel (addon-designs) and an "Open in Figma" link in the docs.
 */
export const figma = (nodeId: string, figmaName: string, file: FigmaFile = 'base') => ({
  design: { type: 'figma' as const, url: figmaUrl(nodeId, file) },
  docs: { description: { story: `Figma: [${figmaName}](${figmaUrl(nodeId, file)}) (\`${nodeId}\`)` } },
});
