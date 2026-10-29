import { addons } from 'storybook/manager-api';
import { themes } from 'storybook/theming';

// Storybook injects STORYBOOK_* variables (e.g. from a local .env.local) into the manager bundle
declare const process: { env: Record<string, string | undefined> };

// STORYBOOK_THEME=dark switches Storybook's own UI to its dark theme; without it the default theme is used
if (process.env.STORYBOOK_THEME === 'dark') addons.setConfig({ theme: themes.dark });
