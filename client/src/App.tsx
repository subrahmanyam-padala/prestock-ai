import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import Markets from './pages/Markets';
import Portfolio from './pages/Portfolio';
import Research from './pages/Research';
import StockDetail from './pages/StockDetail';
import Watchlist from './pages/Watchlist';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/stock/:symbol" element={<StockDetail />} />
        <Route path="/research" element={<Research />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/watchlist" element={<Watchlist />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
