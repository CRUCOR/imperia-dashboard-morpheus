/**
 * Main App Component
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AnalysisPage from './pages/Analysis';
import AnalysisDetail from './pages/AnalysisDetail';
import Files from './pages/Files';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analisis" element={<AnalysisPage />} />
          <Route path="/analisis/:analysisId" element={<AnalysisDetail />} />
          <Route path="/archivos" element={<Files />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
