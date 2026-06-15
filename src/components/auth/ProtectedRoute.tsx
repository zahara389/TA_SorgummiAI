import React, { ReactNode } from 'react';

interface ProtectedRouteProps {
  isLoggedIn: boolean;
  role?: 'user' | 'admin';
  userRole?: 'user' | 'admin';
  children: ReactNode;
  fallback: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  isLoggedIn, 
  role, 
  userRole, 
  children, 
  fallback 
}) => {
  if (!isLoggedIn) {
    return <>{fallback}</>;
  }

  if (role && userRole !== role) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
