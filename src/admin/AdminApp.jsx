import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminAuthProvider } from './auth/AdminAuthContext';
import { ProtectedAdminRoute } from './auth/ProtectedAdminRoute';
import { AdminLayout } from './components/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminProjectDetailPage from './pages/AdminProjectDetailPage';
import AdminProjectsPage from './pages/AdminProjectsPage';
import './admin.css';

function AdminDocumentMeta() {
  useEffect(() => {
    document.title = 'Katch Admin';
    const robots = document.head.querySelector('meta[name="robots"]');
    const previous = robots?.getAttribute('content');
    robots?.setAttribute('content', 'noindex, nofollow, noarchive');
    return () => {
      if (previous) robots?.setAttribute('content', previous);
    };
  }, []);
  return null;
}

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <AdminDocumentMeta />
      <Routes>
        <Route path="login" element={<AdminLoginPage />} />
        <Route element={<ProtectedAdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="projects" element={<AdminProjectsPage />} />
            <Route path="projects/:projectId" element={<AdminProjectDetailPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminAuthProvider>
  );
}
