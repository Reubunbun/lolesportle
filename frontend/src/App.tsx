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
          <Route path={ROUTES.GAME} element={<Game />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
