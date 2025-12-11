import '@radix-ui/themes/styles.css';
import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Theme, ThemePanel } from '@radix-ui/themes';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Theme accentColor='iris' grayColor='sage' radius='small' scaling='105%'>
      <App />
      <ThemePanel />
    </Theme>
  </StrictMode>,
)
