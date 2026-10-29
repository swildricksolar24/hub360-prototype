const FILE_URL = 'https://www.figma.com/design/ieTXU4rFsUAmlEsF93zF5T/__Design-System---Base';

/** Link to a node in the design system Figma file. */
export const figmaUrl = (nodeId: string) => `${FILE_URL}?node-id=${nodeId.replace(':', '-')}`;

/**
 * Story parameters that connect a story to its Figma component set:
 * the Design panel (addon-designs) and an "Open in Figma" link in the docs.
 */
export const figma = (nodeId: string, figmaName: string) => ({
  design: { type: 'figma' as const, url: figmaUrl(nodeId) },
  docs: { description: { story: `Figma: [${figmaName}](${figmaUrl(nodeId)}) (\`${nodeId}\`)` } },
});
