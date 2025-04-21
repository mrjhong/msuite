import React from 'react';
import { Navigate, Outlet } from 'react-router';

const PublicRoute = () => {
  const token = localStorage.getItem('token'); // Verificar si hay un token en el localStorage

  // Si hay token, redirigir al dashboard
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si no hay token, renderizar la ruta solicitada
  return <Outlet />;
};

export default PublicRoute;