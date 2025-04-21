import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { GlobalProvider } from './context/GlobalContext';
import PublicRoute from './components/security/PublicRoute';
import ProtectedRoute from './components/security/ProtectedRoute';


const App = () => {
  return (
    <GlobalProvider>
      <Router>
        <Routes>
          {/* Rutas públicas (solo accesibles si no estás logueado) */}
          <Route element={<PublicRoute />}>
            <Route path="/" element={<Login />} />
          </Route>

          {/* Rutas protegidas (solo accesibles si estás logueado) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
        </Routes>
      </Router>
    </GlobalProvider>
  );
};

export default App;