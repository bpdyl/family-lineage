import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import LoginModal from './components/auth/LoginModal';
import TreePage from './pages/TreePage';
import AnalyticsPage from './pages/AnalyticsPage';
import PathFinderPage from './pages/PathFinderPage';
import RelationshipPage from './pages/RelationshipPage';
import MissingDataPage from './pages/MissingDataPage';
import ExportPage from './pages/ExportPage';
import useAuthStore from './store/authStore';

export default function App() {
  const [loginOpen, setLoginOpen] = useState(false);
  const initialize = useAuthStore(s => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell onLoginClick={() => setLoginOpen(true)} />}>
          <Route path="/" element={<TreePage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/path-finder" element={<PathFinderPage />} />
          <Route path="/relationship" element={<RelationshipPage />} />
          <Route path="/missing-data" element={<MissingDataPage />} />
          <Route path="/export" element={<ExportPage />} />
        </Route>
      </Routes>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </BrowserRouter>
  );
}
