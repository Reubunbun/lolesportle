import { BrowserRouter, Routes, Route } from 'react-router';
import { ROUTES } from './constants';
import Layout from './layouts/main';
import Home from './pages/Home';
import Game from './pages/Game';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
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
  )
}

export default App
