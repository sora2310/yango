import React from 'react';
import { Navigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
}

const AdminRoute: React.FC<Props> = ({ children }) => {
  const userData = localStorage.getItem('user');

  if (!userData) {
    return <Navigate to="/" replace />;
  }

  const user = JSON.parse(userData);

  if (user.rol !== 'admin') {
    return <Navigate to="/panel" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
