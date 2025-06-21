// src/App.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginFaculty from './components/LoginFaculty.tsx';
import LoginAdmin from './components/LoginAdmin.tsx';
import DashboardFaculty from './components/DashboardFaculty.tsx';
import DashboardAdmin from './components/DashboardAdmin.tsx';
import AdminColleges from './components/Colleges.tsx';

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
