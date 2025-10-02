import { HashRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from './contexts/DataContext';
import HomePage from './pages/HomePage';
import MonthPage from './pages/MonthPage';
import Layout from './components/Layout';

function App() {
  return (
    <DataProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="months/:year/:month" element={<MonthPage />} />
            <Route path="months/:year/:month/page/:page" element={<MonthPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </DataProvider>
  );
}

export default App;