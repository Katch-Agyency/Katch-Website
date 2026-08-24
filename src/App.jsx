import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SiteLayout } from './components/SiteLayout';
import HomePage from './pages/HomePage';

const DemosPage = lazy(() => import('./pages/DemosPage'));
const DemoDetailsPage = lazy(() => import('./pages/DemoDetailsPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const ProcessPage = lazy(() => import('./pages/ProcessPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AdminApp = lazy(() => import('./admin/AdminApp'));

function RouteLoading() {
  return <div className="route-loading" aria-label="Loading page" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="admin/*" element={<AdminApp />} />
          <Route element={<SiteLayout />}>
            <Route index element={<HomePage />} />
            <Route path="demos" element={<DemosPage />} />
            <Route path="demos/:projectId" element={<DemoDetailsPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="process" element={<ProcessPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="404" element={<NotFoundPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
