import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The app (index.html → src/app/main.tsx). Storybook has its own Vite config via @storybook/react-vite.
// APP_BASE lets a deploy serve the app under a sub-path; GitHub Pages uses /hub360-prototype/prototype/.
export default defineConfig({
  base: process.env.APP_BASE ?? '/',
  plugins: [react()],
  server: { port: 5173 },
});
