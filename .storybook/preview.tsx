import type { Preview } from '@storybook/react-vite';
import { create } from 'storybook/theming';
import '../design-system/tokens/tokens.css';
import tokens from '../design-system/tokens/tokens.json';

type TokenNode = { $value?: string; $extensions?: { 'com.figma'?: { modes?: Record<string, string> } }; [key: string]: unknown };

/** A color token's literal value in a Figma mode; Storybook's theme API can't read CSS variables. */
function tokenColor(path: string, mode: string): string {
  const node = path.split('.').reduce<TokenNode>((n, key) => n[key] as TokenNode, tokens as unknown as TokenNode);
  const value = node.$extensions?.['com.figma']?.modes?.[mode] ?? node.$value ?? '';
  return value.startsWith('{') ? tokenColor(value.slice(1, -1), mode) : value;
}

// STORYBOOK_THEME=dark in a local .env.local opens Storybook in dark mode; the deployed site stays light
const defaultTheme = import.meta.env.STORYBOOK_THEME === 'dark' ? 'dark' : 'light';

// Docs pages don't run story decorators, so set the theme attribute up front as well
document.documentElement.setAttribute('data-theme', defaultTheme);

const darkDocs = create({
  base: 'dark',
  appContentBg: tokenColor('color.surfaces.base', 'Dark'),
  appPreviewBg: tokenColor('color.surfaces.base', 'Dark'),
  textColor: tokenColor('color.gray-text.strong', 'Dark'),
  fontBase: '"Inter", system-ui, sans-serif',
});

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Color mode (sets data-theme on <html>)',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: defaultTheme },
  decorators: [
    (Story, context) => {
      // Semantic tokens only switch when data-theme is on <html> (see src/design-system.md)
      document.documentElement.setAttribute('data-theme', context.globals.theme);
      return <Story />;
    },
  ],
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    docs: defaultTheme === 'dark' ? { theme: darkDocs } : {},
  },
};

export default preview;
