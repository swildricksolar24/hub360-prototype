import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-designs',
    'storybook-addon-pseudo-states',
    '@storybook/addon-mcp'
  ],
  framework: { name: '@storybook/react-vite', options: {} },
  // Lets the Storybook MCP docs toolset read component props
  features: { componentsManifest: true },
};

export default config;
