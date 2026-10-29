import type { Preview } from '@storybook/react-vite';
import '../design-system/tokens/tokens.css';

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
  initialGlobals: { theme: 'light' },
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
  },
};

export default preview;
