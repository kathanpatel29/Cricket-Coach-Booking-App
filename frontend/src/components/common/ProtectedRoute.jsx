import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Loading from './Loading';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to role-specific dashboard if accessing /dashboard
  if (location.pathname === '/dashboard') {
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'coach':
        return <Navigate to="/coach/dashboard" replace />;
      case 'client':
        return <Navigate to="/client/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    // Redirect unauthorized users to their respective dashboards
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'coach':
        return <Navigate to="/coach/dashboard" replace />;
      default:
        return <Navigate to="/client/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;