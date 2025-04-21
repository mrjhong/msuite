import React from 'react';
import { Navigate, Outlet } from 'react-router';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token'); // Verificar si hay un token en el localStorage

  // Si no hay token, redirigir al login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Si hay token, renderizar la ruta solicitada
  return <Outlet />;
};

export default ProtectedRoute;