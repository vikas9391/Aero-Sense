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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400 text-sm">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
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
            <Route index element={<Navigate to="/dashboard" replace />} />
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
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
