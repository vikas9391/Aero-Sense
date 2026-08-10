import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AircraftPage } from './pages/AircraftPage';
import { AircraftDetailPage } from './pages/AircraftDetailPage';
import { ComponentsPage } from './pages/ComponentsPage';
import { ComponentDetailPage } from './pages/ComponentDetailPage';
import { RegisterComponentPage } from './pages/RegisterComponentPage';
import { RegisterTagPage } from './pages/RegisterTagPage';
import { VerifyPage } from './pages/VerifyPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { SecurityPage } from './pages/SecurityPage';
import { ProfilePage } from './pages/ProfilePage';
import { UsersPage } from './pages/UsersPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f0fb] flex items-center justify-center text-slate-500 text-sm">
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
const RoleAwareIndexRedirect: React.FC = () => {
  const { user } = useAuth();
  const destination = user?.role === 'SUPER_ADMIN' ? '/companies' : '/dashboard';
  return <Navigate to={destination} replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RoleAwareIndexRedirect />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="verify" element={<VerifyPage />} />
            <Route path="aircraft" element={<AircraftPage />} />
            <Route path="aircraft/:id" element={<AircraftDetailPage />} />
            <Route path="components" element={<ComponentsPage />} />
            <Route path="components/:id" element={<ComponentDetailPage />} />
            <Route path="components/register" element={<RegisterComponentPage />} />
            <Route path="nfc/register" element={<RegisterTagPage />} />
            <Route path="maintenance" element={<MaintenancePage />} />
            <Route path="security" element={<SecurityPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="companies" element={<CompaniesPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<RoleAwareIndexRedirectFallback />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

// Same role-aware redirect, usable outside the protected layout tree for the
// catch-all route (unauthenticated users still fall through to /login via
// ProtectedRoute once they hit /dashboard or /companies).
const RoleAwareIndexRedirectFallback: React.FC = () => {
  const { user } = useAuth();
  const destination = user?.role === 'SUPER_ADMIN' ? '/companies' : '/dashboard';
  return <Navigate to={destination} replace />;
};

export default App;
