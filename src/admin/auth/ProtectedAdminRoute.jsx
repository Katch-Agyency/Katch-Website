import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from './adminAuthContext';
import { AdminLoadingScreen } from '../components/AdminStates';

export function ProtectedAdminRoute() {
  const { loading, user, isAdmin, configurationError } = useAdminAuth();
  const location = useLocation();

  if (loading) return <AdminLoadingScreen label="Checking secure access…" />;
  if (configurationError) return <Navigate to="/admin/login" replace state={{ configurationError: true }} />;
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
