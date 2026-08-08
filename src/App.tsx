import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentWorkspace } from './pages/DocumentWorkspace';

function App() {
  return (
    <Routes>
      <Route path='/' element={<Navigate to='/claims' replace />} />
      <Route path='/claims' element={<DashboardPage />} />
      <Route
        path='/claims/:claimId/workspace'
        element={<DocumentWorkspace />}
      />
      <Route path='*' element={<Navigate to='/claims' replace />} />
    </Routes>
  );
}

export default App;
