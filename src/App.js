import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HospitalDetails from './pages/HospitalDetails';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('username');
  });

  useEffect(() => {
    const user = localStorage.getItem('username');
    if (user) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={<LoginPage onLogin={() => setIsAuthenticated(true)} />} 
        />
        {/* <Route 
          path="/dashboard" 
          element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />} 
        /> */}
        <Route 
          path="/hospital-details" 
          element={isAuthenticated ? <HospitalDetails /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/" 
          element={isAuthenticated ? <DashboardPage />: <Navigate to="/login" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;