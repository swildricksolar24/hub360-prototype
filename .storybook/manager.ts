import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

// Storybook injects STORYBOOK_* variables (e.g. from a local .env.local) into the manager bundle
declare const process: { env: Record<string, string | undefined> };

// STORYBOOK_THEME=dark switches Storybook's own UI to its dark theme; without it the light theme is used.
// The brand title names the design system: Volt.
addons.setConfig({
  theme: create({
    base: process.env.STORYBOOK_THEME === 'dark' ? 'dark' : 'light',
    brandTitle: 'Volt',
  }),
});
