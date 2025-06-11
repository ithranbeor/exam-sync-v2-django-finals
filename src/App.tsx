// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import LoginFaculty from './components/LoginFaculty';
import LoginAdmin from './components/LoginAdmin';
import DashboardFaculty from './components/DashboardFaculty';
import DashboardAdmin from './components/DashboardAdmin';
import AdminColleges from './components/Colleges';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginFaculty />} />
      <Route path="/admin-login" element={<LoginAdmin />} />
      <Route path="/faculty-dashboard" element={<DashboardFaculty />} />
      <Route path="/admin-dashboard" element={<DashboardAdmin />} />
      <Route path="/admin-colleges" element={<AdminColleges />} />
    </Routes>
  );
}

export default App;
