import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { Theme } from '@radix-ui/themes';
import { ROUTES } from './constants';
import Layout from './layouts/main';
import Home from './pages/Home';
import Game from './pages/Game';

const THEME_STORAGE_KEY = 'lolesportle-theme';

function usePersistentTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>((): 'light' | 'dark' => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return [ theme, setTheme ] as const;
}

function App() {
  const [ theme, setTheme ] = usePersistentTheme();

  return (
    <Theme
      appearance={theme}
      accentColor='blue'
      grayColor='sage'
      radius='small'
      scaling='105%'
    >
      <BrowserRouter>
        <Routes>
          <Route element={<Layout theme={theme} setTheme={setTheme} />}>
            <Route index path={ROUTES.HOME} element={<Home />} />
            <Route path='game'>
              <Route path={ROUTES.GAME_ALL} element={<Game region='ALL' />} />
              <Route path={ROUTES.GAME_LEC} element={<Game region='EU' />} />
              <Route path={ROUTES.GAME_LCS} element={<Game region='NA' />} />
              <Route path={ROUTES.GAME_LPL} element={<Game region='CH' />} />
              <Route path={ROUTES.GAME_LCK} element={<Game region='KR' />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </Theme>
  )
}

export default App
