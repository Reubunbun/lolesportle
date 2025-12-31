import '@radix-ui/themes/styles.css';
import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Theme, ThemePanel } from '@radix-ui/themes';
import App from './App.tsx';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Theme accentColor='blue' grayColor='sage' radius='small' scaling='105%'>
        <App />
        <ThemePanel />
      </Theme>
    </QueryClientProvider>
  </StrictMode>,
);
