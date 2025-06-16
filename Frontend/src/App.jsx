import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from './components/Login';
import Signup from './components/Signup';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import HRDashboard from './pages/HRDashboard';
import DirectorDashboard from './pages/DirectorDashboard';
import InternDashboard from './pages/InternDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/manager-dashboard" element={<ManagerDashboard />} />
        <Route path="/hr-dashboard" element={<HRDashboard />} />
        <Route path="/director-dashboard" element={<DirectorDashboard />} />
        <Route path="/intern-dashboard" element={<InternDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
