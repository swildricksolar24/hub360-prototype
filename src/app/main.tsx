import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../design-system/tokens/tokens.css';
import './global.css';
import './theme';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
