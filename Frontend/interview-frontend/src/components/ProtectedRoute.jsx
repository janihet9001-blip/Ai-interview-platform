import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <FullPageSpinner />;
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'ADMIN' ? '/recruiter' : '/waiting'} replace />;
  }
  
  return children;
};