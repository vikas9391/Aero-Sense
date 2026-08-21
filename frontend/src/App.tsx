import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { RequireRole } from './components/RequireRole';

// Every page is code-split by route. Only the app shell (Layout, Navbar,
// Sidebar, auth/toast context) and the router itself are in the main
// chunk — each page's JS loads on first visit to that route instead of
// up front. LandingPage/LoginPage are the two most likely first paints
// so they stay eager to avoid a loading flash on the very first screen;
// everything behind auth is lazy since it's never needed until login.
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const AircraftPage = lazy(() => import('./pages/AircraftPage').then((m) => ({ default: m.AircraftPage })));
const AircraftDetailPage = lazy(() =>
  import('./pages/AircraftDetailPage').then((m) => ({ default: m.AircraftDetailPage }))
);
const ComponentsPage = lazy(() => import('./pages/ComponentsPage').then((m) => ({ default: m.ComponentsPage })));
const ComponentDetailPage = lazy(() =>
  import('./pages/ComponentDetailPage').then((m) => ({ default: m.ComponentDetailPage }))
);
const RegisterComponentPage = lazy(() =>
  import('./pages/RegisterComponentPage').then((m) => ({ default: m.RegisterComponentPage }))
);
const RegisterTagPage = lazy(() => import('./pages/RegisterTagPage').then((m) => ({ default: m.RegisterTagPage })));
const VerifyPage = lazy(() => import('./pages/VerifyPage').then((m) => ({ default: m.VerifyPage })));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage').then((m) => ({ default: m.MaintenancePage })));
const SecurityPage = lazy(() => import('./pages/SecurityPage').then((m) => ({ default: m.SecurityPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then((m) => ({ default: m.UsersPage })));
const CompaniesPage = lazy(() => import('./pages/CompaniesPage').then((m) => ({ default: m.CompaniesPage })));
const CompanyDetailPage = lazy(() =>
  import('./pages/CompanyDetailPage').then((m) => ({ default: m.CompanyDetailPage }))
);
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const NotAuthorizedPage = lazy(() =>
  import('./pages/NotAuthorizedPage').then((m) => ({ default: m.NotAuthorizedPage }))
);

// Minimal, on-brand fallback shown only for the brief moment a lazy
// route's chunk is downloading (typically imperceptible on a warm cache).
const RouteFallback: React.FC = () => (
  <div className="flex min-h-[40vh] items-center justify-center text-sm text-ash">Loading...</div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// The Super Admin has no company, so the operational dashboard (which reads
// aircraft/component data) isn't reachable for it — send it to company
// management instead. Everyone else lands on the normal dashboard.
const roleDestination = (role?: string) => (role === 'SUPER_ADMIN' ? '/companies' : '/dashboard');

// Root ("/") gate: unauthenticated visitors see the public landing page;
// authenticated users are sent into the app exactly as before. This is the
// only behavior change at "/" — every other protected route still goes
// through ProtectedRoute unchanged below.
const RootRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
        Authenticating session...
      </div>
    );
  }

  if (user) {
    return <Navigate to={roleDestination(user.role)} replace />;
  }

  return <LandingPage />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<RootRoute />} />
              <Route path="/login" element={<LoginPage />} />

              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/verify" element={<VerifyPage />} />
                <Route path="/aircraft" element={<AircraftPage />} />
                <Route path="/aircraft/:id" element={<AircraftDetailPage />} />
                <Route path="/components" element={<ComponentsPage />} />
                <Route path="/components/:id" element={<ComponentDetailPage />} />
                <Route path="/components/register" element={<RegisterComponentPage />} />
                <Route path="/nfc/register" element={<RegisterTagPage />} />
                <Route
                  path="/maintenance"
                  element={
                    <RequireRole allow={['COMPANY_ADMIN', 'MAINTENANCE_TECHNICIAN']}>
                      <MaintenancePage />
                    </RequireRole>
                  }
                />
                <Route path="/security" element={<SecurityPage />} />
                <Route
                  path="/users"
                  element={
                    <RequireRole allow={['COMPANY_ADMIN']}>
                      <UsersPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <RequireRole allow={['COMPANY_ADMIN']}>
                      <AnalyticsPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/companies"
                  element={
                    <RequireRole allow={['SUPER_ADMIN']}>
                      <CompaniesPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/companies/:id"
                  element={
                    <RequireRole allow={['SUPER_ADMIN']}>
                      <CompanyDetailPage />
                    </RequireRole>
                  }
                />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/not-authorized" element={<NotAuthorizedPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
};
export default App;
